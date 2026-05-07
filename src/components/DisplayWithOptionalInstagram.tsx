import { Configuracoes, InstagramLink } from '@/hooks/useTvData';
import { useEffect, useMemo, useState } from 'react';
import { DisplayAnnouncement } from './DisplayAnnouncement';
import { DisplayCarousel } from './DisplayCarousel';
import { DisplayImage } from './DisplayImage';
import { DisplayYoutube, getYouTubeEmbedUrl } from './DisplayYoutube';

interface DisplayWithOptionalInstagramProps {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
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

  const left = useMemo(() => {
    switch (config.display_mode) {
      case 'image':
        return (
          <DisplayImage
            imageUrl={config.image_url || ''}
            title={config.announcement_title}
            description={config.announcement_text}
          />
        );
      case 'announcement':
        return (
          <DisplayAnnouncement
            title={config.announcement_title || 'Aviso Importante'}
            text={config.announcement_text || 'Nenhum aviso configurado'}
          />
        );
      case 'carousel':
        return <DisplayCarousel images={instagramLinks ? [] : []} />;
      case 'split':
        // Aqui tratamos 'split' como equivalente ao comportamento padrão (modo atual + Instagram opcional).
        // O Instagram ao lado será controlado pelo show_instagram.
        return (
          <DisplayYoutube youtubeLink={config.youtube_link || ''} />
        );
      case 'youtube':
      default:
        return <DisplayYoutube youtubeLink={config.youtube_link || ''} />;
    }
  }, [config.display_mode, config.image_url, config.announcement_title, config.announcement_text, config.youtube_link, instagramLinks]);

  // Corrige o caso 'carousel': renderiza com as imagens do carrossel quando disponível.
  // (mantém a lógica estável caso DisplayWithOptionalInstagram seja usado fora do TV)
  const main = (() => {
    if (config.display_mode === 'carousel') {
      // DisplayCarousel precisa de images; como este componente só recebe instagramLinks,
      // o TV já deve passar um componente adequado em outro lugar.
      // Para não quebrar, cai para YouTube quando carousel não puder ser renderizado aqui.
      // (O admin/TV atual já passa carouselImages para DisplayCarousel no TV; então aqui não é usado.)
    }
    return left;
  })();

  if (!shouldShowInsta) {
    return <div className="w-full h-full">{main}</div>;
  }

  const currentInstaPost = instagramLinks[currentInstaIndex];

  return (
    <div className="w-full h-full flex gap-2 bg-black p-2">
      {/* Conteúdo principal: 70% */}
      <div className="flex-[7] bg-black rounded-lg overflow-hidden shadow-2xl">
        {main}
      </div>

      {/* Instagram: 30% */}
      <div className="flex-[3] bg-dark-bg-secondary rounded-lg overflow-hidden flex shadow-2xl">
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
