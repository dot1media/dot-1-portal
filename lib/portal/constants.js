// Dot One Media portal - shared config constants (settings, agreement text, doc metadata).
// Pure, no imports; shape-tested in tests/portal/constants.test.js

export const NOTIFY_EMAILS = {
  video: "video@dot1.media",
  photo: "photo@dot1.media",
  music: "contact@dot1.media",
  government: "contact@dot1.media",
};

export function isConsult(s) { return !!(s && /consult/i.test(s.type || "")); }

export const GOOGLE_REVIEW_URL = "https://g.page/r/Ceb1aSxQSvm6EBM/review/";

export const ADMINS = ["video@dot1.media", "photo@dot1.media"]; // studio login accounts

export const PORTAL_BASE = "https://portal.dot1.media/book/";
export const PORTAL_ROOT = "https://portal.dot1.media/";

export const STORAGE_KEY = "dot1_portal_v4";

export const DEFAULT_STATE = {
  sessions: [],
  takenSlots: [],
  services: [],
  addons: [],
  availability: [],
  directLinks: [],
};

export const PHOTO_CATEGORIES = ["Destination Photography", "Event Photography", "Portrait Photography"];

export const CLIENT_SERVICES_VERSION = "1.0";

export const RELEASE_VERSION = "1.0";

export const PDF_CLIENT_SERVICES = "/Dot-One-Media-Client-Services-Agreement.pdf";

export const PDF_RELEASE = "/Dot-One-Media-Release-and-Waiver.pdf";

export const PDF_MINOR = "/Dot-One-Media-Minor-Release-and-Waiver.pdf";

export const DOC_META = {
  client_services: { label: "Client Services Agreement", pdf: PDF_CLIENT_SERVICES },
  media_release: { label: "Media Release & Waiver", pdf: PDF_RELEASE },
  minor_release: { label: "Minor Release & Waiver", pdf: PDF_MINOR },
};

export const DOC_USAGE = { A: "Portfolio Use", B: "Full Commercial Use", C: "Private Use" };

export const BRIEF_FIELDS = [
  { key: "objective", label: "Project objective", help: "What should this project accomplish?" },
  { key: "audience", label: "Audience", help: "Who needs to see this, and what should they feel or do?" },
  { key: "keyMessages", label: "Key messages", help: "What must viewers understand or remember?" },
  { key: "visualDirection", label: "Visual direction", help: "Look and feel, tone, and any references or examples." },
  { key: "participants", label: "People / participants", help: "Who will be filmed or photographed? Names and roles." },
  { key: "locations", label: "Locations", help: "Where will we work? Address, parking, and access notes." },
  { key: "requirements", label: "Special requirements", help: "Wardrobe, accessibility, safety, timing, or anything else." },
];

export const CLIENT_SERVICES_SUMMARY = `Key terms for your booking. The full agreement is linked below.

Payment. Full payment is due no later than the start of your session; for video, the balance is due at least 24 hours before the filming date. We don't begin work or deliver until the payment due at that stage is paid in full.

Video sessions. A non-refundable 50% retainer (of your total, including any add-ons) is due at booking to reserve your date. Reschedule with at least 3 days' notice for a $150 fee (your retainer transfers). Fewer than 3 days' notice is treated as a cancellation.

Photography sessions. No retainer; the full session fee is due at or before your session. You may reschedule once with at least 24 hours' notice at no charge. Less notice, or cancelling, forfeits the fee.

No-shows & late payment. Missing a session without notice forfeits payments made. If we proceed despite an unpaid balance, a $100/day late fee (up to 7 days) may apply.

Travel. Video includes travel within 50 miles of the Mat-Su Valley; photography includes within 25 minutes of Eagle River. Beyond that, a travel add-on or $0.52/mile applies.

Deliverables & style. You're booking our creative style. We deliver the strongest images and footage, not every frame. Photography images may be purged after 6 months, so please download promptly.

Copyright. Dot One Media retains copyright; you receive a personal-use license unless a commercial license is arranged.

Liability is limited to the amount you paid for the project. Governed by Alaska law.`;

export function clientServicesSummary(group) {
  const g = String(group || "").toLowerCase();
  const base = CLIENT_SERVICES_SUMMARY;
  if (g === "video") {
    return base
      .replace("Payment. Full payment is due no later than the start of your session; for video, the balance is due at least 24 hours before the filming date. We don't begin work or deliver until the payment due at that stage is paid in full.", "Payment. Your balance is due at least 24 hours before the filming date. We don't begin work or deliver until the payment due at that stage is paid in full.")
      .replace("\n\nPhotography sessions. No retainer; the full session fee is due at or before your session. You may reschedule once with at least 24 hours' notice at no charge. Less notice, or cancelling, forfeits the fee.", "")
      .replace('Travel. Video includes travel within 50 miles of the Mat-Su Valley; photography includes within 25 minutes of Eagle River. Beyond that, a travel add-on or $0.52/mile applies.', 'Travel. Included within 50 miles of the Mat-Su Valley. Beyond that, a travel add-on or $0.52/mile applies.');
  }
  if (g === "photo") {
    return base
      .replace("Payment. Full payment is due no later than the start of your session; for video, the balance is due at least 24 hours before the filming date. We don't begin work or deliver until the payment due at that stage is paid in full.", "Payment. Full payment is due no later than the start of your session. We don't begin work or deliver until the payment due is paid in full.")
      .replace("Video sessions. A non-refundable 50% retainer (of your total, including any add-ons) is due at booking to reserve your date. Reschedule with at least 3 days' notice for a $150 fee (your retainer transfers). Fewer than 3 days' notice is treated as a cancellation.\n\n", "")
      .replace('Travel. Video includes travel within 50 miles of the Mat-Su Valley; photography includes within 25 minutes of Eagle River. Beyond that, a travel add-on or $0.52/mile applies.', 'Travel. Included within 25 minutes of Eagle River. Beyond that, a travel add-on or $0.52/mile applies.');
  }
  return base;
}


export const RELEASE_SUMMARY = `Media release and liability waiver for adults (18 and over). The full document is linked below.

You consent to being photographed and filmed, and to the capture of your name, likeness, image, and voice.

Dot One Media owns the copyright in the content; you receive use rights according to the choice you make below.

You choose how your images and video may be used (Option A, B, or C below).

You waive the right to pre-approve the finished content, and you release Dot One Media from claims arising from the permitted uses and from ordinary session risks.

Liability is limited to the amount paid for the session. Governed by Alaska law.

If the person being photographed is under 18, check the box above and a parent or guardian will sign the Minor Release instead.`;

export const MINOR_SUMMARY = `Media release and liability waiver for a child under 18, signed by the parent or legal guardian. The full document is linked below.

You confirm you are the parent or legal guardian, with authority to sign for the child.

You consent, on the child's behalf, to the child being photographed and filmed.

Dot One Media owns the copyright; use of the child's images follows the choice you make below.

Dot One Media will not publish the child's full name or identifying details without your separate permission, and will use only a first name or no name in permitted uses.

You release Dot One Media, on your and the child's behalf, from claims arising from the permitted uses and ordinary session risks. Liability is limited to the amount paid.`;

