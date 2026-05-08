interface DisplayAnnouncementProps {
  title: string;
  text: string;
}

export function DisplayAnnouncement({ title, text }: DisplayAnnouncementProps) {
  return (
    <div className="tv-legacy tv-panel tv-announcement">
      <div className="tv-announcement-inner">
        <h1 className="tv-announcement-title">{title}</h1>
        <p className="tv-announcement-text">{text}</p>
      </div>
    </div>
  );
}
