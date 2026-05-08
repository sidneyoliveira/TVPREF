import type { Configuracoes, InstagramLink } from '@/lib/types';
import { InstagramSidebar } from './InstagramSidebar';

interface DisplayWithOptionalInstagramProps {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
  children: React.ReactNode;
}

export function DisplayWithOptionalInstagram({
  config,
  instagramLinks,
  children,
}: DisplayWithOptionalInstagramProps) {
  const shouldShowInsta = Boolean(config.show_instagram);

  if (!shouldShowInsta) {
    return <div className="tv-legacy">{children}</div>;
  }

  return (
    <div className="tv-legacy tv-panel tv-split">
      <div className="tv-split-main tv-split-main-transparent">{children}</div>

      <div className="tv-split-side">
        <InstagramSidebar instagramLinks={instagramLinks} />
      </div>
    </div>
  );
}
