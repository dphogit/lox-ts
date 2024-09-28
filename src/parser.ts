import { IErrorReporter, SyntaxError } from "./error";
import {
  AssignExpr,
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VarExpr,
} from "./expression";
import {
  BlockStmt,
  ExprStmt,
  IfStmt,
  PrintStmt,
  Stmt,
  VarStmt,
} from "./statement";
import { Token, TokenType } from "./token";

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
      if (this.match("VAR")) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.synchronize();
      }
      return null;
    }
  }

  private varDeclaration(): VarStmt {
    const varName = this.consume("IDENTIFIER", "Expect variable name.");

    const initializer = this.match("EQUAL") ? this.expression() : undefined;

    this.consume("SEMICOLON", "Expect ';' after declaration.");
    return new VarStmt(varName, initializer);
  }

  private statement(): Stmt {
    if (this.match("IF")) return this.ifStatement();
    if (this.match("PRINT")) return this.printStatement();
    if (this.match("LEFT_BRACE")) return new BlockStmt(this.block());
    return this.expressionStatement();
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
    var expr = this.equality();

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

    return this.primary();
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
   * the grammer: <head> -> <r> (("!=" | "==") <r> )* ; where <r> is the
   * nonterminal of the next higher precedence. To read more:
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
