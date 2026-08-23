import React, { useState, useEffect } from "react";
import { LayoutDashboard, Boxes, Newspaper, ArrowRight, ShieldCheck, LogOut, Users, ExternalLink } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, display, mono, card } from "./theme";

// Icon per app id.
const APP_ICON = { studio: LayoutDashboard, assets: Boxes, editorial: Newspaper };

// The standalone hub a @dot1.media account lands on after login (Option C). It belongs to no single
// app: it is a doorway. Tiles show only the apps this account may enter, resolved fresh from the
// server. Studio opens the portal's own admin view in place; assets and editorial link out.
export function SuiteHub({ onEnterStudio, onManageAccounts, onLogout }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/suite/me");
        if (!r.ok) { if (alive) setError("Your session has expired. Please sign in again."); return; }
        const d = await r.json();
        if (alive) setMe(d);
      } catch { if (alive) setError("Could not load your access."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const openApp = (app) => {
    if (app.id === "studio" || !app.url) { onEnterStudio(); return; }
    window.location.href = app.url;
  };

  return (
    <div style={{ minHeight: "72vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 860 }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: RED, marginBottom: 12 }}>Dot One Suite</div>
          <div style={{ ...display, fontSize: 34, fontWeight: 700, color: INK, lineHeight: 1.1 }}>Where would you like to go?</div>
          {me && <div style={{ fontSize: 13.5, color: STONE, marginTop: 10 }}>Signed in as {me.email}{me.tier ? ` · ${me.tier}` : ""}</div>}
        </div>

        {loading && <div style={{ ...mono, fontSize: 11, color: STONE, textAlign: "center" }}>Loading your access…</div>}
        {error && <div style={{ ...card, padding: 20, color: DANGERC, textAlign: "center" }}>{error}</div>}

        {me && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
              {me.apps.length === 0 && (
                <div style={{ ...card, padding: 24, gridColumn: "1 / -1", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: INK, fontWeight: 600, marginBottom: 6 }}>No apps yet</div>
                  <div style={{ fontSize: 13, color: STONE }}>Your account doesn't have access to any app yet. Ask an owner to grant access.</div>
                </div>
              )}
              {me.apps.map((app) => {
                const Icon = APP_ICON[app.id] || LayoutDashboard;
                const external = app.id !== "studio" && app.url;
                return (
                  <button key={app.id} onClick={() => openApp(app)}
                    style={{ ...card, textAlign: "left", padding: 22, cursor: "pointer", border: `1px solid ${LINE}`, background: PAPER, display: "flex", flexDirection: "column", gap: 12, transition: "transform .12s, box-shadow .12s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(26,26,23,0.10)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = card.boxShadow; }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={21} color={RED} />
                      </div>
                      {external ? <ExternalLink size={15} color={FAINT} /> : <ArrowRight size={16} color={FAINT} />}
                    </div>
                    <div>
                      <div style={{ ...display, fontSize: 19, fontWeight: 700, color: INK }}>{app.name}</div>
                      <div style={{ fontSize: 12.5, color: STONE, marginTop: 4, lineHeight: 1.45 }}>{app.blurb}</div>
                    </div>
                    {app.role && <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, border: `1px solid ${LINE}`, borderRadius: 20, padding: "3px 10px", alignSelf: "flex-start" }}>{app.role}</div>}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 30 }}>
              {me.canManageAccounts && (
                <button onClick={onManageAccounts} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: INK, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={14} /> Manage accounts
                </button>
              )}
              <button onClick={onLogout} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const DANGERC = "#b3261e";
