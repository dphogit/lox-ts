import { Token } from "./token";
import { LoxObject } from "./types";

export abstract class Expr {
  abstract accept<R>(visitor: IExprVisitor<R>): R;
}

export interface IExprVisitor<R> {
  visitAssignExpr(expr: AssignExpr): R;
  visitBinaryExpr(expr: BinaryExpr): R;
  visitCallExpr(expr: CallExpr): R;
  visitGetExpr(expr: GetExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
  visitLogicalExpr(expr: LogicalExpr): R;
  visitSetExpr(expr: SetExpr): R;
  visitUnaryExpr(expr: UnaryExpr): R;
  visitVarExpr(expr: VarExpr): R;
}

export class AssignExpr extends Expr {
  constructor(
    readonly name: Token,
    readonly value: Expr,
  ) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
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

export class CallExpr extends Expr {
  constructor(
    readonly callee: Expr,
    readonly args: Expr[],
    readonly closingParen: Token,
  ) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
  }
}

export class GetExpr extends Expr {
  constructor(
    readonly obj: Expr,
    readonly name: Token,
  ) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitGetExpr(this);
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

export class LogicalExpr extends Expr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitLogicalExpr(this);
  }
}

export class SetExpr extends Expr {
  constructor(
    readonly obj: Expr,
    readonly name: Token,
    readonly value: Expr,
  ) {
    super();
  }

  accept<R>(visitor: IExprVisitor<R>): R {
    return visitor.visitSetExpr(this);
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
