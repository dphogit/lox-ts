import { describe, expect, test } from "vitest";
import { ErrorReporter } from "../../src/error";
import { Scanner } from "../../src/scanner";
import { tokenFactory } from "../../src/token";

const errorReporter = new ErrorReporter();

describe("Scanner class", () => {
  test("print hi returns correct tokens", () => {
    // Arrange
    const source = 'print "Hi!";';
    const scanner = new Scanner(source, errorReporter);

    // Act
    const tokens = scanner.scanTokens();

    // Assert
    expect(tokens).toHaveLength(4);
    expect(tokens).toStrictEqual([
      tokenFactory.createPrint(1),
      tokenFactory.createString("Hi!", 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
  });

  test("assign string variable returns correct tokens", () => {
    // Arrange
    const source = "var pi = 3.14;";
    const scanner = new Scanner(source, errorReporter);

    // Act
    const tokens = scanner.scanTokens();

    // Assert
    expect(tokens).toHaveLength(6);
    expect(tokens).toStrictEqual([
      tokenFactory.createVar(1),
      tokenFactory.createIdentifier("pi", 1),
      tokenFactory.createEqual(1),
      tokenFactory.createNumber(3.14, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
  });

  test("aritmetic expression returns correct tokens", () => {
    // Arrange
    const source = "1 + 2 - 3 * 4 / 5;";
    const scanner = new Scanner(source, errorReporter);

    // Act
    const tokens = scanner.scanTokens();

    // Assert
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
  });

  test("multiple lines returns correct tokens", () => {
    // Arrange
    const source = "var x = 10;\nprint x;\n";
    const scanner = new Scanner(source, errorReporter);

    // Act
    const tokens = scanner.scanTokens();

    // Assert
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
  });

  test("invalid lexeme is reported but continues to scan", () => {
    // Arrange
    const source = "# 1;";
    const scanner = new Scanner(source, errorReporter);

    // Act
    const tokens = scanner.scanTokens();

    // Arrange
    expect(tokens).toHaveLength(3);
    expect(tokens).toStrictEqual([
      tokenFactory.createNumber(1, 1),
      tokenFactory.createSemiColon(1),
      tokenFactory.createEof(1),
    ]);
    expect(errorReporter.hasError()).toEqual(true);
  });
});
