import { beforeEach, describe, expect, test } from "vitest";
import { ErrorReporter, IErrorReporter } from "../../src/error";
import { Scanner } from "../../src/scanner";
import { tokenFactory } from "../../src/token";

describe("Scanner class", () => {
  let errorReporter: IErrorReporter;

  beforeEach(() => {
    errorReporter = new ErrorReporter();
  });

  test("print hi returns correct tokens", () => {
    const source = 'print "Hi!";';
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(4);
    expect(tokens).toStrictEqual([
      tokenFactory.createPrint(1),
      tokenFactory.createString("Hi!", 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(false);
  });

  test("assign string variable returns correct tokens", () => {
    const source = "var pi = 3.14;";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(6);
    expect(tokens).toStrictEqual([
      tokenFactory.createVar(1),
      tokenFactory.createIdentifier("pi", 1),
      tokenFactory.createEqual(1),
      tokenFactory.createNumber(3.14, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(false);
  });

  test("aritmetic expression returns correct tokens", () => {
    const source = "1 + 2 - 3 * 4 / 5;";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(11);
    expect(tokens).toStrictEqual([
      tokenFactory.createNumber(1, 1),
      tokenFactory.createPlus(1),
      tokenFactory.createNumber(2, 1),
      tokenFactory.createMinus(1),
      tokenFactory.createNumber(3, 1),
      tokenFactory.createStar(1),
      tokenFactory.createNumber(4, 1),
      tokenFactory.createSlash(1),
      tokenFactory.createNumber(5, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(false);
  });

  test("multiple lines returns correct tokens", () => {
    const source = "var x = 10;\nprint x;\n";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(9);
    expect(tokens).toStrictEqual([
      tokenFactory.createVar(1),
      tokenFactory.createIdentifier("x", 1),
      tokenFactory.createEqual(1),
      tokenFactory.createNumber(10, 1),
      tokenFactory.createSemiColon(1),

      tokenFactory.createPrint(2),
      tokenFactory.createIdentifier("x", 2),
      tokenFactory.createSemiColon(2),

      tokenFactory.createEof(3),
    ]);
    expect(errorReporter.hasError()).toEqual(false);
  });

  test("function declaration returns correct tokens", () => {
    const source = "fun sum(a, b) {\nprint a + b; \n}";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(15);
    expect(tokens).toStrictEqual([
      tokenFactory.createFunction(1),
      tokenFactory.createIdentifier("sum", 1),
      tokenFactory.createLeftParen(1),
      tokenFactory.createIdentifier("a", 1),
      tokenFactory.createComma(1),
      tokenFactory.createIdentifier("b", 1),
      tokenFactory.createRightParen(1),
      tokenFactory.createLeftBrace(1),
      tokenFactory.createPrint(2),
      tokenFactory.createIdentifier("a", 2),
      tokenFactory.createPlus(2),
      tokenFactory.createIdentifier("b", 2),
      tokenFactory.createSemiColon(2),
      tokenFactory.createRightBrace(3),
      tokenFactory.createEof(3),
    ]);
  });

  test("class declaration returns correct tokens", () => {
    const source = "class MyClass { myMethod() {} }";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(10);
    expect(tokens).toStrictEqual([
      tokenFactory.createClass(1),
      tokenFactory.createIdentifier("MyClass", 1),
      tokenFactory.createLeftBrace(1),
      tokenFactory.createIdentifier("myMethod", 1),
      tokenFactory.createLeftParen(1),
      tokenFactory.createRightParen(1),
      tokenFactory.createLeftBrace(1),
      tokenFactory.createRightBrace(1),
      tokenFactory.createRightBrace(1),
      tokenFactory.createEof(1),
    ]);
  });

  test("inline comment is ignored", () => {
    const source = "// Inline comments are ignored";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(1);
    expect(tokens).toStrictEqual([tokenFactory.createEof(1)]);
    expect(errorReporter.hasError()).toEqual(false);
  });

  test("block comment is ignored", () => {
    const source = "/* C Style block comments are ignored */ print 10;";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(4);
    expect(tokens).toStrictEqual([
      tokenFactory.createPrint(1),
      tokenFactory.createNumber(10, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(false);
  });

  test("unterminated block comment is reported gracefully", () => {
    const source = "print 10; /*";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(4);
    expect(tokens).toStrictEqual([
      tokenFactory.createPrint(1),
      tokenFactory.createNumber(10, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(true);
  });

  test("unterminated string is reported gracefully", () => {
    const source = 'print "';
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(2);
    expect(tokens).toStrictEqual([
      tokenFactory.createPrint(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(true);
  });

  test("invalid lexeme is reported gracefully", () => {
    const source = "# 1;";
    const scanner = new Scanner(source, errorReporter);

    const tokens = scanner.scanTokens();

    expect(tokens).toHaveLength(3);
    expect(tokens).toStrictEqual([
      tokenFactory.createNumber(1, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(true);
  });
});
