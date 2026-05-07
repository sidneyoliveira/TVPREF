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
    <div className="w-full h-full flex items-center justify-center bg-white">
      {currentInstaPost ? (
        <iframe
          src={getInstaEmbedUrl(currentInstaPost.url)}
          className="w-full h-full border-none"
          scrolling="no"
          style={{ minHeight: '100%', objectFit: 'contain' }}
        ></iframe>
      ) : (
        <p className="text-gray-500 text-center text-sm">Sem posts no Instagram</p>
      )}
    </div>
  );
}
