const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_API = "https://www.googleapis.com/youtube/v3";

async function resolveChannelId(input) {
  // Direct channel ID
  let match = input.match(/channel\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // Handle /@username or /c/name or /user/name
  match = input.match(/youtube\.com\/(@[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+)/);
  if (match) {
    const handle = match[1].startsWith("@") ? match[1] : match[1].split("/")[1];
    const searchParam = match[1].startsWith("@") ? `&forHandle=${handle}` : `&forUsername=${handle}`;
    const res = await fetch(`${YT_API}/channels?part=id${searchParam}&key=${API_KEY}`);
    const data = await res.json();
    if (data.items?.[0]) return data.items[0].id;

    // Fallback: search
    const searchRes = await fetch(`${YT_API}/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1&key=${API_KEY}`);
    const searchData = await searchRes.json();
    if (searchData.items?.[0]) return searchData.items[0].snippet.channelId;
  }

  // Maybe it's just a channel ID string
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(input)) return input;

  return null;
}

async function getUploadsPlaylistId(channelId) {
  const res = await fetch(`${YT_API}/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`);
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
}

async function getAllVideos(playlistId) {
  const videos = [];
  let pageToken = "";

  while (true) {
    const url = `${YT_API}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    for (const item of data.items || []) {
      videos.push({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      });
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
    } else {
      break;
    }
  }

  return videos;
}

export async function POST(request) {
  try {
    if (!API_KEY || API_KEY === "your-youtube-api-key-here") {
      return Response.json({ error: "YouTube API key not configured. Add YOUTUBE_API_KEY to .env.local" }, { status: 500 });
    }

    const { channelUrl } = await request.json();
    if (!channelUrl) {
      return Response.json({ error: "Channel URL is required" }, { status: 400 });
    }

    const channelId = await resolveChannelId(channelUrl);
    if (!channelId) {
      return Response.json({ error: "Could not find channel. Try pasting the full channel URL." }, { status: 400 });
    }

    const playlistId = await getUploadsPlaylistId(channelId);
    if (!playlistId) {
      return Response.json({ error: "Could not find uploads for this channel" }, { status: 400 });
    }

    const videos = await getAllVideos(playlistId);
    return Response.json({ channelId, totalVideos: videos.length, videos });
  } catch (err) {
    console.error("Channel API error:", err);
    return Response.json({ error: err.message || "Failed to fetch channel videos" }, { status: 500 });
  }
}
