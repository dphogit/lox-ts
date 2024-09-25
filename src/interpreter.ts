import { IErrorReporter, RuntimeError } from "./error";
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  IExprVisitor,
  LiteralExpr,
  UnaryExpr,
} from "./expression";
import { Token } from "./token";
import { LoxObject } from "./types";

/**
 * Evaluates and computes values for provided expressions.
 */
export class Interpreter implements IExprVisitor<LoxObject> {
  constructor(private errorReporter: IErrorReporter) {}

  interpret(expr: Expr): void {
    try {
      const value = this.evaluate(expr);
      console.log(stringify(value));
    } catch (error) {
      if (error instanceof RuntimeError) {
        this.errorReporter.runtimeError(error);
      }
    }
  }

  visitBinaryExpr(expr: BinaryExpr): LoxObject {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    const optr = expr.operator;

    // Custom Lox RuntimeError's are thrown if type checks fail
    switch (optr.type) {
      case "GREATER":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left > right;
        break;

      case "GREATER_EQUAL":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left >= right;
        break;

      case "LESS":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left < right;
        break;

      case "LESS_EQUAL":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left <= right;
        break;

      case "BANG_EQUAL":
        return left !== right;

      case "EQUAL_EQUAL":
        return left === right;

      case "MINUS":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left - right;
        break;

      case "PLUS":
        if (typeof left === "string" || typeof right === "string") {
          return stringify(left) + stringify(right);
        }

        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        throw new RuntimeError(
          optr,
          "Operands must be two numbers, or two strings, or a number and string.",
        );

      case "SLASH":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left / right;
        break;

      case "STAR":
        if (checkNumberOperand(optr, left) && checkNumberOperand(optr, right))
          return left * right;
        break;
    }

    return null; // Unreachable.
  }

  visitGroupingExpr(expr: GroupingExpr): LoxObject {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): LoxObject {
    return expr.value;
  }

  visitUnaryExpr(expr: UnaryExpr): LoxObject {
    const right = this.evaluate(expr.right);
    const optr = expr.operator;

    // Custom Lox RuntimeError's are thrown if type checks fail
    switch (optr.type) {
      case "BANG":
        return !isTruthy(right);
      case "MINUS":
        if (checkNumberOperand(optr, right)) return -right;
        break;
    }

    return null; // Unreachable.
  }

  private evaluate(expr: Expr): LoxObject {
    return expr.accept(this);
  }
}

function isTruthy(obj: LoxObject): boolean {
  if (obj === null) return false;
  if (typeof obj === "boolean") return obj;
  return true;
}

function checkNumberOperand(
  operator: Token,
  operand: LoxObject,
): operand is number {
  if (typeof operand === "number") return true;
  throw new RuntimeError(operator, "Operand must be a number.");
}

function stringify(obj: LoxObject) {
  if (obj === null) return "nil";

  if (typeof obj === "number") {
    const text = obj.toString();
    return text.endsWith(".0") ? text.substring(0, text.length - 2) : text;
  }

  return obj.toString();
}
