export default function Loading() {
  return (
    <main className="admin-shell">
      <div className="admin-loading-shell">
        <div className="admin-skeleton admin-loading-header" />
        <div className="admin-loading-grid">
          <div className="admin-skeleton admin-loading-panel" />
          <div className="admin-skeleton admin-loading-panel" />
          <div className="admin-skeleton admin-loading-panel" />
        </div>
      </div>
    </main>
  );
}
