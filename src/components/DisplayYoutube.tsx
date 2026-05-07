import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

interface DisplayYoutubeProps {
  youtubeLink: string;
}

export function DisplayYoutube({ youtubeLink }: DisplayYoutubeProps) {
  if (!youtubeLink) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-6xl mb-4">▶️</div>
          <p className="text-3xl text-gray-400 font-semibold">Aguardando transmissão ao vivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <ReactPlayer
        url={youtubeLink}
        playing={true}
        muted={true}
        controls={false}
        width="100%"
        height="100%"
        config={{
          youtube: {
            playerVars: { autoplay: 1, mute: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' }
          }
        }}
        onError={(error: any) => {
          console.error('Erro ao carregar vídeo:', error);
        }}
        onReady={() => {
          console.log('Vídeo carregado com sucesso');
        }}
      />
    </div>
  );
}
