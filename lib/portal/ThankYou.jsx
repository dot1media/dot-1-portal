"use client";
import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { mono, display, INK, BODY, STONE, FAINT, LINE, PAPER, OK, btnSolid } from "./theme";
import { GROUPS } from "./groups";

// Post-booking moment. A slow, confident black-&-white sequence: a hairline draws down,
// the seal stroke-draws and settles, the client's name and confirmation rise in one at a time,
// then the portal button. Restraint = expensive. Fully honors reduced-motion.
export function ThankYou({ session, onPortal, brand = { orgName: "Dot One Media", tagline: "Create with purpose." } }) {
  const grp = session ? (GROUPS[session.serviceLine] || GROUPS.video) : GROUPS.video;
  const accent = grp.color; // in the client portal this resolves to the black accent
  const paid = session && session.paymentStatus === "paid";
  const [firstName] = ((session && session.clientName) || "").trim().split(/\s+/);
  const type = (session && session.type) || "session";
  const [reduced, setReduced] = useState(false);
  useEffect(() => { try { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) {} }, []);

  return (
    <div className="d1-ty" style={{ position: "relative", minHeight: "78vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: 620, margin: "0 auto", padding: "56px 24px 64px", textAlign: "center", overflow: "hidden" }}>
      <style>{`
        @keyframes tyLine{0%{transform:scaleY(0)}100%{transform:scaleY(1)}}
        @keyframes tyDraw{to{stroke-dashoffset:0}}
        @keyframes tySeal{0%{opacity:0;transform:scale(.82)}100%{opacity:1;transform:scale(1)}}
        @keyframes tyHalo{0%{transform:scale(.5);opacity:0}45%{opacity:.5}100%{transform:scale(2.6);opacity:0}}
        @keyframes tyRise{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:none}}
        @keyframes tyWide{0%{opacity:0;letter-spacing:.02em}100%{opacity:1;letter-spacing:.34em}}
        @keyframes tyRule{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
        .d1-ty *{--e:cubic-bezier(.22,1,.36,1)}
        .d1-ty .ty-line{width:1px;height:52px;background:${LINE};transform-origin:top;animation:tyLine .8s var(--e) both;margin-bottom:30px}
        .d1-ty .ty-seal{position:relative;width:88px;height:88px;margin:0 auto 30px;animation:tySeal 1s var(--e) both;animation-delay:.5s}
        .d1-ty .ty-halo{position:absolute;inset:-10px;border-radius:50%;border:1px solid ${accent};opacity:0;animation:tyHalo 2.4s var(--e) both;animation-delay:1.15s}
        .d1-ty .ty-seal svg{position:relative;width:88px;height:88px}
        .d1-ty .ty-ring-c{fill:none;stroke:${LINE};stroke-width:1.5}
        .d1-ty .ty-check{fill:none;stroke:${accent};stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:48;stroke-dashoffset:48;animation:tyDraw .9s var(--e) both;animation-delay:1.05s}
        .d1-ty .ty-kicker{opacity:0;animation:tyWide 1.1s var(--e) both;animation-delay:1.35s}
        .d1-ty .ty-name{opacity:0;animation:tyRise 1s var(--e) both;animation-delay:1.6s}
        .d1-ty .ty-sub{opacity:0;animation:tyRise 1s var(--e) both;animation-delay:1.85s}
        .d1-ty .ty-rule{width:40px;height:1px;background:${accent};margin:22px auto;transform-origin:center;opacity:0;animation:tyRule .9s var(--e) both,tyRise .01s linear both;animation-delay:2.05s}
        .d1-ty .ty-copy{opacity:0;animation:tyRise 1s var(--e) both;animation-delay:2.2s}
        .d1-ty .ty-paid{opacity:0;animation:tyRise 1s var(--e) both;animation-delay:2.35s}
        .d1-ty .ty-cta{opacity:0;animation:tyRise 1s var(--e) both;animation-delay:2.55s}
        .d1-ty .ty-foot{opacity:0;animation:tyRise 1s var(--e) both;animation-delay:2.8s}
        .d1-ty .ty-cta button{transition:transform .5s var(--e),box-shadow .5s var(--e)}
        .d1-ty .ty-cta button:hover{transform:translateY(-2px);box-shadow:0 18px 40px -22px ${accent}}
        @media (prefers-reduced-motion: reduce){ .d1-ty *{animation:none!important;opacity:1!important;transform:none!important;stroke-dashoffset:0!important;letter-spacing:.34em} .d1-ty .ty-kicker{letter-spacing:.34em} }
      `}</style>

      {!reduced && <div className="ty-line" aria-hidden="true" />}

      <div className="ty-seal" aria-hidden="true">
        <span className="ty-halo" />
        <svg viewBox="0 0 88 88">
          <circle className="ty-ring-c" cx="44" cy="44" r="42" />
          <path className="ty-check" d="M28 45.5 L39.5 57 L61 33" />
        </svg>
      </div>

      <div className="ty-kicker" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.34em", textTransform: "uppercase", color: STONE, marginBottom: 18 }}>Booking confirmed</div>

      <h1 className="ty-name" style={{ ...display, fontWeight: 700, fontSize: "clamp(30px,6vw,46px)", lineHeight: 1.08, color: INK, margin: 0 }}>
        Thank you{firstName ? <>, <span style={{ fontStyle: "italic" }}>{firstName}</span></> : ""}.
      </h1>
      <div className="ty-sub" style={{ ...display, fontStyle: "italic", fontSize: "clamp(17px,2.6vw,22px)", color: STONE, marginTop: 8 }}>Your {type} is reserved.</div>

      <div className="ty-rule" aria-hidden="true" />

      {paid && <div className="ty-paid" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: OK, marginBottom: 6 }}>Payment received</div>}

      <p className="ty-copy" style={{ fontSize: 14.5, color: BODY, lineHeight: 1.7, maxWidth: 440, margin: "8px auto 30px" }}>
        We've emailed your confirmation. Your portal is ready, a calm place to follow everything from this moment through final delivery.
      </p>

      <div className="ty-cta"><button onClick={onPortal} style={{ ...btnSolid, background: accent, fontSize: 14, padding: "15px 30px", margin: "0 auto", borderRadius: 10 }}>Enter your portal <ArrowRight size={16} /></button></div>
      <div className="ty-foot" style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: FAINT, marginTop: 26 }}>portal.dot1.media</div>
    </div>
  );
}
