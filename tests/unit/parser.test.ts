import { describe, expect, test } from "vitest";

import { Parser } from "../../src/parser";
import { ErrorReporter } from "../../src/error";
import { Token, tokenFactory } from "../../src/token";
import {
  BlockStmt,
  ExprStmt,
  IfStmt,
  PrintStmt,
  VarStmt,
  WhileStmt,
} from "../../src/statement";
import {
  AssignExpr,
  BinaryExpr,
  LiteralExpr,
  LogicalExpr,
  VarExpr,
} from "../../src/expression";

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

  test("if else returns correct statements", () => {
    const parser = createParser([
      tokenFactory.createIf(1),
      tokenFactory.createLeftParen(1),
      tokenFactory.createTrue(1),
      tokenFactory.createRightParen(1),
      tokenFactory.createPrint(1),
      tokenFactory.createString("true branch", 1),
      tokenFactory.createSemiColon(1),

      tokenFactory.createElse(2),
      tokenFactory.createPrint(2),
      tokenFactory.createString("else branch", 2),
      tokenFactory.createSemiColon(2),
      tokenFactory.createEof(2),
    ]);

    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(IfStmt);

    const { condition, thenBranch, elseBranch } = result[0] as IfStmt;

    expect(condition).toBeInstanceOf(LiteralExpr);
    expect((condition as LiteralExpr).value).toEqual(true);

    expect(thenBranch).toBeInstanceOf(PrintStmt);
    const printStmt = thenBranch as PrintStmt;
    expect(printStmt.expr).toBeInstanceOf(LiteralExpr);
    expect((printStmt.expr as LiteralExpr).value).toEqual("true branch");

    expect(elseBranch).toBeInstanceOf(PrintStmt);
    const printStmt2 = elseBranch as PrintStmt;
    expect(printStmt2.expr).toBeInstanceOf(LiteralExpr);
    expect((printStmt2.expr as LiteralExpr).value).toEqual("else branch");
  });

  test("logical or returns correct expression statement", () => {
    const parser = createParser([
      tokenFactory.createNumber(69, 1),
      tokenFactory.createOr(1),
      tokenFactory.createNumber(420, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);

    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ExprStmt);

    const { expr } = result[0] as ExprStmt;

    expect(expr).toBeInstanceOf(LogicalExpr);
    const { operator, left, right } = expr as LogicalExpr;

    expect(operator.lexeme).toEqual("or");

    expect(left).toBeInstanceOf(LiteralExpr);
    expect((left as LiteralExpr).value).toEqual(69);

    expect(right).toBeInstanceOf(LiteralExpr);
    expect((right as LiteralExpr).value).toEqual(420);
  });

  test("logical and returns correct expression statement", () => {
    const parser = createParser([
      tokenFactory.createNumber(69, 1),
      tokenFactory.createAnd(1),
      tokenFactory.createNumber(420, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);

    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ExprStmt);

    const { expr } = result[0] as ExprStmt;

    expect(expr).toBeInstanceOf(LogicalExpr);
    const { operator, left, right } = expr as LogicalExpr;

    expect(operator.lexeme).toEqual("and");

    expect(left).toBeInstanceOf(LiteralExpr);
    expect((left as LiteralExpr).value).toEqual(69);

    expect(right).toBeInstanceOf(LiteralExpr);
    expect((right as LiteralExpr).value).toEqual(420);
  });

  test("while loop returns correct statements", () => {
    const parser = createParser([
      tokenFactory.createWhile(1),
      tokenFactory.createLeftParen(1),
      tokenFactory.createTrue(1),
      tokenFactory.createRightParen(1),
      tokenFactory.createPrint(1),
      tokenFactory.createString("Hello, World!", 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);

    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(WhileStmt);

    const { body, condition } = result[0] as WhileStmt;

    expect(condition).toBeInstanceOf(LiteralExpr);
    expect((condition as LiteralExpr).value).toEqual(true);

    expect(body).toBeInstanceOf(PrintStmt);

    const { expr } = body as PrintStmt;

    expect(expr).toBeInstanceOf(LiteralExpr);
    expect((expr as LiteralExpr).value).toEqual("Hello, World!");
  });

  test("for loop returns correct desugared while statement", () => {
    const parser = createParser([
      tokenFactory.createFor(1),
      tokenFactory.createLeftParen(1),
      tokenFactory.createVar(1),
      tokenFactory.createIdentifier("i", 1),
      tokenFactory.createEqual(1),
      tokenFactory.createNumber(0, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createIdentifier("i", 1),
      tokenFactory.createLessThan(1),
      tokenFactory.createNumber(10, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createIdentifier("i", 1),
      tokenFactory.createEqual(1),
      tokenFactory.createIdentifier("i", 1),
      tokenFactory.createPlus(1),
      tokenFactory.createNumber(1, 1),
      tokenFactory.createRightParen(1),
      tokenFactory.createPrint(1),
      tokenFactory.createIdentifier("i", 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);

    const result = parser.parse();

    // Assert for loop is desugared correctly to equivalent while loop
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(BlockStmt);

    const { statements } = result[0] as BlockStmt;
    expect(statements).toHaveLength(2);
    expect(statements[0]).toBeInstanceOf(VarStmt);
    expect(statements[1]).toBeInstanceOf(WhileStmt);

    const [varStmt, whileStmt] = statements as [VarStmt, WhileStmt];

    const { name, initializer } = varStmt;
    expect(name.lexeme).toEqual("i");
    expect(initializer).toBeInstanceOf(LiteralExpr);
    expect((initializer as LiteralExpr).value).toEqual(0);

    const { body, condition } = whileStmt;

    // Assert condition
    expect(condition).toBeInstanceOf(BinaryExpr);
    const { left, operator, right } = condition as BinaryExpr;

    expect(operator.lexeme).toEqual("<");

    expect(left).toBeInstanceOf(VarExpr);
    expect((left as VarExpr).name.lexeme).toEqual("i");

    expect(right).toBeInstanceOf(LiteralExpr);
    expect((right as LiteralExpr).value).toEqual(10);

    // Assert body
    expect(body).toBeInstanceOf(BlockStmt);
    const bodyStatements = (body as BlockStmt).statements;
    const [printStmt, incrementStmt] = bodyStatements as [PrintStmt, ExprStmt];

    expect(printStmt.expr).toBeInstanceOf(VarExpr);
    expect((printStmt.expr as VarExpr).name.lexeme).toEqual("i");

    expect(incrementStmt.expr).toBeInstanceOf(AssignExpr);
    const incrementExpr = incrementStmt.expr as AssignExpr;
    expect(incrementExpr.name.lexeme).toEqual("i");

    expect(incrementExpr.value).toBeInstanceOf(BinaryExpr);
    const plus1Expr = incrementExpr.value as BinaryExpr;

    expect(plus1Expr.operator.lexeme).toEqual("+");

    expect(plus1Expr.left).toBeInstanceOf(VarExpr);
    expect((plus1Expr.left as VarExpr).name.lexeme).toEqual("i");

    expect(plus1Expr.right).toBeInstanceOf(LiteralExpr);
    expect((plus1Expr.right as LiteralExpr).value).toEqual(1);
  });
});
