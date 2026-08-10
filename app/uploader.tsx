"use client";

import { useRef, useState } from "react";

// Shrink the chosen image to a small avatar (max 320px) and return a JPEG Blob.
// Doing this in the browser keeps uploads tiny and well under the server limit.
function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 320;
        let w = img.width;
        let h = img.height;
        if (w > h && w > max) {
          h = Math.round((h * max) / w);
          w = max;
        } else if (h > max) {
          w = Math.round((w * max) / h);
          h = max;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function Uploader() {
  // Defaults to a user that already exists in your Neon DB (the video admin
  // seed row). Change it to any real user's email to set their avatar.
  const [email, setEmail] = useState("video@dot1.media");
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await resizeImage(file);
      const res = await fetch(`/api/avatar?email=${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "content-type": "image/jpeg" },
        body: blob,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label style={{ fontSize: 12, color: "#444" }}>User email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          padding: "10px 12px",
          margin: "6px 0 20px",
          border: "1px solid #ccc",
          borderRadius: 8,
          fontSize: 14,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#f0f0f0",
            border: "1px solid #ddd",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#aaa",
            fontSize: 12,
          }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            "No photo"
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: busy ? "#999" : "#e23b2e",
            color: "#fff",
            cursor: busy ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          {busy ? "Uploading..." : "Upload photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          style={{ display: "none" }}
        />
      </div>

      {error && <p style={{ color: "#c00", fontSize: 13, marginTop: 16 }}>{error}</p>}
      {url && (
        <p style={{ fontSize: 12, color: "#666", marginTop: 16, wordBreak: "break-all" }}>
          Saved URL: {url}
        </p>
      )}
    </div>
  );
}
