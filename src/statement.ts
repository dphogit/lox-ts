import { Expr } from "./expression";
import { Token } from "./token";

export abstract class Stmt {
  abstract accept<R>(visitor: IStmtVisitor<R>): R;
}

export interface IStmtVisitor<R> {
  visitBlockStmt(stmt: BlockStmt): R;
  visitExprStmt(stmt: ExprStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitVarStmt(stmt: VarStmt): R;
}

export class BlockStmt extends Stmt {
  constructor(readonly statements: Stmt[]) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class ExprStmt extends Stmt {
  constructor(readonly expr: Expr) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitExprStmt(this);
  }
}

export class PrintStmt extends Stmt {
  constructor(readonly expr: Expr) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class VarStmt extends Stmt {
  constructor(
    readonly name: Token,
    readonly initializer?: Expr,
  ) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}
