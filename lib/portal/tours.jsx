import React from "react";

// Step data for the portal's interactive guides: self-contained Walkthroughs
// (illustrated) and live UITours (spotlight real elements). Tailored per
// surface: client and studio/admin.

const RED = "#e23b2e", INK = "#1a1a17", LINE = "#e2ded4", PAPER = "#faf8f3", MUTE = "#8a857b", CREAM = "#f4f0e7";

// A small, generic screen illustration: a titled card with a few labeled rows.
function MiniScreen({ title, rows, accent = RED }) {
  const w = 600, top = 34, rowH = 30, gap = 8;
  const h = top + rows.length * (rowH + gap) + 12;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width={w - 2} height={h - 2} rx="10" fill={PAPER} stroke={LINE} />
      <rect x="1" y="1" width={w - 2} height="26" rx="10" fill={CREAM} />
      <circle cx="16" cy="13.5" r="3.5" fill={accent} />
      <circle cx="28" cy="13.5" r="3.5" fill="#d8b24a" />
      <circle cx="40" cy="13.5" r="3.5" fill={LINE} />
      <text x={w / 2} y="17.5" textAnchor="middle" fontFamily="ui-sans-serif,system-ui" fontSize="10.5" fill={MUTE} letterSpacing="1">{title}</text>
      {rows.map((r, i) => {
        const y = top + i * (rowH + gap);
        const hot = typeof r === "object" && r.hot;
        const label = typeof r === "object" ? r.label : r;
        return (
          <g key={i}>
            <rect x="16" y={y} width={w - 32} height={rowH} rx="7" fill={hot ? accent + "14" : "#ffffff"} stroke={hot ? accent + "88" : LINE} />
            <circle cx="33" cy={y + rowH / 2} r="5" fill={hot ? accent : LINE} />
            <text x="48" y={y + rowH / 2 + 4} fontFamily="ui-sans-serif,system-ui" fontSize="12.5" fontWeight={hot ? 700 : 500} fill={hot ? INK : "#44413b"}>{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const CLIENT_WALK = [
  { tag: "Your portal", title: "Everything in one place", body: "portal.dot1.media is your private home for working with the studio: book, sign, pay, follow your project, message us, and get your finished work, all in one link.", art: <MiniScreen title="YOUR PROJECT" rows={["Timeline", "Production brief", "Messages", "Delivery"]} /> },
  { tag: "Book", title: "Book a session", body: "Choose your service, add any extras, then pick an open day and time. Your running total updates as you go. If we sent you a personal link, your slot is already held.", art: <MiniScreen title="BOOK A SESSION" rows={["Choose a service", "Add-ons", { label: "Choose a day & time", hot: true }]} /> },
  { tag: "Sign & pay", title: "Create your account and pay", body: "Review and sign the agreements, choose how your images and video may be used, then pay securely through Square, pay in full or a deposit to hold your date. You will get a receipt by email.", art: <MiniScreen title="SIGN & PAY" rows={["Read the agreements", "Choose image use", { label: "Pay securely (Square)", hot: true }]} /> },
  { tag: "Custom work", title: "Accepting a quote", body: "For custom or larger work we may send a quote link instead. Review the itemized total and the retainer to reserve, then confirm by paying the retainer, which books your date.", art: <MiniScreen title="QUOTE" rows={["Itemized total", "Retainer to reserve (50%)", { label: "Reserve my session", hot: true }]} /> },
  { tag: "Follow along", title: "Your timeline and brief", body: "Your project page shows exactly where things stand on a timeline, plus a production brief to tell us about your session and a message thread to reach us any time.", art: <MiniScreen title="TIMELINE" rows={["Scheduled → Delivered", "Fill your production brief", "Message the studio"]} /> },
  { tag: "Delivery", title: "Get your finished work", body: "At Final Delivery your page shows your finished work with a link to view and download your gallery or files. Afterward you may see a friendly prompt to leave a review.", art: <MiniScreen title="DELIVERY" rows={[{ label: "Your finished work is ready", hot: true }, "View & download", "Leave a review"]} /> },
];

export const ADMIN_WALK = [
  { tag: "Daily views", title: "Dashboard, Calendar, Sessions", body: "Most of your work lives across three areas: the Dashboard for an at-a-glance start, the Calendar for your week by type of work, and Sessions for the full list you open to work a booking.", art: <MiniScreen title="STUDIO" rows={["Home · upcoming sessions", "Calendar · your week", { label: "Sessions · open one to work it", hot: true }]} /> },
  { tag: "The workflow", title: "Move a session forward", body: "Every project moves through stages from Scheduled to Final Delivery. Advance a session only when it is genuinely true, the client is notified each time and their own screen updates to match.", art: <MiniScreen title="SESSION STAGES" rows={["Booked & Confirmed", { label: "Editing", hot: true }, "Pre-Delivery Review", "Final Delivery"]} /> },
  { tag: "Take a booking", title: "Book, link, invoice, or quote", body: "Take a booking the way that fits: an internal booking, a direct link that holds a slot for one client, an invoice that books and bills in one send, or a quote for custom work.", art: <MiniScreen title="NEW" rows={["Internal booking", "Direct booking link", "Invoice (book + bill)", { label: "Quote → convert to invoice", hot: true }]} /> },
  { tag: "Getting paid", title: "Send a balance invoice", body: "When a client owes the rest after a deposit, send a balance invoice from the session. It bills the remaining balance plus add-ons, with the deposit credited, and marks itself Paid once it clears.", art: <MiniScreen title="BALANCE INVOICE" rows={["Remaining balance", "Deposit credited", { label: "Send · pays via Square", hot: true }]} /> },
  { tag: "Releases", title: "Model releases for a session", body: "A session can carry one release per person. Send an e-sign link to anyone with an email, or use the printable PDF for someone without one. Each signed release is saved to the session.", art: <MiniScreen title="MODEL RELEASES" rows={[{ label: "Send e-sign link", hot: true }, "Printable PDF", "Signed copies saved"]} /> },
  { tag: "Delivery", title: "Deliver the finished work", body: "Paste the gallery or file link on the session. Nothing is emailed until you confirm, so a client is never sent a half-ready link. Confirm to notify and mark the work delivered.", art: <MiniScreen title="DELIVER" rows={["Paste gallery / file link", "Saved — not sent yet", { label: "Confirm to notify client", hot: true }]} /> },
  { tag: "Run the studio", title: "Business and accounts", body: "Business Settings holds insights, exports, and receipts. Account Management handles client logins and studio admin accounts. Settings cover appearance and calendar sync.", art: <MiniScreen title="BUSINESS" rows={["Insights & exports", "Receipts · sync from Square", "Account management"]} /> },
];

export const CLIENT_TOUR = [
  { selector: "#d1-timeline", title: "Your timeline", body: "This is where your project stands, stage by stage, and where your finished work appears when it is ready.", placement: "top" },
  { selector: "#d1-brief", title: "Production brief", body: "Tell us about your session, your vision, location, and the vibe, so we can prepare. Save a draft any time.", placement: "top" },
  { selector: "#d1-payment", title: "Payments", body: "Any balance or extra item the studio adds shows here with a secure Pay now button.", placement: "top" },
  { selector: "#d1-releases", title: "Media releases", body: "Any release tied to your session appears here to review and sign.", placement: "top" },
  { selector: "#d1-reschedule", title: "Need a new date?", body: "Request a new date here; it comes to the studio to confirm.", placement: "top" },
];

export const ADMIN_TOUR = [
  { selector: '[data-tour="admin-home"]', title: "Home", body: "Your day at a glance, including upcoming sessions. Start here each day.", placement: "bottom" },
  { selector: '[data-tour="admin-sessions"]', title: "Sessions", body: "The full list. Open a booking to move its stage, message the client, request payment, send releases, and deliver.", placement: "bottom" },
  { selector: '[data-tour="admin-calendar"]', title: "Calendar", body: "Your bookings by day, color-coded by type of work.", placement: "bottom" },
  { selector: '[data-tour="admin-availability"]', title: "Availability", body: "Set your open hours, and send a direct booking link that holds a slot for one client.", placement: "bottom" },
  { selector: '[data-tour="admin-services"]', title: "Services & Add-ons", body: "Manage what clients can book, prices, buffers, and which add-ons apply.", placement: "bottom" },
  { selector: '[data-tour="admin-business"]', title: "Business Settings", body: "Insights, exports, receipts, and importing past sessions.", placement: "bottom" },
  { selector: '[data-tour="admin-account"]', title: "Account Management", body: "Help a client with their login, and manage studio admin accounts. Replay this tour any time from the guide.", placement: "bottom" },
];
