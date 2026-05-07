import dynamic from 'next/dynamic';
import { Configuracoes, InstagramLink } from '@/hooks/useTvData';
import { useState, useEffect } from 'react';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

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

  return (
    <div className="w-full h-full flex gap-2 bg-black p-2">
      {/* YouTube - 70% */}
      <div className="flex-[7] bg-black rounded-lg overflow-hidden shadow-2xl">
        {config.youtube_link ? (
          <ReactPlayer
            url={config.youtube_link}
            playing
            muted
            controls={false}
            width="100%"
            height="100%"
            config={{
              youtube: {
                playerVars: { autoplay: 1, mute: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' }
              }
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 text-2xl">Aguardando transmissão...</p>
          </div>
        )}
      </div>

      {/* Instagram - 30% */}
      <div className="flex-[3] bg-gray-900 rounded-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-center">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Social Media</h3>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-2">
          {currentInstaPost ? (
            <iframe
              src={getInstaEmbedUrl(currentInstaPost.url)}
              className="w-full h-full border-none rounded"
              scrolling="no"
            ></iframe>
          ) : (
            <p className="text-gray-500 text-center text-sm">Sem posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
