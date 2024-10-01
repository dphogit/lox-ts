import { describe, expect, test } from "vitest";
import { RuntimeError } from "../../src/error";
import { tokenFactory } from "../../src/token";
import { LoxClass, LoxInstance } from "../../src/types";

describe("LoxInstance", () => {
  test("get existing property", () => {
    const loxInstance = new LoxInstance(new LoxClass("TestClass"));
    const name = tokenFactory.createIdentifier("myProperty", 1);
    loxInstance.set(name, "Hello, World!");

    const result = loxInstance.get(name);

    expect(result).toEqual("Hello, World!");
  });

  test("get undefined property throws runtime error", () => {
    const loxInstance = new LoxInstance(new LoxClass("TestClass"));
    const name = tokenFactory.createIdentifier("myProperty", 1);

    const call = () => loxInstance.get(name);

    expect(call).toThrow(RuntimeError);
  });

  test("set property", () => {
    const loxInstance = new LoxInstance(new LoxClass("TestClass"));
    const name = tokenFactory.createIdentifier("myProperty", 1);

    loxInstance.set(name, "Hello, World!");

    expect(loxInstance.get(name)).toEqual("Hello, World!");
  });

  test("toString", () => {
    const loxInstance = new LoxInstance(new LoxClass("TestClass"));

    const result = loxInstance.toString();

    expect(result).toEqual("TestClass instance");
  });
});
