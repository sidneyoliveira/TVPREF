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
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-6xl mb-4">▶️</div>
          <p className="text-3xl text-gray-400 font-semibold">Aguardando transmissão ao vivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative overflow-hidden pointer-events-none">
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
