import { parseCreditsFromOrder } from "../src/credits.js";

test("parses credits from sku prefix", () => {
  const credits = parseCreditsFromOrder([
    { sku: "CREDITS_10", quantity: 2 }
  ]);
  expect(credits).toBe(20);
});

test("parses credits from name", () => {
  const credits = parseCreditsFromOrder([{ name: "10 Credits Pack", quantity: 1 }]);
  expect(credits).toBe(10);
});
