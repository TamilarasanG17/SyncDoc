export type LibrarySection = 'all' | 'recent';

interface Props {
  activeSection: LibrarySection | null;
  onSelectSection: (section: LibrarySection) => void;
  localUser: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
  onLogout: () => void;
}

function IconDocuments() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M7 3.5h7l5 5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
        strokeLinejoin="round"
      />
      <path
        d="M14 3.5V8a1 1 0 0 0 1 1h4.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 13h6M9 16.5h6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="8.25" />
      <path
        d="M12 7.5V12l3 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Persistent left-hand navigation.
 * Stays mounted across the document library and editor.
 */
export function Sidebar({
  activeSection,
  onSelectSection,
  localUser,
  onLogout,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">S</span>
        <span className="brand-name">SyncDoc</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={activeSection === 'all' ? 'active' : ''}
          onClick={() => onSelectSection('all')}
        >
          <IconDocuments />
          All documents
        </button>

        <button
          className={activeSection === 'recent' ? 'active' : ''}
          onClick={() => onSelectSection('recent')}
        >
          <IconClock />
          Recently updated
        </button>
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <span
          className="presence-avatar sidebar-avatar"
          style={{ background: localUser.color }}
        >
          {localUser.name[0]?.toUpperCase()}
        </span>

        <div className="sidebar-footer-text">
          <div className="footer-name">
            {localUser.name}
          </div>

          <div className="footer-sub">
            {localUser.email}
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
          title="Logout"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}