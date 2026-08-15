import { describe, it, expect } from "vitest";
import { bookingTotal, optionAmount } from "../../lib/portal/pricing.js";

describe("bookingTotal", () => {
  it("base price with no add-ons", () => { expect(bookingTotal(395, [])).toBe(395); });
  it("base price plus add-on prices", () => { expect(bookingTotal(395, [{ price: 150 }, { price: 50 }])).toBe(595); });
  it("coerces string prices to numbers", () => { expect(bookingTotal("400", [{ price: "150" }])).toBe(550); });
  it("treats non-numeric add-on prices as 0", () => { expect(bookingTotal(400, [{ price: "free" }, { price: 100 }])).toBe(500); });
  it("add-on with no price contributes 0", () => { expect(bookingTotal(200, [{ name: "Extra" }])).toBe(200); });
  it("handles missing base price and missing add-ons", () => { expect(bookingTotal(undefined, undefined)).toBe(0); expect(bookingTotal(null, [])).toBe(0); expect(bookingTotal(0, [])).toBe(0); });
});
describe("optionAmount", () => {
  it("pay in full (100%) equals the total", () => { expect(optionAmount({ key: "full", pct: 100 }, 545)).toBe(545); });
  it("50% deposit rounds half up", () => { expect(optionAmount({ key: "half", pct: 50 }, 545)).toBe(273); expect(optionAmount({ key: "half", pct: 50 }, 543)).toBe(272); });
  it("50% retainer on an even total", () => { expect(optionAmount({ key: "retainer", pct: 50 }, 1500)).toBe(750); });
  it("quote / 0% is 0", () => { expect(optionAmount({ key: "quote", pct: 0 }, 2000)).toBe(0); });
  it("no option selected returns 0", () => { expect(optionAmount(null, 500)).toBe(0); expect(optionAmount(undefined, 500)).toBe(0); });
  it("a fixed amount wins over pct (defensive)", () => { expect(optionAmount({ key: "x", fixed: 99, pct: 50 }, 1000)).toBe(99); });
  it("a fixed amount of 0 is honored, not treated as unset", () => { expect(optionAmount({ key: "x", fixed: 0 }, 1000)).toBe(0); });
  it("a missing pct behaves as 0 (defensive)", () => { expect(optionAmount({ key: "x" }, 1000)).toBe(0); });
});

