// Dot One Media portal - pure CSV / Acuity import parsers.
// No React, no browser APIs. Unit-tested in tests/portal/csv.test.js

export function parseCsvRows(text) {
  const rows = []; let row = []; let field = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else { if (c === '"') inQ = true; else if (c === ",") { row.push(field); field = ""; } else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; } else if (c !== "\r") field += c; }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export const ACUITY_MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

export function parseAcuityStart(str) {
  const s = String(str || "").trim();
  let m = s.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (m && ACUITY_MONTHS[m[1].toLowerCase()]) {
    const mo = ACUITY_MONTHS[m[1].toLowerCase()];
    let hh = parseInt(m[4], 10); const ap = (m[6] || "").toLowerCase();
    if (ap === "pm" && hh !== 12) hh += 12; if (ap === "am" && hh === 12) hh = 0;
    return { date: m[3] + "-" + String(mo).padStart(2, "0") + "-" + String(m[2]).padStart(2, "0"), time: String(hh).padStart(2, "0") + ":" + m[5] };
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (m) {
    let yr = parseInt(m[3], 10); if (yr < 100) yr += 2000;
    let hh = parseInt(m[4], 10); const ap = (m[6] || "").toLowerCase();
    if (ap === "pm" && hh !== 12) hh += 12; if (ap === "am" && hh === 12) hh = 0;
    return { date: yr + "-" + String(parseInt(m[1], 10)).padStart(2, "0") + "-" + String(parseInt(m[2], 10)).padStart(2, "0"), time: String(hh).padStart(2, "0") + ":" + m[5] };
  }
  return { date: "", time: "" };
}

export function importServiceLine(t) { return /\b(film|films|video|videos|cinema|cinematic|motion|documentary|reel|footage)\b/i.test(String(t || "")) ? "video" : "photo"; }

