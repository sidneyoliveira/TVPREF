const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function findYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (host === "youtu.be" && YOUTUBE_ID_PATTERN.test(pathParts[0] ?? "")) {
      return pathParts[0];
    }

    const queryId = parsedUrl.searchParams.get("v");
    if (queryId && YOUTUBE_ID_PATTERN.test(queryId)) {
      return queryId;
    }

    const routeId = pathParts.find((part, index) => {
      const previous = pathParts[index - 1];
      return ["embed", "live", "shorts", "v"].includes(previous ?? "") && YOUTUBE_ID_PATTERN.test(part);
    });

    return routeId ?? null;
  } catch {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([^"&?/\s]{11})/);
    return match?.[1] ?? null;
  }
}

export function getYouTubeEmbedUrl(url: string) {
  const videoId = findYouTubeVideoId(url);

  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: "1",
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    loop: "1",
    playlist: videoId,
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function getInstagramEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const cleanPath = parsedUrl.pathname.replace(/\/$/, "");
    return `https://www.instagram.com${cleanPath}/embed`;
  } catch {
    return "";
  }
}

export function isVideoAsset(url: string) {
  try {
    return /\.(mp4|webm|ogg)$/i.test(new URL(url).pathname);
  } catch {
    return /\.(mp4|webm|ogg)$/i.test(url.split("?")[0] ?? url);
  }
}
