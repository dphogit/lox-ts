import { Environment } from "./environment";
import { Interpreter } from "./interpreter";
import { FunctionStmt } from "./statement";

export type LoxObject = string | number | boolean | null | LoxCallable;

export type FunctionKind = "function";

export abstract class LoxCallable {
  abstract arity(): number;
  abstract call(interpreter: Interpreter, args: LoxObject[]): LoxObject;
}

export class LoxFunction extends LoxCallable {
  constructor(
    private declaration: FunctionStmt,
    private closure: Environment,
  ) {
    super();
  }

  arity = () => this.declaration.params.length;

  call(interpreter: Interpreter, args: LoxObject[]): LoxObject {
    // Each fn call has it's own closure environment to encapsulate its params.
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    // Execute the function, if it returns something we catch and return it.
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (caught) {
      if (caught instanceof LoxReturn) return caught.value;
    }

    // Implicitly returns 'nil' if we don't hit a return statement.
    return null;
  }

  toString = () => `<fn ${this.declaration.name.lexeme}>`;
}

export class LoxReturn {
  constructor(readonly value: LoxObject) {}
}
