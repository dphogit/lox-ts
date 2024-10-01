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
    private isInitializer: boolean = false,
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
      if (caught instanceof LoxReturn) {
        if (this.isInitializer) return this.forceReturnThis();
        return caught.value;
      }
    }

    // If called function is initializer, forcibly return `this`.
    if (this.isInitializer) return this.forceReturnThis();

    // Implicitly returns 'nil' if we don't hit a return statement.
    return null;
  }

  bindInstance(instance: LoxInstance) {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
  }

  toString = () => `<fn ${this.declaration.name.lexeme}>`;

  private forceReturnThis(): LoxObject {
    return this.closure.getAt(0, "this");
  }
}

export class LoxReturn {
  constructor(readonly value: LoxObject) {}
}

export class LoxClass extends LoxCallable {
  constructor(
    readonly name: string,
    readonly superClass?: LoxClass,
    private readonly methods: Record<string, LoxFunction> = {}, // Methods are keyed by their names
  ) {
    super();
  }

  arity(): number {
    const initializer = this.findMethod("init");
    return initializer ? initializer.arity() : 0;
  }

  call(interpreter: Interpreter, args: LoxObject[]): LoxObject {
    const instance = new LoxInstance(this);

    // Constructor
    const initializer = this.findMethod("init");
    if (initializer) {
      initializer.bindInstance(instance).call(interpreter, args);
    }

    return instance;
  }

  findMethod(name: string): LoxFunction | null {
    if (this.methods.hasOwnProperty(name)) {
      return this.methods[name];
    }

    // Recursively look up the class hierarchy for the method.
    if (this.superClass) {
      return this.superClass.findMethod(name);
    }

    return null;
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
    if (method) return method.bindInstance(this);

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'`);
  }

  set(name: Token, value: LoxObject) {
    this.fields[name.lexeme] = value;
  }

  toString = () => `${this.klass.name} instance`;
}
