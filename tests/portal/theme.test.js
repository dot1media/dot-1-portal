import { describe, it, expect } from "vitest";
import { THEMES, THEME_VARS, ACCENT_SWATCHES, RED, PAPER, card, cardDense, mono, display, applyTheme, inputStyle, btnSolid, btnGhost } from "../../lib/portal/theme.js";
describe("theme tokens", () => {
  it("colors are css-var fallbacks", () => { expect(RED).toContain("--d1-accent"); expect(PAPER).toContain("--d1-paper"); });
  it("THEMES includes the expected themes + midnight", () => {
    expect(Object.keys(THEMES)).toEqual(expect.arrayContaining(["default","slate","sand","forest","graphite","plum","midnight"]));
    expect(THEMES.midnight.name).toBe("Midnight");
    expect(THEMES.midnight.vars["--d1-ink"]).toBe("#f3f1ec");
  });
  it("THEME_VARS lists 11 css vars incl accent", () => { expect(THEME_VARS).toHaveLength(11); expect(THEME_VARS).toContain("--d1-accent"); });
  it("ACCENT_SWATCHES are 6-digit hex", () => { ACCENT_SWATCHES.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/i)); });
  it("card style uses paper bg + line border", () => { expect(card.background).toBe(PAPER); expect(card.border).toContain("1px solid"); expect(cardDense.borderRadius).toBe(12); });
  it("font styles set families", () => { expect(mono.fontFamily).toContain("IBM Plex Mono"); expect(display.fontFamily).toContain("Bodoni Moda"); });
});
describe("applyTheme", () => {
  it("is a no-throw function when document is absent (node)", () => { expect(typeof applyTheme).toBe("function"); expect(() => applyTheme("midnight")).not.toThrow(); });
});
describe("shared element styles", () => {
  it("inputStyle is a full-width bordered box", () => { expect(inputStyle.width).toBe("100%"); expect(inputStyle.border).toContain("1px solid"); });
  it("btnSolid is a borderless white-text button", () => { expect(btnSolid.border).toBe("none"); expect(btnSolid.color).toBe("#fff"); });
  it("btnGhost has a border and mono font", () => { expect(btnGhost.border).toContain("1px solid"); expect(btnGhost.fontFamily).toContain("IBM Plex Mono"); });
});

