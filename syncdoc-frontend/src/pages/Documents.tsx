import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DocumentCard from "../components/document/DocumentCard";
import Loading from "../components/common/Loading";
import { fetchDocuments } from "../services/api";
import type { ASTDocument } from "../data/astDocuments";

function Documents() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<ASTDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchDocuments().then((docs) => {
      if (cancelled) return;
      setDocuments(docs);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenDocument = (id: string) => {
    navigate(`/editor/${id}`);
  };

  const handleCreateDocument = () => {
    console.log("Create new document");
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="documents-page">
      <div className="documents-page-header">
        <div>
          <h1>My Documents</h1>
          <p>Browse and open your SyncDoc documents.</p>
        </div>

        <button className="new-document-button" onClick={handleCreateDocument}>
          + New Document
        </button>
      </div>

      <div className="documents-grid">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} onOpen={handleOpenDocument} />
        ))}
      </div>
    </div>
  );
}

export default Documents;