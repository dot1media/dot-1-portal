// Dot One Media portal - service editor form (+ its private image-resize helper).
import React from "react";
import { Check, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { BODY, STONE, FAINT, LINE, PAPER, CREAM, mono, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS } from "./groups";
import { FieldLabel, TextInput, RadioPill } from "./ui";

function resizeImageTo(file, max) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h > max) { w = Math.round(w * max / h); h = max; }
        const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject; img.src = reader.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export function ServiceForm({ form, setForm, onSave, onCancel, group, groupAddons, packages }) {
  const g = GROUPS[group];
  const multiBiz = new Set((packages || []).map((p) => p.business_name).filter(Boolean)).size > 1;
  return (
    <div style={{ border: `1px solid ${g.color}`, borderRadius: 10, padding: "16px", marginBottom: 14, background: PAPER }}>
      <FieldLabel>Service name</FieldLabel>
      <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Legacy Story Video" />
      <FieldLabel>Description</FieldLabel>
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What this service includes…" style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", resize: "vertical", background: PAPER, color: BODY, boxSizing: "border-box", marginBottom: 12 }} />
      <FieldLabel>Example image (optional, shown to clients when they choose this service)</FieldLabel>
      {form.image ? (
        <div style={{ position: "relative", marginBottom: 12, borderRadius: 9, overflow: "hidden", border: `1px solid ${LINE}` }}>
          <img src={form.image} alt="" style={{ width: "100%", maxHeight: 190, objectFit: "cover", display: "block" }} />
          <button onClick={() => setForm({ ...form, image: "" })} style={{ position: "absolute", top: 8, right: 8, background: "rgba(26,26,23,0.72)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 9px", cursor: "pointer", ...mono, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 5 }}><Trash2 size={11} /> Remove</button>
        </div>
      ) : (
        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12, padding: "16px", borderRadius: 9, border: `1.5px dashed ${LINE}`, background: CREAM, cursor: "pointer", color: STONE, fontSize: 12.5 }}>
          <ImageIcon size={15} /> Upload an example image
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; try { const url = await resizeImageTo(f, 640); setForm((prev) => ({ ...prev, image: url })); } catch (err) {} if (e.target) e.target.value = ""; }} />
        </label>
      )}
      <FieldLabel>Sub-category (optional, groups this under a client-facing heading)</FieldLabel>
      <TextInput value={form.category || ""} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Destination Photography" />
      <FieldLabel>Location (shown in the booking confirmation email)</FieldLabel>
      <TextInput value={form.location || ""} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. Mirror Lake" />
      <FieldLabel>Location map link (optional)</FieldLabel>
      <TextInput value={form.locationUrl || ""} onChange={(v) => setForm({ ...form, locationUrl: v })} placeholder="https://maps.app.goo.gl/..." />
      <FieldLabel>Price (USD)</FieldLabel>
      <TextInput value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="e.g. 1200" prefix="$" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><FieldLabel>Duration (min)</FieldLabel><TextInput value={form.duration || ""} onChange={(v) => setForm({ ...form, duration: v })} placeholder="90" /></div>
        <div style={{ flex: 1 }}><FieldLabel>Pad before</FieldLabel><TextInput value={form.padBefore || ""} onChange={(v) => setForm({ ...form, padBefore: v })} placeholder="0" /></div>
        <div style={{ flex: 1 }}><FieldLabel>Pad after</FieldLabel><TextInput value={form.padAfter || ""} onChange={(v) => setForm({ ...form, padAfter: v })} placeholder="0" /></div>
      </div>
      <div style={{ ...mono, fontSize: 10, color: FAINT, margin: "4px 0 12px", lineHeight: 1.5 }}>Duration plus padding is the total time this booking reserves on the calendar. Add-on minutes stack on top.</div>
      <FieldLabel>Camera package (optional, the gear kit this appointment type needs)</FieldLabel>
      <select value={form.packageId || ""} onChange={(e) => setForm({ ...form, packageId: e.target.value })} style={{ ...inputStyle, cursor: "pointer", marginBottom: (packages && packages.length) ? 12 : 4 }}>
        <option value="">No package</option>
        {(packages || []).map((p) => <option key={p.id} value={p.id}>{p.name}{multiBiz && p.business_name ? ` \u00b7 ${p.business_name}` : ""}{p.unit_count ? ` \u00b7 ${p.unit_count} items` : ""}</option>)}
      </select>
      {(!packages || packages.length === 0) && <div style={{ ...mono, fontSize: 10, color: FAINT, margin: "0 0 12px", lineHeight: 1.5 }}>No camera packages found yet. Create them in the assets app.</div>}
      <FieldLabel>Add-on availability</FieldLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <RadioPill active={form.addonMode === "group"} onClick={() => setForm({ ...form, addonMode: "group" })} label={`All ${g.label} add-ons`} accent={g.color} />
        <RadioPill active={form.addonMode === "custom"} onClick={() => setForm({ ...form, addonMode: "custom" })} label="Choose specific add-ons" accent={g.color} />
      </div>
      {form.addonMode === "group" && <div style={{ ...mono, fontSize: 10, color: FAINT, marginBottom: 12, lineHeight: 1.5 }}>Every {g.label.toLowerCase()} add-on you create will be offered on this service automatically.</div>}
      {form.addonMode === "custom" && (
        <div style={{ marginBottom: 12 }}>
          {groupAddons.length === 0 ? <div style={{ ...mono, fontSize: 10, color: FAINT }}>No {g.label.toLowerCase()} add-ons exist yet — create some first, then pick them here.</div> : groupAddons.map((a) => { const on = (form.addonIds || []).includes(a.id); return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer" }} onClick={() => { const set = new Set(form.addonIds || []); on ? set.delete(a.id) : set.add(a.id); setForm({ ...form, addonIds: Array.from(set) }); }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? g.color : LINE}`, background: on ? g.color : PAPER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <Check size={11} color="#fff" />}</span>
              <span style={{ fontSize: 12.5 }}>{a.name} {a.price ? <span style={{ color: STONE }}>· ${a.price}</span> : null}</span>
            </div>
          ); })}
        </div>
      )}
      <FieldLabel>Confirmation email message (optional, sent to the client when they book this)</FieldLabel>
      <textarea value={form.confirmationMessage || ""} onChange={(e) => setForm({ ...form, confirmationMessage: e.target.value })} rows={7} placeholder={"Thank you, your appointment has been successfully scheduled!\n\nAdd your personal note, what to expect, and any links you want to share. Links become clickable automatically."} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", resize: "vertical", background: PAPER, color: BODY, boxSizing: "border-box", marginBottom: 6 }} />
      <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginBottom: 12, lineHeight: 1.5 }}>Leave blank to use the standard confirmation. The location above is added to the email automatically.</div>
      <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "4px 0 12px", cursor: "pointer" }}>
        <input type="checkbox" checked={form.visible !== false} onChange={(e) => setForm({ ...form, visible: e.target.checked })} style={{ width: 16, height: 16, accentColor: g.color, cursor: "pointer" }} />
        <span style={{ fontSize: 12, color: BODY, lineHeight: 1.4 }}>Show on the public booking page (uncheck to keep it bookable by direct link only)</span>
      </label>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button onClick={onSave} style={{ ...btnSolid, background: g.color }}><Check size={14} /> Save service</button>
      </div>
    </div>
  );
}

