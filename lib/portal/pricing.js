// Dot One Media portal - booking price math (pure, no imports so it can be unit-tested).
// Extracted verbatim from BookingFlow so the numbers live in one place and are covered by
// tests/pricing.test.js. Any future change here that breaks the math will fail those tests.

// Project total = base service price + the sum of the chosen add-on prices.
// Non-numeric prices count as 0 (matches the original inline reduce).
export function bookingTotal(basePrice, addons) {
  return (Number(basePrice) || 0) + (addons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
}

// Amount due today for the chosen payment option: a fixed dollar amount if the option sets one,
// otherwise a rounded percentage of the total. Returns 0 when no option is passed.
// The (pct || 0) guard is defensive - every real option defines pct, so this matches the
// original inline math exactly for all real inputs.
export function optionAmount(option, total) {
  if (!option) return 0;
  return option.fixed != null ? option.fixed : Math.round(total * ((option.pct || 0) / 100));
}

