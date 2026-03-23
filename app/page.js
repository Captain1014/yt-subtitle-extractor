"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("full");
  const [copied, setCopied] = useState(false);

  const fetchSubtitles = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    const text = mode === "full" ? result.fullText : result.withTimestamps;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchSubtitles();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Mono', 'Courier New', monospace", color: "#e8e8f0" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a2e", padding: "32px 48px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#ff4d6d", marginBottom: "8px" }}>YOUTUBE TOOL</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", textShadow: "0 0 60px #ff4d6d66" }}>
              Subtitle Extractor
            </h1>
          </div>
          <a href="/channel" style={{ color: "#555570", fontSize: "12px", textDecoration: "none", border: "1px solid #2a2a3e", padding: "8px 16px", borderRadius: "4px" }}>
            Channel Mode →
          </a>
        </div>
      </div>

      <div style={{ padding: "40px 48px", maxWidth: "860px" }}>
        {/* URL Input */}
        <div style={{ marginBottom: "28px" }}>
          <label className="label">YouTube URL</label>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              className="input-field"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn" onClick={fetchSubtitles} disabled={!url.trim() || loading}>
              {loading ? "..." : "Extract"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            {[0, 0.2, 0.4].map((d, i) => (
              <div key={i} className="pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff4d6d", animationDelay: `${d}s` }} />
            ))}
            <span style={{ fontSize: "11px", color: "#444460", letterSpacing: "2px" }}>FETCHING SUBTITLES</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: "16px", background: "#1a0a0e", border: "1px solid #ff4d6d33", borderRadius: "4px", color: "#ff4d6d", fontSize: "13px" }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className={`mode-btn ${mode === "full" ? "active" : ""}`} onClick={() => setMode("full")}>
                  Plain Text
                </button>
                <button className={`mode-btn ${mode === "timestamps" ? "active" : ""}`} onClick={() => setMode("timestamps")}>
                  With Timestamps
                </button>
              </div>
              <button className="copy-btn" onClick={copyText}>
                {copied ? "✓ COPIED" : "COPY ALL"}
              </button>
            </div>

            <div className="text-box">
              {mode === "full" ? result.fullText : result.withTimestamps}
            </div>

            <div style={{ marginTop: "12px", fontSize: "11px", color: "#2a2a3e", letterSpacing: "1px" }}>
              {result.fullText.length.toLocaleString()} chars · video: {result.videoId}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
