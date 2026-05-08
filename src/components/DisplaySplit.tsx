import { getYouTubeEmbedUrl } from '@/lib/embed';
import type { Configuracoes, InstagramLink } from '@/lib/types';
import { InstagramSidebar } from './InstagramSidebar';

interface DisplaySplitProps {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
}

export function DisplaySplit({ config, instagramLinks }: DisplaySplitProps) {
  const youtubeEmbedUrl = config.youtube_link ? getYouTubeEmbedUrl(config.youtube_link) : null;

  return (
    <div className="tv-legacy tv-panel tv-split">
      {/* YouTube - 70% */}
      <div className="tv-split-main tv-pointer-none">
        {youtubeEmbedUrl ? (
          <iframe
            title="Transmissão ao vivo"
            src={youtubeEmbedUrl}
            className="tv-media-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="tv-center tv-fill">
            <p className="tv-muted-large">Aguardando transmissão...</p>
          </div>
        )}
      </div>

      {/* Instagram - 30% */}
      <div className="tv-split-side">
        <InstagramSidebar instagramLinks={instagramLinks} />
      </div>
    </div>
  );
}
