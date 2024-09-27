import { Token } from "./token";
import { LoxObject } from "./types";

export abstract class Expr {
  abstract accept<R>(visitor: IExprVisitor<R>): R;
}

export interface IExprVisitor<R> {
  visitBinaryExpr(expr: BinaryExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
  visitUnaryExpr(expr: UnaryExpr): R;
  visitVarExpr(expr: VarExpr): R;
}

export class BinaryExpr extends Expr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class GroupingExpr extends Expr {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr extends Expr {
  constructor(readonly value: LoxObject) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class UnaryExpr extends Expr {
  constructor(
    readonly operator: Token,
    readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

export class VarExpr extends Expr {
  constructor(readonly name: Token) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitVarExpr(this);
  }
}
