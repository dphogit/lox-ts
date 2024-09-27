import { RuntimeError } from "./error";
import { Token } from "./token";
import { LoxObject } from "./types";

export class Environment {
  private readonly values: Record<string, LoxObject> = {};

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

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Looks up a variable and returns the value bound to it.
   * @throws {RuntimeError} when variable is not found.
   */
  get(name: Token): LoxObject {
    if (this.values.hasOwnProperty(name.lexeme)) {
      return this.values[name.lexeme];
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}
