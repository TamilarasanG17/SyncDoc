import type{ Document } from "../../types";

interface DocumentItemProps {
  document: Document;
  selected: boolean;
  onClick: () => void;
}

function DocumentItem({
  document,
  selected,
  onClick,
}: DocumentItemProps) {
  return (
    <button
      className={`document-item ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="document-title">
        {document.title}
      </div>

      <div className="document-date">
        {document.updatedAt}
      </div>
    </button>
  );
}

export default DocumentItem;