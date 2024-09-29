import { IErrorReporter, SyntaxError } from "./error";
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VarExpr,
} from "./expression";
import {
  BlockStmt,
  ExprStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from "./statement";
import { Token, TokenType } from "./token";
import { FunctionKind } from "./types";

export class Parser {
  private currentIndex = 0; // Points to current token during parsing

  constructor(
    private tokens: Token[],
    private errorReporter: IErrorReporter,
  ) {}

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      var stmt = this.declaration();
      if (stmt !== null) statements.push(stmt);
    }
    return statements;
  }

  private declaration(): Stmt | null {
    try {
      if (this.match("FUN")) return this.functionDeclaration("function");
      if (this.match("VAR")) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.synchronize();
      }
      return null;
    }
  }

  private functionDeclaration(kind: FunctionKind): FunctionStmt {
    const name = this.consume("IDENTIFIER", `Expect ${kind} name.`);
    this.consume("LEFT_PAREN", `Expect '(' after ${kind} name.`);

    // Parse parameters of the function
    const params: Token[] = [];
    if (!this.check("RIGHT_PAREN")) {
      do {
        if (params.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters");
        }
        params.push(this.consume("IDENTIFIER", "Expect parameter name."));
      } while (this.match("COMMA"));
    }

    this.consume("RIGHT_PAREN", "Expect ')' after parameters.");
    this.consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);

    const body = this.block();
    return new FunctionStmt(name, params, body);
  }

  private varDeclaration(): VarStmt {
    const varName = this.consume("IDENTIFIER", "Expect variable name.");

    const initializer = this.match("EQUAL") ? this.expression() : undefined;

    this.consume("SEMICOLON", "Expect ';' after declaration.");
    return new VarStmt(varName, initializer);
  }

  private statement(): Stmt {
    if (this.match("FOR")) return this.forStatement();
    if (this.match("IF")) return this.ifStatement();
    if (this.match("PRINT")) return this.printStatement();
    if (this.match("RETURN")) return this.returnStatement();
    if (this.match("WHILE")) return this.whileStatement();
    if (this.match("LEFT_BRACE")) return new BlockStmt(this.block());
    return this.expressionStatement();
  }

  // A for loop can be represented by desugaring a while statement
  private forStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'for'.");

    const initializer = this.match("SEMICOLON")
      ? null
      : this.match("VAR")
        ? this.varDeclaration()
        : this.expressionStatement();

    // The condition defaults to true if omitted, creating an infinite loop.
    const condition = this.check("SEMICOLON")
      ? new LiteralExpr(true)
      : this.expression();
    this.consume("SEMICOLON", "Expect ';' after loop condition.");

    const increment = this.check("RIGHT_PAREN") ? null : this.expression();
    this.consume("RIGHT_PAREN", "Expect ')' after for clauses.");

    let body = this.statement();

    // If there is an increment, we execute it after the existing body.
    if (increment) {
      body = new BlockStmt([body, new ExprStmt(increment)]);
    }

    // Build a primitive while loop
    body = new WhileStmt(condition, body);

    // If there is an initializer, it runs once before the entire loop body.
    if (initializer) {
      body = new BlockStmt([initializer, body]);
    }

    return body;
  }

  private ifStatement(): IfStmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume("RIGHT_PAREN", "Expect ')' after if condition.");

    const thenBranch = this.statement();
    const elseBranch = this.match("ELSE") ? this.statement() : undefined;

    return new IfStmt(condition, thenBranch, elseBranch);
  }

  private printStatement(): PrintStmt {
    const value = this.expression();
    this.consume("SEMICOLON", "Expect ';' after expression.");
    return new PrintStmt(value);
  }

  private returnStatement(): ReturnStmt {
    const keyword = this.previous();
    const value = this.check("SEMICOLON") ? undefined : this.expression();
    this.consume("SEMICOLON", "Expect ';' after return value.");
    return new ReturnStmt(keyword, value);
  }

  private whileStatement(): WhileStmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume("RIGHT_PAREN", "Expect ')' after while condition.");

    const body = this.statement();

    return new WhileStmt(condition, body);
  }

  private expressionStatement(): ExprStmt {
    const expr = this.expression();
    this.consume("SEMICOLON", "Expect ';' after expression.");
    return new ExprStmt(expr);
  }

  private block(): Stmt[] {
    const statements = [];

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const statement = this.declaration();
      if (statement) {
        statements.push(statement);
      }
    }

    this.consume("RIGHT_BRACE", "Expect '}' after block.");
    return statements;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    var expr = this.logicalOr();

    if (this.match("EQUAL")) {
      const equalsToken = this.previous();
      const value = this.assignment();

      if (expr instanceof VarExpr) {
        return new AssignExpr(expr.name, value);
      }

      this.error(equalsToken, "Invalid assignment target.");
    }

    return expr;
  }

  private logicalOr(): Expr {
    return this.leftAssociativeLogicalOperators(() => this.logicalAnd(), "OR");
  }

  private logicalAnd(): Expr {
    return this.leftAssociativeLogicalOperators(() => this.equality(), "AND");
  }

  private equality(): Expr {
    return this.leftAssociativeBinaryOperators(
      () => this.comparison(),
      "BANG_EQUAL",
      "EQUAL_EQUAL",
    );
  }

  private comparison(): Expr {
    return this.leftAssociativeBinaryOperators(
      () => this.term(),
      "GREATER",
      "GREATER_EQUAL",
      "LESS",
      "LESS_EQUAL",
    );
  }

  private term(): Expr {
    return this.leftAssociativeBinaryOperators(
      () => this.factor(),
      "MINUS",
      "PLUS",
    );
  }

  private factor(): Expr {
    return this.leftAssociativeBinaryOperators(
      () => this.unary(),
      "STAR",
      "SLASH",
    );
  }

  private unary(): Expr {
    if (this.match("BANG", "MINUS")) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpr(operator, right);
    }

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match("LEFT_PAREN")) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): Expr {
    if (this.match("FALSE")) return new LiteralExpr(false);
    if (this.match("TRUE")) return new LiteralExpr(true);
    if (this.match("NIL")) return new LiteralExpr(null);

    if (this.match("NUMBER", "STRING")) {
      return new LiteralExpr(this.previous().literal);
    }

    if (this.match("IDENTIFIER")) {
      return new VarExpr(this.previous());
    }

    if (this.match("LEFT_PAREN")) {
      const expr = this.expression();
      this.consume("RIGHT_PAREN", "Expect ')' after expression.");
      return new GroupingExpr(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  /**
   * Helper to parse left-associative series of binary operators that have the
   * the grammer: <head> -> <r> ((binary op a | binary op b | ...) <r> )* ;
   * where <r> is the nonterminal of the next higher precedence. To read more:
   * @see https://www.craftinginterpreters.com/representing-code.html
   * @see https://www.craftinginterpreters.com/parsing-expressions.html
   */
  private leftAssociativeBinaryOperators(
    operand: () => Expr,
    ...types: TokenType[]
  ): Expr {
    let expr = operand();

    while (this.match(...types)) {
      const operator = this.previous();
      const right = operand();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  /**
   * @see leftAssociativeBinaryOperators
   */
  private leftAssociativeLogicalOperators(
    operand: () => Expr,
    ...types: TokenType[]
  ): Expr {
    let expr = operand();

    while (this.match(...types)) {
      const operator = this.previous();
      const right = operand();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];

    // Parse arguments if we don't immediately encounter closing parenthesis.
    if (!this.check("RIGHT_PAREN")) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match("COMMA"));
    }

    const paren = this.consume("RIGHT_PAREN", "Expect ')' after arguments.");

    return new CallExpr(callee, args, paren);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    return this.isAtEnd() ? false : this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.currentIndex++;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private peek(): Token {
    return this.tokens[this.currentIndex];
  }

  private previous(): Token {
    return this.tokens[this.currentIndex - 1];
  }

  private error(token: Token, message: string): SyntaxError {
    const syntaxError =
      token.type === "EOF"
        ? new SyntaxError(message, token.line, "at end")
        : new SyntaxError(message, token.line, `at ${token.lexeme}`);

    this.errorReporter.report(syntaxError);
    return syntaxError;
  }

  /**
   * Synchronizes the recursive descent parser by discarding tokens until
   * a statement boundary is found.
   */
  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === "SEMICOLON") return;

      switch (this.peek().type) {
        case "CLASS":
        case "FUN":
        case "VAR":
        case "FOR":
        case "IF":
        case "WHILE":
        case "PRINT":
        case "RETURN":
          return;
      }

      this.advance();
    }
  }
}
