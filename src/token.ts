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
  createEof(line: number) {
    return new Token("EOF", "", null, line);
  },
  createEqual(line: number) {
    return new Token("EQUAL", "=", null, line);
  },
  createIdentifier(lexeme: string, line: number) {
    return new Token("IDENTIFIER", lexeme, null, line);
  },
  createMinus(line: number) {
    return new Token("MINUS", "-", null, line);
  },
  createNumber(literal: number, line: number) {
    return new Token("NUMBER", literal.toString(), literal, line);
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
  createVar(line: number) {
    return new Token("VAR", "var", null, line);
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
