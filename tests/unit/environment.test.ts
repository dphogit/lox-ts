import { describe, expect, test } from "vitest";

import { Environment } from "../../src/environment";
import { tokenFactory } from "../../src/token";
import { RuntimeError } from "../../src/error";

describe("Environment class", () => {
  test("get defined variable returns variable", () => {
    const environment = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);
    environment.define(name.lexeme, "Hello, World!");

    const result = environment.get(name);

    expect(result).toBeTypeOf("string");
    expect(result).toEqual("Hello, World!");
  });

  test("get not defined variable throws runtime error", () => {
    const environment = new Environment();
    const name = tokenFactory.createIdentifier("x", 1);

    const call = () => environment.get(name);

    expect(call).toThrow(RuntimeError);
  });
});
