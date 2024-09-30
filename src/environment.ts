import { RuntimeError } from "./error";
import { Token } from "./token";
import { LoxObject } from "./types";

export class Environment {
  private readonly values: Record<string, LoxObject> = {};
  private readonly enclosing: Environment | null; // Pointer to parent environment

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing ?? null;
  }

  /**
   * Binds the variable name to the value. Does not check if it is already
   * present, meaning variables can be redefined.
   */
  define(name: string, value: LoxObject): void {
    this.values[name] = value;
  }

  /**
   * Assigns the value to an already existing variable.
   * @throws {RuntimeError} if the variable does not exist.
   */
  assign(name: Token, value: LoxObject): void {
    if (this.values.hasOwnProperty(name.lexeme)) {
      this.values[name.lexeme] = value;
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Assigns the value to the environment at the fixed distance from this one.
   */
  assignAt(distance: number, name: Token, value: LoxObject): void {
    const ancestor = this.ancestor(distance);
    ancestor.values[name.lexeme] = value;
  }

  /**
   * Looks up a variable and returns the bounded value at the tightest scope.
   * @throws {RuntimeError} when variable is not found.
   */
  get(name: Token): LoxObject {
    if (this.values.hasOwnProperty(name.lexeme)) {
      return this.values[name.lexeme];
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Gets the bouned variable value at the environment of fixed distance
   */
  getAt(distance: number, name: string): LoxObject {
    return this.ancestor(distance).values[name];
  }

  /**
   * Walks a fixed number of hops up the parent chain and returns the environment.
   * @throws {RangeError} when distance exceeds number of ancestor environments.
   */
  ancestor(distance: number): Environment {
    let env: Environment = this;
    for (let i = 0; i < distance; i++) {
      if (env.enclosing === null) {
        throw new RangeError(
          "Distance exceeds the number of ancestor environments.",
        );
      }
      env = env.enclosing;
    }
    return env;
  }
}
