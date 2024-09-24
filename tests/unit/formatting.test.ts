import { describe, test, expect } from "vitest";
import {
  BinaryExpr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "../../src/expression";
import { tokenFactory } from "../../src/token";
import { AstFormatter, RpnFormatter } from "../../src/formatting";

describe("AST formatter", () => {
  test("adding two numbers returned in correct format", () => {
    const expression = new BinaryExpr(
      new LiteralExpr(1),
      tokenFactory.createPlus(1),
      new LiteralExpr(2),
    );
    const astFormatter = new AstFormatter();

    const result = astFormatter.format(expression);

    expect(result).toEqual("(+ 1 2)");
  });

  test("binary expression returned in correct format", () => {
    // Example from https://www.craftinginterpreters.com/representing-code.html#a-not-very-pretty-printer
    const left = new UnaryExpr(
      tokenFactory.createMinus(1),
      new LiteralExpr(123),
    );
    const right = new GroupingExpr(new LiteralExpr(45.67));
    var expression = new BinaryExpr(left, tokenFactory.createStar(1), right);
    const astFormatter = new AstFormatter();

    const result = astFormatter.format(expression);

    expect(result).toEqual("(* (- 123) (group 45.67))");
  });
});

describe("RPN formatter", () => {
  // Example from https://www.craftinginterpreters.com/representing-code.html#challenges
  test("arithmetic expression returns correct format", () => {
    const left = new GroupingExpr(
      new BinaryExpr(
        new LiteralExpr(1),
        tokenFactory.createPlus(1),
        new LiteralExpr(2),
      ),
    );
    const right = new GroupingExpr(
      new BinaryExpr(
        new LiteralExpr(4),
        tokenFactory.createMinus(1),
        new LiteralExpr(3),
      ),
    );
    const expression = new BinaryExpr(left, tokenFactory.createStar(1), right);
    const rpnFormatter = new RpnFormatter();

    const result = rpnFormatter.format(expression);

    expect(result).toEqual("1 2 + 4 3 - *");
  });
});
