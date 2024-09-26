import { Token } from "./token";

type ReportError = SyntaxError | RuntimeError;

export interface IErrorReporter {
  hasError(): boolean;
  hasRuntimeError(): boolean;
  clearErrors(): void;
  report(error: ReportError): void;
}

export class ErrorReporter implements IErrorReporter {
  private _hasSyntaxError = false;
  private _hasRuntimeError = false;

  hasError(): boolean {
    return this._hasSyntaxError;
  }

  hasRuntimeError(): boolean {
    return this._hasRuntimeError;
  }

  clearErrors(): void {
    this._hasSyntaxError = false;
    this._hasRuntimeError = false;
  }

  report(error: ReportError): void {
    if (error instanceof RuntimeError) {
      console.error(`${error.message}\n[line ${error.token.line}]`);
      this._hasRuntimeError = true;
      return;
    }

    // error is SyntaxError
    if (error.where === undefined) {
      console.error(`[line ${error.line}] Error: ${error.message}`);
    } else {
      console.error(
        `[line ${error.line}] Error ${error.where}: ${error.message}`,
      );
    }

    this._hasSyntaxError = true;
  }
}

export class SyntaxError extends Error {
  constructor(
    public message: string,
    public line: number,
    public where?: string,
  ) {
    super(message);
  }
}

export class RuntimeError extends Error {
  constructor(
    public token: Token,
    message: string,
  ) {
    super(message);
  }
}
