import {
  AssignExpr,
  BinaryExpr,
  Expr,
  GroupingExpr,
  IExprVisitor,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VarExpr,
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

  visitAssignExpr(expr: AssignExpr): string {
    const name = new VarExpr(expr.name);
    return this.parenthesize("assign", name, expr.value);
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

  visitLogicalExpr(expr: LogicalExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitVarExpr(expr: VarExpr): string {
    return expr.name.lexeme;
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

  visitAssignExpr(expr: AssignExpr): string {
    return `${expr.value} ${expr.name.lexeme} assign`;
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return `${expr.left.accept(this)} ${expr.right.accept(this)} ${expr.operator.lexeme}`;
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return expr.expression.accept(this);
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    return expr.value === null ? "nil" : expr.value.toString();
  }

  visitLogicalExpr(expr: LogicalExpr): string {
    return `${expr.left.accept(this)} ${expr.right.accept(this)} ${expr.operator.lexeme}`;
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    // Use '~' symbol for negation as '-' is used for binary subtraction
    const op = expr.operator.type === "MINUS" ? "~" : expr.operator.lexeme;
    return `${expr.right.accept(this)} ${op}`;
  }

  visitVarExpr(expr: VarExpr): string {
    return expr.name.lexeme;
  }
}
