"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface InstagramCardProps {
  url: string;
}

export function InstagramCard({ url }: InstagramCardProps) {
  const [meta, setMeta] = useState<{ title: string; thumbnail_url: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/instagram/meta?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => setMeta(data))
      .catch(() => setMeta({ title: "Post do Instagram", thumbnail_url: "" }));
  }, [url]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {meta?.thumbnail_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={meta.thumbnail_url} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImageIcon size={20} color="#718096" />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#2d3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meta?.title || 'Carregando...'}
        </span>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3182ce', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {url}
        </a>
      </div>
    </div>
  );
}
