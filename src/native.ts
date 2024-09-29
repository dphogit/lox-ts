import { Interpreter } from "./interpreter";
import { LoxCallable, LoxObject } from "./types";

/**
 * Returns the number of seconds since UNIX epoch (Midnight, Jan 1, 1970, UTC)
 */
export class LoxClock extends LoxCallable {
  arity = () => 0;

  call(interpreter: Interpreter, args: LoxObject[]): LoxObject {
    return new Date().getTime() / 1000;
  }

  toString = () => "<native fn>";
}
