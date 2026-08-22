import type{ Document } from "../../types";

interface DocumentCardProps {
  document: Document;
  onOpen: (id: string) => void;
}

function DocumentCard({
  document,
  onOpen,
}: DocumentCardProps) {
  return (
    <div
      className="document-card"
      onClick={() => onOpen(document.id)}
    >
      <h3>{document.title}</h3>

      <p>
        Last updated: {document.updatedAt}
      </p>

      <button
        onClick={(event) => {
          event.stopPropagation();
          onOpen(document.id);
        }}
      >
        Open
      </button>
    </div>
  );
}

export default DocumentCard;