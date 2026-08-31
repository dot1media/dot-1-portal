// Dot One Media portal - theme tokens, palettes & shared style objects.
// Brand color fallbacks + fonts come from the shared ../brand tokens. Shape-tested in tests/portal/theme.test.js
import { BRAND } from "../brand";
const C = BRAND.colors;

export const RED = `var(--d1-accent, ${C.red})`;

export const INK = `var(--d1-ink, ${C.ink})`;

export const BODY = `var(--d1-body, ${C.body})`;

export const STONE = `var(--d1-stone, ${C.stone})`;

export const FAINT = `var(--d1-faint, ${C.faint})`;

export const LINE = `var(--d1-line, ${C.line})`;

export const PAPER = `var(--d1-paper, ${C.paper})`;

export const CREAM = `var(--d1-cream, ${C.cream})`;

export const OK = `var(--d1-ok, ${C.ok})`;

export const WARN = `var(--d1-warn, ${C.warn})`;

export const DANGER = `var(--d1-danger, ${C.danger})`;

export const THEME_VARS = ["--d1-accent", "--d1-cream", "--d1-paper", "--d1-line", "--d1-ink", "--d1-body", "--d1-stone", "--d1-faint", "--d1-ok", "--d1-warn", "--d1-danger"];

export const THEMES = {
  default:  { name: "Warm Paper", swatch: "#e23b2e", bg: "#f4f0e7", vars: null },
  slate:    { name: "Cool Slate", swatch: "#4f5b93", bg: "#f3f4f7", vars: { "--d1-accent": "#4f5b93", "--d1-cream": "#f3f4f7", "--d1-paper": "#ffffff", "--d1-line": "#e0e2e9", "--d1-ink": "#1b1d26", "--d1-body": "#343642", "--d1-stone": "#666a78", "--d1-faint": "#9a9dab" } },
  sand:     { name: "Warm Sand", swatch: "#c26b3e", bg: "#f7f2ea", vars: { "--d1-accent": "#c26b3e", "--d1-cream": "#f7f2ea", "--d1-paper": "#fffdf9", "--d1-line": "#e8e0d2", "--d1-ink": "#241f18", "--d1-body": "#3b3529", "--d1-stone": "#726a5b", "--d1-faint": "#a49c8b" } },
  forest:   { name: "Forest", swatch: "#3f7d4f", bg: "#f1f4ef", vars: { "--d1-accent": "#3f7d4f", "--d1-cream": "#f1f4ef", "--d1-paper": "#ffffff", "--d1-line": "#dde5da", "--d1-ink": "#18201a", "--d1-body": "#313a32", "--d1-stone": "#65705f", "--d1-faint": "#9aa593" } },
  graphite: { name: "Graphite", swatch: "#2f2f2f", bg: "#f5f5f4", vars: { "--d1-accent": "#2f2f2f", "--d1-cream": "#f5f5f4", "--d1-paper": "#ffffff", "--d1-line": "#e4e4e2", "--d1-ink": "#161616", "--d1-body": "#333333", "--d1-stone": "#6a6a68", "--d1-faint": "#9c9c99" } },
  plum:     { name: "Plum", swatch: "#7c4a94", bg: "#f5f2f6", vars: { "--d1-accent": "#7c4a94", "--d1-cream": "#f5f2f6", "--d1-paper": "#ffffff", "--d1-line": "#e7e0ea", "--d1-ink": "#1f1922", "--d1-body": "#39303e", "--d1-stone": "#6e6474", "--d1-faint": "#a29aa8" } },
  midnight: { name: "Midnight", swatch: "#e2554a", bg: "#15151a", vars: { "--d1-accent": "#e2554a", "--d1-cream": "#15151a", "--d1-paper": "#20202a", "--d1-line": "#34343f", "--d1-ink": "#f3f1ec", "--d1-body": "#c8c5c0", "--d1-stone": "#918e88", "--d1-faint": "#67645f", "--d1-ok": "#63c079", "--d1-warn": "#d6a24e", "--d1-danger": "#f0776b" } },
};

export const ACCENT_SWATCHES = ["#e23b2e", "#2f74c0", "#3f7d4f", "#7c4a94", "#c26b3e", "#2f2f2f", "#0d9488", "#d4348a"];

// Photography side: clean black & white with a light-blue accent (Acuity-like), scoped to photo views.
export const PHOTO_THEME_VARS = { "--d1-accent": "#4a90d9", "--d1-cream": "#ffffff", "--d1-paper": "#ffffff", "--d1-line": "#e7e9ee", "--d1-ink": "#16181d", "--d1-body": "#3c414a", "--d1-stone": "#6b7280", "--d1-faint": "#aab0ba" };
export function setPhotoTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const k of THEME_VARS) { if (PHOTO_THEME_VARS[k]) root.style.setProperty(k, PHOTO_THEME_VARS[k]); else root.style.removeProperty(k); }
  document.body.style.background = "#ffffff";
}

export function applyTheme(key, accent) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const t = THEMES[key] || THEMES.default;
  if (t.vars) { for (const k of THEME_VARS) { if (t.vars[k]) root.style.setProperty(k, t.vars[k]); else root.style.removeProperty(k); } }
  else { for (const k of THEME_VARS) root.style.removeProperty(k); }
  if (accent) root.style.setProperty("--d1-accent", accent);
}

export const display = { fontFamily: BRAND.fonts.display };

export const mono = { fontFamily: BRAND.fonts.mono };

export const card = { background: PAPER, border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: "0 1px 2px rgba(26,26,23,0.03), 0 12px 34px rgba(26,26,23,0.05)" };

export const cardDense = { background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: "0 1px 2px rgba(26,26,23,0.03), 0 6px 16px rgba(26,26,23,0.045)" };

// shared element styles (inputs & buttons) - use theme colors above
export const inputStyle = { width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" };
export const iconBtnStyle = { width: 30, height: 30, borderRadius: 7, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
export const navBtn = { width: 30, height: 30, borderRadius: 7, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
export const shareBtn = { display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", fontSize: 11.5, color: INK, fontFamily: "'IBM Plex Mono', monospace" };
export const btnGhost = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "9px 14px", borderRadius: 8, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 };
export const btnSolid = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "9px 14px", borderRadius: 8, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 };

