function Header() {
  return (
    <header className="header">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="7" r="3.4" fill="currentColor" />
          <circle cx="7" cy="25" r="3.4" fill="currentColor" opacity="0.55" />
          <circle cx="25" cy="25" r="3.4" fill="currentColor" opacity="0.55" />
          <path d="M16 10.4 L8.2 21.8 M16 10.4 L23.8 21.8" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
        <span className="brand-name">SyncDoc</span>
      </div>

      <div className="header-actions">
        <button className="workspace-pill" type="button">
          My Workspace
          <span className="workspace-chevron" aria-hidden="true">⌄</span>
        </button>
      </div>
    </header>
  );
}

export default Header;