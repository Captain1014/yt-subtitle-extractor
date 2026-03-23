"use client";

import { useState, useRef } from "react";

export default function Channel() {
  const [channelUrl, setChannelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState(null);
  const [subtitles, setSubtitles] = useState({});
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef(false);

  const fetchChannel = async () => {
    if (!channelUrl.trim()) return;
    setLoading(true);
    setVideos(null);
    setError(null);
    setSubtitles({});

    try {
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideos(data.videos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractAll = async () => {
    if (!videos) return;
    abortRef.current = false;
    setExtracting(true);
    setProgress({ current: 0, total: videos.length });

    const results = { ...subtitles };

    for (let i = 0; i < videos.length; i++) {
      if (abortRef.current) break;

      const video = videos[i];
      if (results[video.videoId]) {
        setProgress({ current: i + 1, total: videos.length });
        continue;
      }

      try {
        const res = await fetch("/api/subtitles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${video.videoId}` }),
        });
        const data = await res.json();
        if (res.ok) {
          results[video.videoId] = { status: "ok", text: data.fullText, withTimestamps: data.withTimestamps };
        } else {
          results[video.videoId] = { status: "error", text: data.error };
        }
      } catch {
        results[video.videoId] = { status: "error", text: "Network error" };
      }

      setSubtitles({ ...results });
      setProgress({ current: i + 1, total: videos.length });
    }

    setExtracting(false);
  };

  const stopExtracting = () => {
    abortRef.current = true;
  };

  const downloadAll = () => {
    const lines = [];
    for (const video of videos) {
      const sub = subtitles[video.videoId];
      if (sub?.status === "ok") {
        lines.push(`${"=".repeat(60)}`);
        lines.push(`Title: ${video.title}`);
        lines.push(`URL: https://www.youtube.com/watch?v=${video.videoId}`);
        lines.push(`Date: ${video.publishedAt?.slice(0, 10)}`);
        lines.push(`${"=".repeat(60)}`);
        lines.push(sub.text);
        lines.push("\n");
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "channel-subtitles.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = Object.values(subtitles).filter((s) => s.status === "ok").length;
  const errorCount = Object.values(subtitles).filter((s) => s.status === "error").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Mono', 'Courier New', monospace", color: "#e8e8f0" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a2e", padding: "32px 48px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#ff4d6d", marginBottom: "8px" }}>YOUTUBE TOOL</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", textShadow: "0 0 60px #ff4d6d66" }}>
              Channel Subtitles
            </h1>
          </div>
          <a href="/" style={{ color: "#555570", fontSize: "12px", textDecoration: "none", border: "1px solid #2a2a3e", padding: "8px 16px", borderRadius: "4px" }}>
            ← Single Video
          </a>
        </div>
      </div>

      <div style={{ padding: "40px 48px", maxWidth: "960px" }}>
        {/* Channel URL Input */}
        <div style={{ marginBottom: "28px" }}>
          <label className="label">Channel URL</label>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              className="input-field"
              placeholder="https://www.youtube.com/@channelname"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchChannel()}
            />
            <button className="btn" onClick={fetchChannel} disabled={!channelUrl.trim() || loading}>
              {loading ? "..." : "Fetch"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            {[0, 0.2, 0.4].map((d, i) => (
              <div key={i} className="pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff4d6d", animationDelay: `${d}s` }} />
            ))}
            <span style={{ fontSize: "11px", color: "#444460", letterSpacing: "2px" }}>FETCHING CHANNEL VIDEOS</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: "16px", background: "#1a0a0e", border: "1px solid #ff4d6d33", borderRadius: "4px", color: "#ff4d6d", fontSize: "13px", marginBottom: "20px" }}>
            ⚠ {error}
          </div>
        )}

        {/* Video List */}
        {videos && (
          <div className="fade-in">
            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#888899" }}>
                {videos.length} videos found
                {successCount > 0 && <span style={{ color: "#4ade80" }}> · {successCount} extracted</span>}
                {errorCount > 0 && <span style={{ color: "#ff4d6d" }}> · {errorCount} failed</span>}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                {extracting ? (
                  <button className="btn" onClick={stopExtracting} style={{ background: "#333", padding: "10px 20px" }}>
                    Stop ({progress.current}/{progress.total})
                  </button>
                ) : (
                  <button className="btn" onClick={extractAll} style={{ padding: "10px 20px" }}>
                    {successCount > 0 ? "Resume" : "Extract All"}
                  </button>
                )}
                {successCount > 0 && (
                  <button className="copy-btn" onClick={downloadAll} style={{ padding: "10px 16px" }}>
                    Download .txt
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {(extracting || progress.current > 0) && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ background: "#14141e", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                  <div style={{
                    background: extracting ? "#ff4d6d" : "#4ade80",
                    height: "100%",
                    width: `${(progress.current / progress.total) * 100}%`,
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>
            )}

            {/* Video Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "600px", overflowY: "auto" }}>
              {videos.map((video) => {
                const sub = subtitles[video.videoId];
                return (
                  <div key={video.videoId} style={{
                    display: "flex", alignItems: "center", gap: "16px",
                    padding: "12px 16px", background: "#0e0e18", border: "1px solid #1e1e2e",
                    borderRadius: "6px",
                  }}>
                    {/* Status */}
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, background: !sub ? "#2a2a3e" : sub.status === "ok" ? "#4ade80" : "#ff4d6d" }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", color: "#c8c8e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {video.title}
                      </div>
                      <div style={{ fontSize: "11px", color: "#333350", marginTop: "2px" }}>
                        {video.publishedAt?.slice(0, 10)}
                      </div>
                    </div>

                    {/* Actions */}
                    {sub?.status === "ok" && (
                      <button
                        className="copy-btn"
                        style={{ flexShrink: 0, fontSize: "10px", padding: "4px 10px" }}
                        onClick={() => { navigator.clipboard.writeText(sub.text); }}
                      >
                        Copy
                      </button>
                    )}
                    {sub?.status === "error" && (
                      <span style={{ fontSize: "10px", color: "#ff4d6d44", flexShrink: 0 }}>no subs</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
