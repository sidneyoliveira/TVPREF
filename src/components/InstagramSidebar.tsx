import { useState, useEffect } from 'react';
import { InstagramLink } from '@/hooks/useTvData';

interface InstagramSidebarProps {
  instagramLinks: InstagramLink[];
}

export function InstagramSidebar({ instagramLinks }: InstagramSidebarProps) {
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

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      {currentInstaPost ? (
        <iframe
          src={getInstaEmbedUrl(currentInstaPost.url)}
          className="tv-media-iframe"
          scrolling="no"
          style={{ minHeight: '100%', objectFit: 'contain' }}
        ></iframe>
      ) : (
        <p style={{ color: 'rgba(148,163,184,0.95)', textAlign: 'center', fontSize: '0.9rem' }}>Sem posts no Instagram</p>
      )}
    </div>
  );
}
