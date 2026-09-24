import { useEffect, useMemo, useState } from 'react';
import type { DocumentSummary } from '../types/document';
import { createDocument, deleteDocument, listDocuments } from '../api/documentsApi';
import type { LibrarySection } from './Sidebar';
import { colorForString, formatRelativeTime, initialsForTitle, RECENT_WINDOW_MS } from '../utils/format';

interface Props {
  section: LibrarySection;
  onOpen: (docId: string) => void;
}

/**
 * The document library: search + section filter ("All" / "Recently
 * updated") over a grid of document cards, plus the compose bar for
 * starting a new one.
 */
export function DocumentList({ section, onOpen }: Props) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [query, setQuery] = useState('');

  async function refresh() {
    setLoading(true);
    const docs = await listDocuments();
    setDocuments(docs);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    const title = newTitle.trim() || 'Untitled document';
    const doc = await createDocument(title);
    setNewTitle('');
    await refresh();
    onOpen(doc._id);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteDocument(id);
    await refresh();
  }

  const visibleDocuments = useMemo(() => {
    const now = Date.now();
    return documents
      .filter((doc) => (section === 'recent' ? now - new Date(doc.updatedAt).getTime() <= RECENT_WINDOW_MS : true))
      .filter((doc) => doc.title.toLowerCase().includes(query.trim().toLowerCase()));
  }, [documents, section, query]);

  return (
    <div className="document-list">
      <div className="library-header">
        <span className="eyebrow">{section === 'recent' ? 'Recently updated' : 'Library'}</span>
        <h1>Your documents</h1>
        <p className="subtitle">Open a spec to co-edit it live, or start a new one below.</p>
      </div>

      <div className="compose-bar">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Name your new document…"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button onClick={handleCreate}>＋ New document</button>
      </div>

      <div className="library-toolbar">
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
        />
        <span className="library-count">
          {visibleDocuments.length} document{visibleDocuments.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <p className="empty-state">Loading your documents…</p>
      ) : visibleDocuments.length === 0 ? (
        <div className="empty-panel">
          <p className="empty-panel-title">
            {query ? 'No documents match your search.' : section === 'recent' ? 'Nothing updated recently.' : 'Nothing here yet.'}
          </p>
          <p className="empty-panel-sub">
            {query ? 'Try a different title.' : 'Create your first document using the box above.'}
          </p>
        </div>
      ) : (
        <ul className="doc-grid">
          {visibleDocuments.map((doc) => {
  const iconColor = colorForString(doc.title || doc._id);
  const collaborators = doc.collaborators ?? [];

  return (
    <li
      key={doc._id}
      className="doc-card"
      onClick={() => onOpen(doc._id)}
    >
      <div className="doc-card-top">
        <span
          className="doc-icon"
          style={{ background: iconColor }}
        >
          {initialsForTitle(doc.title)}
        </span>

        <button
          className="doc-card-delete"
          aria-label={`Delete ${doc.title}`}
          onClick={(e) => handleDelete(doc._id, e)}
        >
          ✕
        </button>
      </div>

      <div className="doc-card-title">{doc.title}</div>

      <div className="doc-card-meta">
        <span>{formatRelativeTime(doc.updatedAt)}</span>
        <span className="meta-dot">·</span>

        <span className="collab-pill">
          {collaborators.length} collaborator
          {collaborators.length === 1 ? '' : 's'}
        </span>
      </div>
    </li>
  );
})}
        </ul>
      )}
    </div>
  );
}
