export interface IErrorReporter {
  hasError(): boolean;
  clearError(): void;
  error(line: number, message: string): void;
}

export class ErrorReporter implements IErrorReporter {
  private _hasError = false;

  hasError() {
    return this._hasError;
  }

  clearError() {
    this._hasError = false;
  }

  error(line: number, message: string): void {
    this.report(line, "", message);
  }

  private report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this._hasError = true;
  }
}
