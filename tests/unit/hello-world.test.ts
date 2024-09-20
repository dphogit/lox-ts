import { test, expect } from "vitest";

const sayHello = (to: string) => {
  return `Hello, ${to}!`;
};

test("Hello World Test", () => {
  expect(sayHello("World")).toBe("Hello, World!");
});
