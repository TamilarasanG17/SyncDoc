import type{ Document } from "../../types";
import DocumentItem from "./DocumentItem";
import NewDocumentButton from "./NewDocumentButton";

interface DocumentListProps {
  documents: Document[];
  selectedDocumentId: string;
  onSelectDocument: (id: string) => void;
  onCreateDocument: () => void;
}

function DocumentList({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onCreateDocument,
}: DocumentListProps) {
  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>Documents</h2>

        <NewDocumentButton
          onClick={onCreateDocument}
        />
      </div>

      <div className="document-items">
        {documents.map((document) => (
          <DocumentItem
            key={document.id}
            document={document}
            selected={document.id === selectedDocumentId}
            onClick={() => onSelectDocument(document.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default DocumentList;