import { Expr, VarExpr } from "./expression";
import { Token } from "./token";

export abstract class Stmt {
  abstract accept<R>(visitor: IStmtVisitor<R>): R;
}

export interface IStmtVisitor<R> {
  visitBlockStmt(stmt: BlockStmt): R;
  visitClassStmt(stmt: ClassStmt): R;
  visitExprStmt(stmt: ExprStmt): R;
  visitFunctionStmt(stmt: FunctionStmt): R;
  visitIfStmt(stmt: IfStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitReturnStmt(stmt: ReturnStmt): R;
  visitVarStmt(stmt: VarStmt): R;
  visitWhileStmt(stmt: WhileStmt): R;
}

export class BlockStmt extends Stmt {
  constructor(readonly statements: Stmt[]) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class ClassStmt extends Stmt {
  constructor(
    readonly name: Token,
    readonly methods: FunctionStmt[],
    readonly superClass?: VarExpr,
  ) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitClassStmt(this);
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

export class FunctionStmt extends Stmt {
  constructor(
    readonly name: Token,
    readonly params: Token[],
    readonly body: Stmt[],
  ) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitFunctionStmt(this);
  }
}

export class IfStmt extends Stmt {
  constructor(
    readonly condition: Expr,
    readonly thenBranch: Stmt,
    readonly elseBranch?: Stmt,
  ) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
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

export class ReturnStmt extends Stmt {
  constructor(
    readonly keyword: Token,
    readonly value?: Expr,
  ) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitReturnStmt(this);
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

export class WhileStmt extends Stmt {
  constructor(
    readonly condition: Expr,
    readonly body: Stmt,
  ) {
    super();
  }

  accept<R>(visitor: IStmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}
