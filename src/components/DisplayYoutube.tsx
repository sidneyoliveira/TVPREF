import { getYouTubeEmbedUrl } from "@/lib/embed";

export { getYouTubeEmbedUrl };

interface DisplayYoutubeProps {
  youtubeLink: string;
}

export function DisplayYoutube({ youtubeLink }: DisplayYoutubeProps) {
  const embedUrl = getYouTubeEmbedUrl(youtubeLink);

  if (!embedUrl) {
    return (
      <div className="tv-legacy tv-panel tv-youtube-panel tv-center">
        <div className="tv-empty-state">
          <p className="tv-muted-large">Aguardando transmissão ao vivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-legacy tv-panel tv-youtube-panel">
      <iframe
        title="Transmissão ao vivo"
        src={embedUrl}
        className="tv-media-iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
