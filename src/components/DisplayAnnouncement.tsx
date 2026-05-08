interface DisplayAnnouncementProps {
  title: string;
  text: string;
}

export function DisplayAnnouncement({ title, text }: DisplayAnnouncementProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-16 overflow-hidden">
      <div className="text-center max-w-4xl">
        <h1 className="text-8xl font-black text-white mb-8 drop-shadow-2xl animate-pulse">
          {title}
        </h1>
        <p className="text-5xl text-white leading-relaxed drop-shadow-lg font-bold">
          {text}
        </p>

      </div>
    </div>
  );
}
