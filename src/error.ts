import { Token } from "./token";

// TODO Union type for different errors for cleaner implementation.
// At the moment: syntax error (parsing), runtime error (interpreter)

/**
 * Parameter type of argu that is passed to the error reporter's error method.
 * If it is a number, this is the line number.
 * If it is a Token, this is the token object.
 */
type ReportErrorArg = number | Token;

export interface IErrorReporter {
  hasError(): boolean;
  hasRuntimeError(): boolean;
  clearError(): void;
  error(arg: ReportErrorArg, message: string): void;
  runtimeError(error: RuntimeError): void;
}

export class ErrorReporter implements IErrorReporter {
  private _hasError = false;
  private _hasRuntimeError = false;

  hasError() {
    return this._hasError;
  }

  hasRuntimeError(): boolean {
    return this._hasRuntimeError;
  }

  clearError() {
    this._hasError = false;
  }

  error(arg: ReportErrorArg, message: string): void {
    if (typeof arg === "number") {
      const line = arg;
      this.report(line, "", message);
      return;
    }

    const token = arg;
    if (token.type === "EOF") {
      this.report(token.line, " at end", message);
      return;
    }
    this.report(token.line, ` at '${token.lexeme}'`, message);
  }

  runtimeError(error: RuntimeError): void {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    this._hasRuntimeError = true;
  }

  private report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this._hasError = true;
  }
}

export class ParseError extends Error {}

export class RuntimeError extends Error {
  constructor(
    public token: Token,
    message: string,
  ) {
    super(message);
  }
}
