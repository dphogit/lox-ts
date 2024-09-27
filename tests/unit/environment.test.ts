import { describe, expect, test } from "vitest";

import { Environment } from "../../src/environment";
import { tokenFactory } from "../../src/token";
import { RuntimeError } from "../../src/error";

describe("Environment class", () => {
  test("get defined variable returns value", () => {
    const environment = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);
    environment.define(name.lexeme, "Hello, World!");

    const result = environment.get(name);

    expect(result).toEqual("Hello, World!");
  });

  test("get variable defined in enclosing environment returns value", () => {
    const enclosing = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);
    enclosing.define(name.lexeme, "Hello, World!");
    const environment = new Environment(enclosing);

    const result = environment.get(name);

    expect(result).toEqual("Hello, World!");
  });

  test("get variable defined both in local and global environment returns local value", () => {
    const enclosing = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);
    enclosing.define(name.lexeme, "Hello, World!");
    const environment = new Environment(enclosing);
    environment.define(name.lexeme, "Hello, Inner World!");

    const result = environment.get(name);

    expect(result).toEqual("Hello, Inner World!");
  });

  test("get not defined variable throws runtime error", () => {
    const environment = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);

    const call = () => environment.get(name);

    expect(call).toThrow(RuntimeError);
  });

  test("assign defined variable updates variable with new value", () => {
    const environment = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);
    environment.define(name.lexeme, "Hello, World!");

    environment.assign(name, "Bye, World!");

    const value = environment.get(name);
    expect(value).toEqual("Bye, World!");
  });

  test("assign variable that is not defined throws runtime error", () => {
    const environment = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);

    const call = () => environment.assign(name, "Hello, World");

    expect(call).toThrow(RuntimeError);
  });
});
