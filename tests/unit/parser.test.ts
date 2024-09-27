import { describe, expect, test } from "vitest";

import { Parser } from "../../src/parser";
import { ErrorReporter } from "../../src/error";
import { Token, tokenFactory } from "../../src/token";
import { BlockStmt, ExprStmt, PrintStmt, VarStmt } from "../../src/statement";
import { BinaryExpr, LiteralExpr } from "../../src/expression";

function createParser(tokens: Token[]) {
  return new Parser(tokens, new ErrorReporter());
}

describe("Parser class", () => {
  test("sum returns binary expression statement", () => {
    const parser = createParser([
      tokenFactory.createNumber(1, 1),
      tokenFactory.createPlus(1),
      tokenFactory.createNumber(2, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);

    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ExprStmt);

    const expr = (result[0] as ExprStmt).expr;

    expect(expr).toBeInstanceOf(BinaryExpr);

    const binaryExpr = expr as BinaryExpr;
    const { left, right, operator } = binaryExpr;

    expect(left).toBeInstanceOf(LiteralExpr);
    expect(right).toBeInstanceOf(LiteralExpr);

    const leftValue = (left as LiteralExpr).value;
    const rightValue = (right as LiteralExpr).value;

    expect(leftValue).toEqual(1);
    expect(rightValue).toEqual(2);
    expect(operator.lexeme).toEqual("+");
  });

  test("var declaration with initializer returns var declaration statement", () => {
    const parser = createParser([
      tokenFactory.createVar(1),
      tokenFactory.createIdentifier("x", 1),
      tokenFactory.createEqual(1),
      tokenFactory.createNumber(69, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);

    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(VarStmt);

    const { name, initializer } = result[0] as VarStmt;

    expect(name.lexeme).toEqual("x");

    expect(initializer).toBeInstanceOf(LiteralExpr);
    expect((initializer as LiteralExpr).value).toEqual(69);
  });

  test("block containing print literal returns correct statements", () => {
    const parser = createParser([
      tokenFactory.createLeftBrace(1),

      tokenFactory.createPrint(2),
      tokenFactory.createString("Hello, World!", 2),
      tokenFactory.createSemiColon(2),

      tokenFactory.createRightBrace(3),
      tokenFactory.createEof(3),
    ]);

    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(BlockStmt);

    const { statements } = result[0] as BlockStmt;

    expect(statements).toHaveLength(1);
    expect(statements[0]).toBeInstanceOf(PrintStmt);

    const { expr } = statements[0] as PrintStmt;

    expect(expr).toBeInstanceOf(LiteralExpr);
    expect((expr as LiteralExpr).value).toEqual("Hello, World!");
  });
});
