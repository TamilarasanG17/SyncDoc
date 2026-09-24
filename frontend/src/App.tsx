import { useEffect, useMemo, useState } from 'react';
import { DocumentList } from './components/DocumentList';
import { Sidebar, type LibrarySection } from './components/Sidebar';
import { EditorContainer } from './components/Editor/EditorContainer';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { getDocument } from './api/documentsApi';
import type { DocumentDetail } from './types/document';
import './styles.css';

type LocalUser = {
  id: string;
  name: string;
  email: string;
  color: string;
};

function getLoggedInUser(): LocalUser | null {
  const stored = localStorage.getItem('syncdoc-user');

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('syncdoc-user');
    return null;
  }
}

export default function App() {
  const storedUser = useMemo(getLoggedInUser, []);

  const [localUser, setLocalUser] =
    useState<LocalUser | null>(storedUser);

  const [showRegister, setShowRegister] =
    useState(false);

  const [section, setSection] =
    useState<LibrarySection>('all');

  const [openDocId, setOpenDocId] =
    useState<string | null>(null);

  const [openDocMeta, setOpenDocMeta] =
    useState<DocumentDetail | null>(null);

  useEffect(() => {
    if (!openDocId) {
      setOpenDocMeta(null);
      return;
    }

    getDocument(openDocId).then(setOpenDocMeta);
  }, [openDocId]);

  function handleSelectSection(
    next: LibrarySection
  ) {
    setSection(next);
    setOpenDocId(null);
  }

  function handleLogin(user: LocalUser) {
    setLocalUser(user);
    setShowRegister(false);
  }

  function handleRegister(user: LocalUser) {
    setLocalUser(user);
    setShowRegister(false);
  }

  function handleLogout() {
    localStorage.removeItem('syncdoc-token');
    localStorage.removeItem('syncdoc-user');

    setLocalUser(null);
    setOpenDocId(null);
    setOpenDocMeta(null);
  }

  if (!localUser) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onShowLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={
          openDocId ? null : section
        }
        onSelectSection={handleSelectSection}
        localUser={localUser}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {openDocId && openDocMeta ? (
          <EditorContainer
            documentId={openDocId}
            documentMeta={openDocMeta}
            localUser={localUser}
            onBack={() => setOpenDocId(null)}
          />
        ) : (
          <DocumentList
            section={section}
            onOpen={setOpenDocId}
          />
        )}
      </main>
    </div>
  );
}