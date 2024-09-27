import { Expr } from "./expression";
import { Token } from "./token";

export abstract class Stmt {
  abstract accept<R>(visitor: IStmtVisitor<R>): R;
}

export interface IStmtVisitor<R> {
  visitExprStmt(stmt: ExprStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitVarStmt(stmt: VarStmt): R;
}

export class ExprStmt implements Stmt {
  constructor(readonly expr: Expr) {}

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitExprStmt(this);
  }
}

export class PrintStmt implements Stmt {
  constructor(readonly expr: Expr) {}

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class VarStmt implements Stmt {
  constructor(
    readonly name: Token,
    readonly initializer?: Expr,
  ) {}

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}
