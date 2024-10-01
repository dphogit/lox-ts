import { IErrorReporter, ResolvingError } from "./error";
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GetExpr,
  GroupingExpr,
  IExprVisitor,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  UnaryExpr,
  VarExpr,
} from "./expression";
import { Interpreter } from "./interpreter";
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

type FunctionType = "NONE" | "FUNCTION" | "METHOD";

/**
 * A block scope where keys are the variable names, mapping to a boolean value
 * which is true when that variable's initializer has been resolved.
 */
type Scope = Record<string, boolean>;

/**
 * Represents the stack of local block scopes kept track of during resolving.
 * The global scope of variables are not tracked by the resolver.
 */
class ScopeStack extends Array<Scope> {
  isEmpty(): boolean {
    return this.length < 1;
  }

  peek(): Scope {
    if (this.isEmpty()) throw new Error("Scope stack is empty.");
    return this[this.length - 1];
  }
}

export class Resolver implements IExprVisitor<void>, IStmtVisitor<void> {
  private readonly scopes: ScopeStack = new ScopeStack();
  private currentFunction: FunctionType = "NONE"; // Tracks if currently visting a function declaration.

  constructor(
    private readonly interpreter: Interpreter,
    private readonly errorReporter: IErrorReporter,
  ) {}

  resolve(value: Stmt[] | Stmt | Expr): void {
    if (Array.isArray(value)) {
      for (const stmt of value) {
        this.resolve(stmt);
      }
      return;
    }

    return value.accept(this);
  }

  // ---------- Expressions ----------

  visitAssignExpr(expr: AssignExpr): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitCallExpr(expr: CallExpr): void {
    this.resolve(expr.callee);
    for (const arg of expr.args) {
      this.resolve(arg);
    }
  }

  visitGetExpr(expr: GetExpr): void {
    this.resolve(expr.obj);
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolve(expr.expression);
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitLiteralExpr(_: LiteralExpr): void {}

  visitSetExpr(expr: SetExpr): void {
    this.resolve(expr.value);
    this.resolve(expr.obj);
  }

  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolve(expr.right);
  }

  visitVarExpr(expr: VarExpr): void {
    // If variable exists in the current scope but has value false, it has
    // been declared but not defined. The variable is being accessed in it's
    // own initializer which we do not allow. Report that error.
    if (
      !this.scopes.isEmpty() &&
      this.scopes.peek()[expr.name.lexeme] === false
    ) {
      this.error(
        "Can't read local variable in its own initializer.",
        expr.name.line,
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  // ---------- Statements ----------

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  visitClassStmt(stmt: ClassStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);

    for (const method of stmt.methods) {
      const declaration: FunctionType = "METHOD";
      this.resolveFunction(method, declaration);
    }
  }

  visitExprStmt(stmt: ExprStmt): void {
    this.resolve(stmt.expr);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, "FUNCTION");
  }

  visitIfStmt(stmt: IfStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch) this.resolve(stmt.elseBranch);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    this.resolve(stmt.expr);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction === "NONE") {
      this.error("Can't return from top-level code.", stmt.keyword.line);
    }

    if (stmt.value) this.resolve(stmt.value);
  }

  visitVarStmt(stmt: VarStmt): void {
    this.declare(stmt.name);
    if (stmt.initializer) this.resolve(stmt.initializer);
    this.define(stmt.name);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  // ---------- Helper methods ----------

  private error(message: string, line: number): void {
    this.errorReporter.report(new ResolvingError(message, line));
  }

  private beginScope(): void {
    this.scopes.push({});
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    if (this.scopes.isEmpty()) return;

    const scope = this.scopes.peek();

    if (scope.hasOwnProperty(name.lexeme)) {
      this.error("Already a variable with this name in this scope.", name.line);
    }

    scope[name.lexeme] = false;
  }

  private define(name: Token): void {
    if (this.scopes.isEmpty()) return;

    const scope = this.scopes.peek();
    scope[name.lexeme] = true;
  }

  private resolveLocal(expr: Expr, name: Token): void {
    // Start from the inner most scope and work outwards of each scope.
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].hasOwnProperty(name.lexeme)) {
        // When found, resolve with number of scopes in between.
        const distance = this.scopes.length - 1 - i;
        this.interpreter.resolve(expr, distance);
        return;
      }
    }

    // The variable is unresolved and assume it's global.
  }

  private resolveFunction(stmt: FunctionStmt, type: FunctionType): void {
    const enclosingFn = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();

    for (const param of stmt.params) {
      this.declare(param);
      this.define(param);
    }

    this.resolve(stmt.body);
    this.endScope();

    this.currentFunction = enclosingFn;
  }
}
