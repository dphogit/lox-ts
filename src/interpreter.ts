import { Environment } from "./environment";
import { IErrorReporter, RuntimeError } from "./error";
import {
  AssignExpr,
  BinaryExpr,
  Expr,
  GroupingExpr,
  IExprVisitor,
  LiteralExpr,
  UnaryExpr,
  VarExpr,
} from "./expression";
import {
  BlockStmt,
  ExprStmt,
  IfStmt,
  IStmtVisitor,
  PrintStmt,
  Stmt,
  VarStmt,
} from "./statement";
import { Token } from "./token";
import { LoxObject } from "./types";

/**
 * Evaluates and computes values for provided expressions.
 */
export class Interpreter
  implements IExprVisitor<LoxObject>, IStmtVisitor<void>
{
  // Points to the current (innermost) environment, initially set to global.
  private environment: Environment = new Environment();

  constructor(private errorReporter: IErrorReporter) {}

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
    this.environment.assign(expr.name, value);
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

  visitGroupingExpr(expr: GroupingExpr): LoxObject {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): LoxObject {
    return expr.value;
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
    return this.environment.get(expr.name);
  }

  private evaluate(expr: Expr): LoxObject {
    return expr.accept(this);
  }

  // ---------- STATEMENTS ----------

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitExprStmt(stmt: ExprStmt): void {
    this.evaluate(stmt.expr);
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

  visitVarStmt(stmt: VarStmt): void {
    const value =
      stmt.initializer !== undefined ? this.evaluate(stmt.initializer) : null;
    this.environment.define(stmt.name.lexeme, value);
  }

  private execute(stmt: Stmt) {
    return stmt.accept(this);
  }

  // Executes statements in the context of a given environment
  private executeBlock(statements: Stmt[], environment: Environment) {
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
