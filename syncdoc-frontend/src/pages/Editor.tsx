import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DocumentList from "../components/document/DocumentList";
import EditorComponent from "../components/editor/Editor";
import Loading from "../components/common/Loading";

import { fetchDocuments } from "../services/api";
import type { ASTDocument } from "../data/astDocuments";

function EditorPage() {
  const { id } = useParams();
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

  const selectedDocument = useMemo(() => {
    if (documents.length === 0) return null;
    return documents.find((doc) => doc.id === id) ?? documents[0];
  }, [documents, id]);

  const handleSelectDocument = (documentId: string) => {
    navigate(`/editor/${documentId}`);
  };

  const handleCreateDocument = () => {
    console.log("Create new document");
  };

  if (loading || !selectedDocument) {
    return <Loading />;
  }

  return (
    <div className="syncdoc-editor">
      <DocumentList
        documents={documents}
        selectedDocumentId={selectedDocument.id}
        onSelectDocument={handleSelectDocument}
        onCreateDocument={handleCreateDocument}
      />

      <EditorComponent
        title={selectedDocument.title}
        blocks={selectedDocument.blocks}
      />
    </div>
  );
}

export default EditorPage;