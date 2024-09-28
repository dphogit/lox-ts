import { LoxObject } from "./types";

export class Token {
  constructor(
    readonly type: TokenType,
    readonly lexeme: string,
    readonly literal: LoxObject,
    readonly line: number,
  ) {}

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}

export const tokenFactory = {
  createAnd(line: number) {
    return new Token("AND", "and", null, line);
  },
  createBang(line: number) {
    return new Token("BANG", "!", null, line);
  },
  createEof(line: number) {
    return new Token("EOF", "", null, line);
  },
  createEqual(line: number) {
    return new Token("EQUAL", "=", null, line);
  },
  createEqualEqual(line: number) {
    return new Token("EQUAL_EQUAL", "==", null, line);
  },
  createFor(line: number) {
    return new Token("FOR", "for", null, line);
  },
  createIf(line: number) {
    return new Token("IF", "if", null, line);
  },
  createElse(line: number) {
    return new Token("ELSE", "else", null, line);
  },
  createIdentifier(lexeme: string, line: number) {
    return new Token("IDENTIFIER", lexeme, null, line);
  },
  createLeftBrace(line: number) {
    return new Token("LEFT_BRACE", "{", null, line);
  },
  createLeftParen(line: number) {
    return new Token("LEFT_PAREN", "(", null, line);
  },
  createLessThan(line: number) {
    return new Token("LESS", "<", null, line);
  },
  createMinus(line: number) {
    return new Token("MINUS", "-", null, line);
  },
  createNumber(literal: number, line: number) {
    return new Token("NUMBER", literal.toString(), literal, line);
  },
  createOr(line: number) {
    return new Token("OR", "or", null, line);
  },
  createRightBrace(line: number) {
    return new Token("RIGHT_BRACE", "}", null, line);
  },
  createRightParen(line: number) {
    return new Token("RIGHT_PAREN", ")", null, line);
  },
  createSemiColon(line: number) {
    return new Token("SEMICOLON", ";", null, line);
  },
  createString(literal: string, line: number) {
    return new Token("STRING", `"${literal}"`, literal, line);
  },
  createPlus(line: number) {
    return new Token("PLUS", "+", null, line);
  },
  createPrint(line: number) {
    return new Token("PRINT", "print", null, line);
  },
  createSlash(line: number) {
    return new Token("SLASH", "/", null, line);
  },
  createStar(line: number) {
    return new Token("STAR", "*", null, line);
  },
  createTrue(line: number) {
    return new Token("TRUE", "true", true, line);
  },
  createVar(line: number) {
    return new Token("VAR", "var", null, line);
  },
  createWhile(line: number) {
    return new Token("WHILE", "while", null, line);
  },
};

export type TokenType =
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "COMMA"
  | "DOT"
  | "MINUS"
  | "PLUS"
  | "SEMICOLON"
  | "SLASH"
  | "STAR"
  | "BANG"
  | "BANG_EQUAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "GREATER"
  | "GREATER_EQUAL"
  | "LESS"
  | "LESS_EQUAL"
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  | "AND"
  | "CLASS"
  | "ELSE"
  | "FALSE"
  | "FUN"
  | "FOR"
  | "IF"
  | "NIL"
  | "OR"
  | "PRINT"
  | "RETURN"
  | "SUPER"
  | "THIS"
  | "TRUE"
  | "VAR"
  | "WHILE"
  | "EOF";

export const keywords: Record<string, TokenType> = {
  and: "AND",
  class: "CLASS",
  else: "ELSE",
  false: "FALSE",
  for: "FOR",
  fun: "FUN",
  if: "IF",
  nil: "NIL",
  or: "OR",
  print: "PRINT",
  return: "RETURN",
  super: "SUPER",
  this: "THIS",
  true: "TRUE",
  var: "VAR",
  while: "WHILE",
} as const;
