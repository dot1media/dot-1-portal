import { describe, it, expect } from "vitest";
import { parseCsvRows, parseAcuityStart, importServiceLine } from "../../lib/portal/csv.js";

describe("parseCsvRows", () => {
  it("splits simple rows", () => { expect(parseCsvRows("a,b,c\n1,2,3")).toEqual([["a","b","c"],["1","2","3"]]); });
  it("respects quoted commas", () => { expect(parseCsvRows('a,"b,c",d')).toEqual([["a","b,c","d"]]); });
  it("handles escaped quotes", () => { expect(parseCsvRows('a,"he said ""hi""",b')).toEqual([["a",'he said "hi"',"b"]]); });
});
describe("parseAcuityStart", () => {
  it("long month format", () => { expect(parseAcuityStart("January 24, 2026 12:00 pm")).toEqual({ date: "2026-01-24", time: "12:00" }); });
  it("am time", () => { expect(parseAcuityStart("March 5, 2026 9:30 am")).toEqual({ date: "2026-03-05", time: "09:30" }); });
  it("short M/D/YY 24h format", () => { expect(parseAcuityStart("10/9/26 18:30")).toEqual({ date: "2026-10-09", time: "18:30" }); });
  it("empty -> blank", () => { expect(parseAcuityStart("")).toEqual({ date: "", time: "" }); });
});
describe("importServiceLine", () => {
  it("detects video keywords", () => { expect(importServiceLine("Historical Film Score")).toBe("video"); expect(importServiceLine("Documentary")).toBe("video"); });
  it("defaults to photo", () => { expect(importServiceLine("Wedding Photography")).toBe("photo"); expect(importServiceLine("Portrait Session")).toBe("photo"); });
});

