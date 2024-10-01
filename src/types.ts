import { Environment } from "./environment";
import { RuntimeError } from "./error";
import { Interpreter } from "./interpreter";
import { FunctionStmt } from "./statement";
import { Token } from "./token";

export type LoxObject =
  | string
  | number
  | boolean
  | null
  | LoxCallable
  | LoxClass
  | LoxInstance;

export type FunctionKind = "function" | "method";

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

export class LoxClass extends LoxCallable {
  constructor(
    readonly name: string,
    private readonly methods: Record<string, LoxFunction> = {}, // Methods are keyed by their names
  ) {
    super();
  }

  arity(): number {
    return 0;
  }

  call(interpreter: Interpreter, args: LoxObject[]): LoxObject {
    const instance = new LoxInstance(this);
    return instance;
  }

  findMethod(name: string): LoxFunction | null {
    return this.methods.hasOwnProperty(name) ? this.methods[name] : null;
  }

  toString = () => this.name;
}

export class LoxInstance {
  // Maps property names to corresponding property values
  private readonly fields: Record<string, LoxObject> = {};

  constructor(private klass: LoxClass) {}

  get(name: Token): LoxObject {
    if (this.fields.hasOwnProperty(name.lexeme)) {
      return this.fields[name.lexeme];
    }

    const method = this.klass.findMethod(name.lexeme);
    if (method) return method;

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'`);
  }

  set(name: Token, value: LoxObject) {
    this.fields[name.lexeme] = value;
  }

  toString = () => `${this.klass.name} instance`;
}
