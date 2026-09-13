// Dot One Media - canonical brand tokens: the single source of truth for
// color, type, and voice. This file is kept identical across the Dot One
// apps. Edit it here, then copy it into the other repos so they stay in sync.

export const BRAND = {
  colors: {
    red: "#111111",     // primary accent (default black; per-app accent overrides via --d1-accent)
    ink: "#1a1a17",     // near-black headings
    body: "#33322d",    // body text
    stone: "#6f6d65",   // muted text
    faint: "#9a988f",   // faint text / hints
    line: "#e2ded4",    // borders / dividers
    paper: "#ffffff",   // card + surface background
    cream: "#ffffff",   // page background (white theme)
    ok: "#3f7a3f",      // success
    warn: "#a97a2e",    // warning
    danger: "#b5271b",  // danger / destructive
  },
  fonts: {
    display: "'Bodoni Moda', Georgia, serif",
    sans: "'Archivo', system-ui, -apple-system, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
    elegant: "'Fraunces', Georgia, serif",
  },
  tagline: "Create with purpose",
  // sub-brand accents
  news: { red: "#b81616" },
  photography: { blue: "#2f74c0" },
};
