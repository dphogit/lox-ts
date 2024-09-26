import { describe, expect, test } from "vitest";

import { Interpreter } from "../../src/interpreter";
import { IErrorReporter, ErrorReporter, RuntimeError } from "../../src/error";
import { BinaryExpr, LiteralExpr, UnaryExpr } from "../../src/expression";
import { tokenFactory } from "../../src/token";
import { LoxObject } from "../../src/types";

function createInterpreter(errorReporter?: IErrorReporter) {
  return new Interpreter(errorReporter ?? new ErrorReporter());
}

describe("visitUnaryExpr", () => {
  function createMinusExpr(a: LoxObject) {
    return new UnaryExpr(tokenFactory.createMinus(1), new LiteralExpr(a));
  }

  function createBang(a: LoxObject) {
    return new UnaryExpr(tokenFactory.createBang(1), new LiteralExpr(a));
  }

  test("minus number returns negated number", () => {
    const expr = createMinusExpr(1);
    const interpreter = createInterpreter();

    const result = interpreter.visitUnaryExpr(expr);

    expect(result).toBeTypeOf("number");
    expect(result).toEqual(-1);
  });

  test("minus non-number opeand throws runtime error", () => {
    const expr = createMinusExpr("1");
    const interpreter = createInterpreter();

    const call = () => interpreter.visitUnaryExpr(expr);

    expect(call).toThrow(RuntimeError);
  });

  test("bang null returns true", () => {
    const expr = createBang(null);
    const interpreter = createInterpreter();

    const result = interpreter.visitUnaryExpr(expr);

    expect(result).toBeTypeOf("boolean");
    expect(result).toEqual(true);
  });

  test("bang true returns false", () => {
    const expr = createBang(true);
    const interpreter = createInterpreter();

    const result = interpreter.visitUnaryExpr(expr);

    expect(result).toBeTypeOf("boolean");
    expect(result).toEqual(false);
  });
});

describe("visitBinaryExpr", () => {
  function createPlusExpr(a: LoxObject, b: LoxObject) {
    return new BinaryExpr(
      new LiteralExpr(a),
      tokenFactory.createPlus(1),
      new LiteralExpr(b),
    );
  }

  function createEqualEqualExpr(a: LoxObject, b: LoxObject) {
    return new BinaryExpr(
      new LiteralExpr(a),
      tokenFactory.createEqualEqual(1),
      new LiteralExpr(b),
    );
  }

  test("plus two numbers returns correct sum", () => {
    const expr = createPlusExpr(1, 2);
    const interpreter = createInterpreter();

    const result = interpreter.visitBinaryExpr(expr);

    expect(result).toBeTypeOf("number");
    expect(result).toEqual(3);
  });

  test("plus two strings returns concatenated string", () => {
    const expr = createPlusExpr("Hello, ", "World!");
    const interpreter = createInterpreter();

    const result = interpreter.visitBinaryExpr(expr);

    expect(result).toBeTypeOf("string");
    expect(result).toEqual("Hello, World!");
  });

  test("plus a number and string returns concatenated string", () => {
    const expr = createPlusExpr(8, "-Ball");
    const interpreter = createInterpreter();

    const result = interpreter.visitBinaryExpr(expr);

    expect(result).toBeTypeOf("string");
    expect(result).toEqual("8-Ball");
  });

  test("plus invalid operands throws runtime error", () => {
    const expr = createPlusExpr(false, 69);
    const interpreter = createInterpreter();

    const call = () => interpreter.visitBinaryExpr(expr);

    expect(call).toThrow(RuntimeError);
  });

  test("equal equal two same numbers returns true", () => {
    const expr = createEqualEqualExpr(1, 1);
    const interpreter = createInterpreter();

    const result = interpreter.visitBinaryExpr(expr);

    expect(result).toBeTypeOf("boolean");
    expect(result).toEqual(true);
  });

  test("equal equal two different strings returns false", () => {
    const expr = createEqualEqualExpr("string1", "string2");
    const interpreter = createInterpreter();

    const result = interpreter.visitBinaryExpr(expr);

    expect(result).toBeTypeOf("boolean");
    expect(result).toEqual(false);
  });
});
