import { useNavigate } from "react-router-dom";

import DocumentCard from "../components/document/DocumentCard";
import { sampleDocuments } from "../data/sampleDocuments";

function Documents() {
  const navigate = useNavigate();

  const handleOpenDocument = (id: string) => {
    navigate(`/editor/${id}`);
  };

  return (
    <div className="documents-page">

      <div className="documents-page-header">
        <div>
          <h1>My Documents</h1>

          <p>
            Browse and open your SyncDoc documents.
          </p>
        </div>

        <button className="new-document-button">
          + New Document
        </button>
      </div>

      <div className="documents-grid">
        {sampleDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onOpen={handleOpenDocument}
          />
        ))}
      </div>

    </div>
  );
}

export default Documents;