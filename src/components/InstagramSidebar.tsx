'use client';

import { useEffect, useState } from 'react';
import { getInstagramEmbedUrl } from '@/lib/embed';
import type { InstagramLink } from '@/lib/types';

interface InstagramSidebarProps {
  instagramLinks: InstagramLink[];
}

export function InstagramSidebar({ instagramLinks }: InstagramSidebarProps) {
  const [currentInstaIndex, setCurrentInstaIndex] = useState(0);
  const safeCurrentIndex = instagramLinks.length > 0 ? currentInstaIndex % instagramLinks.length : 0;

  useEffect(() => {
    if (instagramLinks.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentInstaIndex((prev) => (prev + 1) % instagramLinks.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [instagramLinks.length]);

  const currentInstaPost = instagramLinks[safeCurrentIndex];

  return (
    <div className="tv-instagram-frame">
      {currentInstaPost ? (
        <iframe
          title="Post do Instagram"
          src={getInstagramEmbedUrl(currentInstaPost.url)}
          className="tv-media-iframe"
          scrolling="no"
        ></iframe>
      ) : (
        <p className="tv-instagram-empty">Sem posts no Instagram</p>
      )}
    </div>
  );
}
