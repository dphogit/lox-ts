import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  IExprVisitor,
  LiteralExpr,
  UnaryExpr,
} from "./expression";

export interface IExprFormatter extends IExprVisitor<string> {
  format(expr: Expr): string;
}

/**
 * Formats expressions in Lisp like syntax
 */
export class AstFormatter implements IExprFormatter {
  format(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    return expr.value === null ? "nil" : expr.value.toString();
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    const parts = [`(${name}`];

    for (const expr of exprs) {
      parts.push(` ${expr.accept(this)}`);
    }
    parts.push(")");

    return parts.join("");
  }
}

/**
 * Formats expressions in Reverse Polish Notation
 */
export class RpnFormatter implements IExprFormatter {
  format(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    const leftOperand = expr.left.accept(this);
    const rightOperand = expr.right.accept(this);
    return `${leftOperand} ${rightOperand} ${expr.operator.lexeme}`;
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return expr.expression.accept(this);
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    return expr.value === null ? "nil" : expr.value.toString();
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return `${expr.right.accept(this)} ${expr.operator.lexeme}`;
  }
}
