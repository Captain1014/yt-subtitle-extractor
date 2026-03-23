import { YoutubeTranscript } from "youtube-transcript";

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const segments = transcript.map((seg) => ({
      text: seg.text,
      start: seg.offset / 1000,
      duration: seg.duration / 1000,
    }));

    const fullText = segments.map((s) => s.text).join(" ");

    const withTimestamps = segments.map((s) => {
      const min = Math.floor(s.start / 60);
      const sec = Math.floor(s.start % 60).toString().padStart(2, "0");
      return `[${min}:${sec}] ${s.text}`;
    }).join("\n");

    return Response.json({ fullText, withTimestamps, videoId });
  } catch (err) {
    console.error("Subtitle error:", err);
    const msg = err.message?.includes("Transcript is disabled")
      ? "This video has subtitles disabled"
      : err.message?.includes("No transcripts")
      ? "No subtitles available for this video"
      : "Failed to fetch subtitles";
    return Response.json({ error: msg }, { status: 500 });
  }
}
