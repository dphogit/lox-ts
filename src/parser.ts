import { IErrorReporter, SyntaxError } from "./error";
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "./expression";
import { Token, TokenType } from "./token";

export class Parser {
  private currentIndex = 0; // Points to current token during parsing

  constructor(
    private tokens: Token[],
    private errorReporter: IErrorReporter,
  ) {}

  parse(): Expr | null {
    try {
      return this.expression();
    } catch (error) {
      if (error instanceof SyntaxError) return null;
      throw error;
    }
  }
  private expression(): Expr {
    return this.equality();
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
