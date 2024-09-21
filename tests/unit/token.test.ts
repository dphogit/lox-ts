import { describe, test, expect } from "vitest";

import { Token } from "../../src/token";

describe("Token class", () => {
  test("toString", () => {
    const token = new Token("NUMBER", "5", 5, 1);

    const result = token.toString();

    expect(result).toBe("NUMBER 5 5");
  });
});
