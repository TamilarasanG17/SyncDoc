import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">
      <div className="home-copy">
        <p className="home-eyebrow">Structured. Synced. Simultaneous.</p>
        <h2 className="home-title">Welcome to SyncDoc</h2>
        <p className="home-subtitle">
          Every document is a living tree of blocks, kept in sync across everyone
          editing it — no refresh, no overwritten work, no merge conflicts.
        </p>

        <div className="home-actions">
          <Link to="/documents" className="btn btn-primary">Browse documents</Link>
          <Link to="/documents" className="btn btn-ghost">New document</Link>
        </div>
      </div>

      <div className="home-diagram" aria-hidden="true">
        <svg viewBox="0 0 220 180" className="ast-diagram">
          <line x1="110" y1="34" x2="50" y2="90" className="ast-edge" />
          <line x1="110" y1="34" x2="170" y2="90" className="ast-edge" />
          <line x1="50" y1="90" x2="30" y2="146" className="ast-edge" />
          <line x1="50" y1="90" x2="80" y2="146" className="ast-edge" />
          <line x1="170" y1="90" x2="170" y2="146" className="ast-edge" />

          <circle cx="110" cy="34" r="9" className="ast-node ast-node-root" />
          <circle cx="50" cy="90" r="7" className="ast-node" />
          <circle cx="170" cy="90" r="7" className="ast-node" />
          <circle cx="30" cy="146" r="5" className="ast-node" />
          <circle cx="80" cy="146" r="5" className="ast-node" />
          <circle cx="170" cy="146" r="5" className="ast-node ast-node-live" />
        </svg>
      </div>
    </div>
  );
}

export default Home;