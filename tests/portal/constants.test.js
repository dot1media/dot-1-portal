import { describe, it, expect } from "vitest";
import { NOTIFY_EMAILS, DEFAULT_STATE, PHOTO_CATEGORIES, DOC_META, DOC_USAGE, BRIEF_FIELDS, isConsult, CLIENT_SERVICES_SUMMARY, RELEASE_SUMMARY, MINOR_SUMMARY, PDF_CLIENT_SERVICES, ADMINS, PORTAL_BASE } from "../../lib/portal/constants.js";
describe("isConsult", () => {
  it("true for consultation types", () => { expect(isConsult({ type: "Free Consultation" })).toBe(true); expect(isConsult({ type: "consult call" })).toBe(true); });
  it("false for non-consult / missing", () => { expect(isConsult({ type: "Video Session" })).toBe(false); expect(isConsult(null)).toBe(false); expect(isConsult({})).toBe(false); });
});
describe("config shape", () => {
  it("DEFAULT_STATE has empty arrays", () => { expect(DEFAULT_STATE.sessions).toEqual([]); expect(Array.isArray(DEFAULT_STATE.services)).toBe(true); });
  it("NOTIFY_EMAILS routes each group", () => { ["video","photo","music","government"].forEach(g => expect(NOTIFY_EMAILS[g]).toContain("@dot1.media")); });
  it("PHOTO_CATEGORIES lists 3", () => { expect(PHOTO_CATEGORIES).toHaveLength(3); });
  it("DOC_META entries carry a .pdf path", () => { expect(DOC_META.client_services.pdf).toBe(PDF_CLIENT_SERVICES); Object.values(DOC_META).forEach(d => expect(d.pdf).toMatch(/\.pdf$/)); });
  it("DOC_USAGE has A/B/C", () => { expect(Object.keys(DOC_USAGE)).toEqual(["A","B","C"]); });
  it("BRIEF_FIELDS each has key+label+help", () => { expect(BRIEF_FIELDS.length).toBeGreaterThan(0); BRIEF_FIELDS.forEach(f => { expect(f.key).toBeTruthy(); expect(f.label).toBeTruthy(); expect(f.help).toBeTruthy(); }); });
  it("agreement summaries are non-empty", () => { [CLIENT_SERVICES_SUMMARY, RELEASE_SUMMARY, MINOR_SUMMARY].forEach(s => expect(s.length).toBeGreaterThan(50)); });
  it("ADMINS + PORTAL_BASE look right", () => { expect(ADMINS).toContain("video@dot1.media"); expect(PORTAL_BASE).toContain("portal.dot1.media"); });
});

