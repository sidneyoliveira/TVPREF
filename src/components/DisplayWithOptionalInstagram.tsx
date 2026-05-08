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
    return <div className="tv-legacy w-full h-full">{children}</div>;
  }

  const currentInstaPost = instagramLinks[currentInstaIndex];

  return (
    <div className="tv-legacy tv-panel w-full h-full flex gap-2 bg-black p-2">
      {/* Conteúdo principal: 70% */}
      <div className="flex-[7] bg-black rounded-lg overflow-hidden shadow-2xl relative z-0">
        {children}
      </div>

      {/* Instagram: 30% */}
      <div className="flex-[3] bg-dark-bg-secondary rounded-lg overflow-hidden flex shadow-2xl relative z-0">
        <div className="w-full h-full flex items-center justify-center bg-white">
          {currentInstaPost ? (
            <iframe
              src={getInstaEmbedUrl(currentInstaPost.url)}
              className="w-full h-full border-none"
              scrolling="no"
              style={{ minHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <p className="text-gray-500 text-center text-sm">Sem posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
