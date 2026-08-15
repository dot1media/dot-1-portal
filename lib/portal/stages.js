// Dot One Media portal - session stages + payment rules (reference lucide icons; not unit-tested).
import { CalendarCheck, Camera, CheckCircle2, CreditCard, Eye, FileCheck, Music, PackageCheck, Scissors, Upload, Wallet } from "lucide-react";
import { isConsult } from "./constants";

export const PAYMENT_RULES = {
  video: { label: "Video payment", Icon: CreditCard, options: [{ key: "retainer", label: "Pay 50% retainer now", pct: 50 }, { key: "full", label: "Pay in full", pct: 100 }], note: "A 50% retainer (of your total, add-ons included) reserves your date. Balance due 24 hours before filming. Retainer is non-refundable.", reschedFee: 150 },
  photo: { label: "Photography payment", Icon: Wallet, options: [{ key: "full", label: "Pay in full now", pct: 100 }, { key: "half", label: "Pay 50% deposit now", pct: 50 }], note: "Payment is due before your session. A 50% deposit holds your date; the balance is due before the session start.", reschedFee: 0 },
  music: { label: "Music payment", Icon: Wallet, options: [{ key: "quote", label: "Request a quote", pct: 0 }], note: "Custom-quoted per project. No online checkout yet.", reschedFee: 0 },
  government: { label: "Government payment", Icon: Wallet, options: [{ key: "quote", label: "Request a quote", pct: 0 }], note: "Always custom-quoted and invoiced. No online checkout.", reschedFee: 0 },
};

export const STAGES = [
  { key: "scheduled", label: "Session Scheduled", Icon: CalendarCheck, desc: "Your session is on the calendar. We'll review the details and confirm everything with you shortly." },
  { key: "confirmed", label: "Booked & Confirmed", Icon: FileCheck, desc: "Everything's confirmed and locked in. Next, we prepare for your session day." },
  { key: "dayof", label: "Day of Session", Icon: Camera, desc: "It's session day, when we capture everything. Afterward, we move into post-production." },
  { key: "post", label: "Post-Session", Icon: Upload, desc: "That's a wrap. Your files are safely backed up while we select the strongest moments to edit." },
  { key: "editing", label: "Editing", Icon: Scissors, desc: "The creative work is underway. We're editing and crafting your final pieces frame by frame." },
  { key: "predelivery", label: "Pre-Delivery Review", Icon: Eye, desc: "Your preview is ready to review. Take a look and tell us if you'd like any changes before final delivery." },
  { key: "delivered", label: "Final Delivery", Icon: PackageCheck, desc: "All done. Your finished work is ready and delivered below. Thank you for trusting us with your story." },
];

export const CONSULT_STAGES = [
  { key: "scheduled", label: "Consultation Scheduled", Icon: CalendarCheck, desc: "Your consultation is on the calendar. We'll confirm the details with you shortly." },
  { key: "confirmed", label: "Confirmed", Icon: FileCheck, desc: "Your consultation is confirmed. We're looking forward to speaking with you." },
  { key: "complete", label: "Consultation Complete", Icon: CheckCircle2, desc: "Your consultation is complete. Thank you for meeting with us. If we discussed a project, we'll follow up with next steps." },
];

export function stagesFor(s) { return isConsult(s) ? CONSULT_STAGES : STAGES; }

export function curStage(s) { const st = stagesFor(s); return st[Math.min(Math.max((s && s.currentStage) || 0, 0), st.length - 1)] || st[0]; }

