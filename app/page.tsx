import pkg from "@/package.json";
import Uploader from "./uploader";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 460,
        margin: "80px auto",
        padding: "0 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>Profile photo test</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
        Uploads to Vercel Blob and saves the URL to the user&apos;s row in Neon.
      </p>
      <Uploader />
      <footer style={{ marginTop: 48, fontSize: 12, color: "#999" }}>
        Dot One Portal &middot; v{pkg.version}
      </footer>
    </main>
  );
}
