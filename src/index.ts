import fs from "node:fs";
import process from "node:process";
import readline from "node:readline";

import { ErrorReporter } from "./error";
import { Scanner } from "./scanner";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";

// https://man.freebsd.org/cgi/man.cgi?query=sysexits
const EX_USAGE = 64;
const EX_DATAERR = 65;
const EX_SOFTWARE = 70;

const errorReporter = new ErrorReporter();
const interpreter = new Interpreter(errorReporter);

function printUsage() {
  console.log();
  console.log("Usage: lox-ts [script]");
  console.log("    [script] path to lox file to run. If omitted, runs REPL.");
  console.log();
}

function run(source: string) {
  const scanner = new Scanner(source, errorReporter);
  const tokens = scanner.scanTokens();

  const parser = new Parser(tokens, errorReporter);
  const statements = parser.parse();

  if (errorReporter.hasError()) return;

  interpreter.interpret(statements);
}

function runPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.on("line", (line) => {
    line = line.trim();

    if (line) {
      run(line);
    }

    errorReporter.clearErrors();

    // Continuously reprompt
    rl.prompt();
  });

  // Initial prompt
  console.log("Welcome to Lox.ts.");
  rl.prompt();
}

function runFile(path: string) {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) throw err;

    run(data);

    if (errorReporter.hasError()) {
      process.exitCode = EX_DATAERR;
    } else if (errorReporter.hasRuntimeError()) {
      process.exitCode = EX_SOFTWARE;
    }
  });
}

function main(argv: string[]) {
  if (argv.length == 2) {
    runPrompt();
  } else if (argv.length == 3) {
    runFile(argv[2]);
  } else {
    printUsage();
    process.exitCode = EX_USAGE;
  }
}

main(process.argv);
