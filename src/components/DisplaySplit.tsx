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
    <div className="tv-legacy tv-panel tv-split">
      {/* YouTube - 70% */}
      <div className="tv-split-main tv-pointer-none">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            className="tv-media-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="tv-center" style={{ height: '100%' }}>
            <p style={{ color: 'rgba(148,163,184,0.95)', fontSize: '2rem' }}>Aguardando transmissão...</p>
          </div>
        )}
      </div>

      {/* Instagram - 30% */}
      <div className="tv-split-side">
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          {currentInstaPost ? (
            <iframe
              src={getInstaEmbedUrl(currentInstaPost.url)}
              className="tv-media-iframe"
              scrolling="no"
              style={{ minHeight: '100%', objectFit: 'contain' }}
            ></iframe>
          ) : (
            <p style={{ color: 'rgba(148,163,184,0.95)', textAlign: 'center', fontSize: '0.9rem' }}>Sem posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
