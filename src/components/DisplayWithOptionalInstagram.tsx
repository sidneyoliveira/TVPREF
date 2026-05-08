import { Configuracoes, InstagramLink } from '@/hooks/useTvData';
import { useEffect, useState } from 'react';

interface DisplayWithOptionalInstagramProps {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
  children: React.ReactNode;
}

function getInstaEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const cleanPath = parsedUrl.pathname.replace(/\/$/, '');
    return `https://www.instagram.com${cleanPath}/embed`;
  } catch {
    return '';
  }
}

export function DisplayWithOptionalInstagram({
  config,
  instagramLinks,
  children,
}: DisplayWithOptionalInstagramProps) {
  const [currentInstaIndex, setCurrentInstaIndex] = useState(0);

  const shouldShowInsta = Boolean(config.show_instagram);

  useEffect(() => {
    if (!shouldShowInsta) return;
    if (instagramLinks.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentInstaIndex((prev) => (prev + 1) % instagramLinks.length);
    }, 15000);

    return () => clearInterval(timer);
  }, [instagramLinks.length, shouldShowInsta]);

  useEffect(() => {
    setCurrentInstaIndex(0);
  }, [instagramLinks.length]);

  if (!shouldShowInsta) {
    return <div className="tv-legacy" style={{ width: '100%', height: '100%' }}>{children}</div>;
  }

  const currentInstaPost = instagramLinks[currentInstaIndex];

  return (
    <div className="tv-legacy tv-panel tv-split">
      <div className="tv-split-main" style={{ background: 'transparent' }}>{children}</div>

      <div className="tv-split-side">
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          {currentInstaPost ? (
            <iframe
              src={getInstaEmbedUrl(currentInstaPost.url)}
              className="tv-media-iframe"
              scrolling="no"
              style={{ minHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <p style={{ color: 'rgba(148,163,184,0.95)', textAlign: 'center', fontSize: '0.9rem' }}>Sem posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
