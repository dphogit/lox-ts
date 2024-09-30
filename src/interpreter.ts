import { Environment } from "./environment";
import { IErrorReporter, RuntimeError } from "./error";
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  IExprVisitor,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VarExpr,
} from "./expression";
import { LoxClock } from "./native";
import {
  BlockStmt,
  ClassStmt,
  ExprStmt,
  FunctionStmt,
  IfStmt,
  IStmtVisitor,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from "./statement";
import { Token } from "./token";
import {
  LoxCallable,
  LoxClass,
  LoxFunction,
  LoxObject,
  LoxReturn,
} from "./types";

/**
 * Evaluates and computes values for provided expressions.
 */
export class Interpreter
  implements IExprVisitor<LoxObject>, IStmtVisitor<void>
{
  private readonly locals: Map<Expr, number> = new Map(); // Side table to associate syntax tree node with resolved data.
  private readonly globals = new Environment(); // Fixed reference to outermost global environment.
  private environment: Environment = this.globals; // Tracks current innermost environment, acts as the closure.

  constructor(private errorReporter: IErrorReporter) {
    this.globals.define("clock", new LoxClock());
  }

  interpret(statements: Stmt[]): void {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) this.errorReporter.report(error);
    }
  }

  // ---------- Expressions ----------

  visitAssignExpr(expr: AssignExpr): LoxObject {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance === undefined) {
      this.globals.assign(expr.name, value);
    } else {
      this.environment.assignAt(distance, expr.name, value);
    }

    return value;
  }

  visitBinaryExpr(expr: BinaryExpr): LoxObject {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    const optr = expr.operator;

    // Custom Lox RuntimeError's are thrown if type checks fail
    switch (optr.type) {
      case "GREATER":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left > right;
        break;

      case "GREATER_EQUAL":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left >= right;
        break;

      case "LESS":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left < right;
        break;

      case "LESS_EQUAL":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left <= right;
        break;

      case "BANG_EQUAL":
        return left !== right;

      case "EQUAL_EQUAL":
        return left === right;

      case "MINUS":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left - right;
        break;

      case "PLUS":
        if (typeof left === "string" || typeof right === "string") {
          return stringify(left) + stringify(right);
        }

        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        throw new RuntimeError(
          optr,
          "Operands must be two numbers, or one operand must be a string.",
        );

      case "SLASH":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left / right;
        break;

      case "STAR":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left * right;
        break;
    }

    return null; // Unreachable.
  }

  visitCallExpr(expr: CallExpr): LoxObject {
    const callee = this.evaluate(expr.callee);

    const args: LoxObject[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(
        expr.closingParen,
        "Can only call functions and classes.",
      );
    }

    const fn = callee as LoxCallable;

    if (args.length !== fn.arity()) {
      throw new RuntimeError(
        expr.closingParen,
        `Expected ${fn.arity()} arguments but got ${args.length}.`,
      );
    }

    return fn.call(this, args);
  }

  visitGroupingExpr(expr: GroupingExpr): LoxObject {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): LoxObject {
    return expr.value;
  }

  visitLogicalExpr(expr: LogicalExpr): LoxObject {
    const left = this.evaluate(expr.left);

    // Evaluate the left operand first to see if can short-circuit.
    // Logical expressions will return a value with appropriate truthiness.
    if (expr.operator.type === "OR") {
      if (isTruthy(left)) return left;
    } else if (expr.operator.type === "AND") {
      if (!isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr): LoxObject {
    const right = this.evaluate(expr.right);
    const optr = expr.operator;

    // Custom Lox RuntimeError's are thrown if type checks fail
    switch (optr.type) {
      case "BANG":
        return !isTruthy(right);
      case "MINUS":
        if (checkNumberOperand(optr, right)) return -right;
        break;
    }

    return null; // Unreachable.
  }

  visitVarExpr(expr: VarExpr): LoxObject {
    return this.lookUpVariable(expr.name, expr);
  }

  private evaluate(expr: Expr): LoxObject {
    return expr.accept(this);
  }

  private lookUpVariable(name: Token, expr: Expr): LoxObject {
    const distance = this.locals.get(expr);

    return distance === undefined
      ? this.globals.get(name)
      : this.environment.getAt(distance, name.lexeme);
  }

  // ---------- STATEMENTS ----------

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitClassStmt(stmt: ClassStmt): void {
    this.environment.define(stmt.name.lexeme, null);
    const klass = new LoxClass(stmt.name.lexeme);
    this.environment.assign(stmt.name, klass);
  }

  visitExprStmt(stmt: ExprStmt): void {
    this.evaluate(stmt.expr);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const fn = new LoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, fn);
  }

  visitIfStmt(stmt: IfStmt): void {
    if (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
      return;
    }

    if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expr);
    console.log(stringify(value));
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = stmt.value ? this.evaluate(stmt.value) : null;
    throw new LoxReturn(value);
  }

  visitVarStmt(stmt: VarStmt): void {
    const value =
      stmt.initializer !== undefined ? this.evaluate(stmt.initializer) : null;
    this.environment.define(stmt.name.lexeme, value);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  private execute(stmt: Stmt) {
    return stmt.accept(this);
  }

  // Executes statements in the context of a given environment
  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment; // Keep reference to original environment

    try {
      this.environment = environment;

      for (const stmt of statements) {
        this.execute(stmt);
      }
    } finally {
      this.environment = previous; // Restore the original environment
    }
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }
}

function isTruthy(obj: LoxObject): boolean {
  if (obj === null) return false;
  if (typeof obj === "boolean") return obj;
  return true;
}

function checkNumberOperand(
  operator: Token,
  operand: LoxObject,
): operand is number {
  if (typeof operand === "number") return true;
  throw new RuntimeError(operator, "Operand must be a number.");
}

function stringify(obj: LoxObject) {
  if (obj === null) return "nil";

  if (typeof obj === "number") {
    const text = obj.toString();
    return text.endsWith(".0") ? text.substring(0, text.length - 2) : text;
  }

  return obj.toString();
}
