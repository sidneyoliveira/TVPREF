export default function Loading() {
  return (
    <div id="tv-root">
      <header className="tv-header">
        <div className="tv-header-left">
          <div className="tv-skeleton tv-logo-skeleton" />
        </div>
        <div className="tv-header-center">
          <div className="tv-skeleton tv-title-skeleton" />
        </div>
        <div className="tv-header-right">
          <div className="tv-skeleton tv-clock-skeleton" />
          <div className="tv-skeleton tv-date-skeleton" />
        </div>
      </header>
      <main className="tv-main">
        <div className="tv-display tv-display-skeleton" />
      </main>
      <footer className="tv-footer">
        <div className="tv-footer-left">
          <div className="tv-skeleton tv-footer-skeleton-message" />
        </div>
        <div className="tv-footer-right">
          <div className="tv-skeleton tv-info-card" />
          <div className="tv-skeleton tv-info-card" />
        </div>
      </footer>
    </div>
  );
}
