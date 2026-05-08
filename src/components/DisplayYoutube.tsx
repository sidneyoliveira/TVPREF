export function getYouTubeEmbedUrl(url: string) {
  if (!url) return null;
  // Regex para capturar o ID do vídeo em links curtos, longos ou de live
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([^"&?\/\s]{11})/);
  const videoId = match ? match[1] : null;
  
  if (!videoId) return null;
  
  // Parâmetros: autoplay, mudo (obrigatório para autoplay), sem controles, sem logo, loop e playsinline
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${videoId}`;
}

interface DisplayYoutubeProps {
  youtubeLink: string;
}

export function DisplayYoutube({ youtubeLink }: DisplayYoutubeProps) {
  const embedUrl = getYouTubeEmbedUrl(youtubeLink);

  if (!embedUrl) {
    return (
      <div className="tv-legacy tv-panel tv-youtube-panel tv-center">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>▶️</div>
          <p style={{ fontSize: '2rem', color: 'rgba(148,163,184,0.95)', fontWeight: 600 }}>Aguardando transmissão ao vivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-legacy tv-panel tv-youtube-panel" style={{ background: '#000', position: 'relative', overflow: 'hidden' }}>
      <iframe
        src={embedUrl}
        className="tv-media-iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
