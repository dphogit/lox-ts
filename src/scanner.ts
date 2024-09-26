import { IErrorReporter, SyntaxError } from "./error";
import { keywords, Token, tokenFactory, TokenType } from "./token";
import { LoxObject } from "./types";

export class Scanner {
  private tokens: Token[] = [];

  // Keep track of where we are in the source string
  private startIndex = 0;
  private currentIndex = 0;
  private line = 1;

  constructor(
    private readonly source: string,
    private readonly errorReporter: IErrorReporter,
  ) {}

  scanTokens() {
    while (!this.isAtEnd()) {
      this.startIndex = this.currentIndex;
      this.scanToken();
    }

    this.tokens.push(tokenFactory.createEof(this.line));
    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();

    switch (c) {
      case "(":
        this.addToken("LEFT_PAREN");
        return;
      case ")":
        this.addToken("RIGHT_PAREN");
        return;
      case "{":
        this.addToken("LEFT_BRACE");
        return;
      case "}":
        this.addToken("RIGHT_BRACE");
        return;
      case ",":
        this.addToken("COMMA");
        return;
      case ".":
        this.addToken("DOT");
        return;
      case "-":
        this.addToken("MINUS");
        return;
      case "+":
        this.addToken("PLUS");
        return;
      case ";":
        this.addToken("SEMICOLON");
        return;
      case "*":
        this.addToken("STAR");
        return;
      case "!":
        this.addToken(this.match("=") ? "BANG_EQUAL" : "BANG");
        return;
      case "=":
        this.addToken(this.match("=") ? "EQUAL_EQUAL" : "EQUAL");
        return;
      case "<":
        this.addToken(this.match("=") ? "LESS_EQUAL" : "LESS");
        return;
      case ">":
        this.addToken(this.match("=") ? "GREATER_EQUAL" : "GREATER");
        return;
      case "/":
        if (this.match("/")) {
          this.inlineComment();
          return;
        }

        if (this.match("*")) {
          this.blockComment();
          return;
        }

        this.addToken("SLASH");
        return;
      case " ":
      case "\r":
      case "\t":
        return; // Ignore whitespace
      case "\n":
        this.line++;
        return;
      case '"':
        this.string();
        return;
      default:
        if (isDigit(c)) {
          this.number();
          return;
        }

        if (isAlpha(c)) {
          this.identifier();
          return;
        }

        this.errorReporter.report(
          new SyntaxError(`Unexpected character '${c}'`, this.line),
        );
        return;
    }
  }

  private identifier() {
    while (isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.startIndex, this.currentIndex);
    this.addToken(text in keywords ? keywords[text] : "IDENTIFIER");
  }

  private number() {
    while (isDigit(this.peek())) {
      this.advance();
    }

    // Consume fractional part if exist (decimal point and following digits)
    if (this.peek() === "." && isDigit(this.peekNext())) {
      do {
        this.advance();
      } while (isDigit(this.peek()));
    }

    this.addToken(
      "NUMBER",
      Number.parseFloat(
        this.source.substring(this.startIndex, this.currentIndex),
      ),
    );
  }

  private string() {
    // Consume characters until the closing quote of the string.
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.errorReporter.report(
        new SyntaxError("Unterminated string.", this.line),
      );
      return;
    }

    // Consume the closing quote. Add string token containing the literal.
    this.advance();
    this.addToken(
      "STRING",
      this.source.substring(this.startIndex + 1, this.currentIndex - 1),
    );
  }

  private inlineComment() {
    // Keep consuming the tokens until we reach end of line (or file)
    while (this.peek() !== "\n" && !this.isAtEnd()) {
      this.advance();
    }
  }

  // No nested block comments to encourage code simplicity.
  private blockComment() {
    while (this.peek() !== "*" && this.peekNext() !== "/" && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.errorReporter.report(
        new SyntaxError("Unterminated comment.", this.line),
      );
      return;
    }

    // Consume the closing star and slash
    this.advance();
    this.advance();
  }

  private match(expected: string) {
    if (this.isAtEnd() || this.source.charAt(this.currentIndex) !== expected)
      return false;

    this.currentIndex++;
    return true;
  }

  private peek() {
    return this.isAtEnd() ? "\0" : this.source.charAt(this.currentIndex);
  }

  private peekNext() {
    return this.currentIndex + 1 >= this.source.length
      ? "\0"
      : this.source.charAt(this.currentIndex + 1);
  }

  private isAtEnd() {
    return this.currentIndex >= this.source.length;
  }

  private advance() {
    return this.source[this.currentIndex++];
  }

  private addToken(type: TokenType, literal: LoxObject = null) {
    const lexeme = this.source.substring(this.startIndex, this.currentIndex);
    this.tokens.push(new Token(type, lexeme, literal, this.line));
  }
}

function getCharCode(c: string) {
  if (c.length !== 1) throw new Error("String must be of length 1.");
  return c.charCodeAt(0);
}

function isDigit(c: string) {
  if (c.length !== 1) throw new Error("String must be of length 1.");
  const code = getCharCode(c);
  return code >= getCharCode("0") && code <= getCharCode("9");
}

function isAlpha(c: string) {
  if (c.length !== 1) throw new Error("String must be of length 1.");
  const code = getCharCode(c);
  return (
    (code >= getCharCode("a") && code <= getCharCode("z")) ||
    (code >= getCharCode("A") && code <= getCharCode("Z")) ||
    code === getCharCode("_")
  );
}

function isAlphaNumeric(c: string) {
  if (c.length !== 1) throw new Error("String must be of length 1.");
  return isAlpha(c) || isDigit(c);
}
