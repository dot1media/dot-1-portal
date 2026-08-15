import { describe, it, expect } from "vitest";
import { money, compactMoney, payMoney, payKindLabel, fmtDate, fmtTime, pad2, addMinutes, calDate, monthShort, sessionBucket, uid, timeGreeting } from "../../lib/portal/format.js";

describe("money", () => {
  it("formats dollars with commas", () => { expect(money(1500)).toBe("$1,500"); });
  it("handles zero and junk", () => { expect(money(0)).toBe("$0"); expect(money("abc")).toBe("$0"); });
});
describe("compactMoney", () => {
  it("compacts thousands", () => { expect(compactMoney(500)).toBe("$500"); expect(compactMoney(1500)).toBe("$1.5k"); expect(compactMoney(15000)).toBe("$15k"); });
});
describe("payMoney (cents -> dollars)", () => {
  it("converts cents", () => { expect(payMoney(150000)).toBe("$1,500.00"); expect(payMoney(0)).toBe("$0.00"); });
});
describe("payKindLabel", () => {
  it("maps kinds", () => { expect(payKindLabel("retainer")).toBe("Retainer"); expect(payKindLabel("half")).toBe("Deposit"); expect(payKindLabel("charge")).toBe("Add-on"); expect(payKindLabel("weird")).toBe("Payment"); });
});
describe("fmtDate / fmtTime", () => {
  it("formats an ISO date", () => { expect(fmtDate("2026-09-01")).toBe("September 1, 2026"); expect(fmtDate("")).toBe(""); });
  it("formats 24h time to 12h", () => { expect(fmtTime("18:30")).toBe("6:30 PM"); expect(fmtTime("09:05")).toBe("9:05 AM"); expect(fmtTime("00:00")).toBe("12:00 AM"); });
});
describe("pad2 / addMinutes / calDate / monthShort", () => {
  it("pad2", () => { expect(pad2(3)).toBe("03"); expect(pad2(15)).toBe("15"); });
  it("addMinutes wraps past midnight", () => { expect(addMinutes("10:00", 90)).toBe("11:30"); expect(addMinutes("23:30", 60)).toBe("00:30"); });
  it("calDate", () => { expect(calDate("2026-09-01", "10:00")).toBe("20260901T100000"); });
  it("monthShort", () => { expect(monthShort("2026-09")).toBe("Sep 26"); });
});
describe("sessionBucket", () => {
  const today = "2026-08-14";
  it("past -> completed", () => { expect(sessionBucket({ status: "active", date: "2026-01-01" }, today)).toBe("completed"); });
  it("future -> upcoming", () => { expect(sessionBucket({ date: "2026-12-01" }, today)).toBe("upcoming"); });
  it("same day -> today", () => { expect(sessionBucket({ date: today }, today)).toBe("today"); });
  it("cancelled -> completed regardless of date", () => { expect(sessionBucket({ status: "cancelled", date: "2026-12-01" }, today)).toBe("completed"); });
  it("dateless -> upcoming", () => { expect(sessionBucket({ date: "" }, today)).toBe("upcoming"); });
});
describe("uid", () => {
  it("prefixes and appends", () => { const u = uid("rcpt"); expect(u.startsWith("rcpt_")).toBe(true); expect(u.length).toBeGreaterThan(6); });
});
describe("timeGreeting", () => {
  it("returns a greeting for the current hour", () => { expect(["Good morning","Good afternoon","Good evening"]).toContain(timeGreeting()); });
});

