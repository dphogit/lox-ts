export interface IErrorReporter {
  hadError: boolean;
  error(line: number, message: string): void;
}

class ErrorReporter implements IErrorReporter {
  hadError = false;

  error(line: number, message: string): void {
    this.report(line, "", message);
  }

  report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this.hadError = true;
  }
}

export const errorReporter: IErrorReporter = new ErrorReporter();
