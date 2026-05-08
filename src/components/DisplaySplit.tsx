import { Configuracoes, InstagramLink } from '@/hooks/useTvData';
import { useState, useEffect } from 'react';
import { getYouTubeEmbedUrl } from './DisplayYoutube';

interface DisplaySplitProps {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
}

export function DisplaySplit({ config, instagramLinks }: DisplaySplitProps) {
  const [currentInstaIndex, setCurrentInstaIndex] = useState(0);

  useEffect(() => {
    if (instagramLinks.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentInstaIndex((prev) => (prev + 1) % instagramLinks.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [instagramLinks.length]);

  const getInstaEmbedUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const cleanPath = parsedUrl.pathname.replace(/\/$/, '');
      return `https://www.instagram.com${cleanPath}/embed`;
    } catch {
      return '';
    }
  };

  const currentInstaPost = instagramLinks[currentInstaIndex];
  const youtubeEmbedUrl = config.youtube_link ? getYouTubeEmbedUrl(config.youtube_link) : null;

  return (
    <div className="tv-legacy tv-panel w-full h-full flex gap-2 bg-black p-2">
      {/* YouTube - 70% */}
      <div className="flex-[7] bg-black rounded-lg overflow-hidden shadow-2xl relative pointer-events-none">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 text-2xl">Aguardando transmissão...</p>
          </div>
        )}
      </div>

      {/* Instagram - 30% */}
      <div className="flex-[3] bg-dark-bg-secondary rounded-lg overflow-hidden flex shadow-2xl">
        <div className="w-full h-full flex items-center justify-center bg-white">
          {currentInstaPost ? (
            <iframe
              src={getInstaEmbedUrl(currentInstaPost.url)}
              className="w-full h-full border-none"
              scrolling="no"
              style={{ minHeight: '100%', objectFit: 'contain' }}
            ></iframe>
          ) : (
            <p className="text-gray-500 text-center text-sm">Sem posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
