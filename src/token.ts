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
