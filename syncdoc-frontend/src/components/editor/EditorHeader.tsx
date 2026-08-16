import { useDocumentSync } from "../../hooks/useDocumentSync";
import SyncStatusBadge from "./SyncStatusBadge";

interface EditorHeaderProps {
  title: string;
  documentId: string;
}

function EditorHeader({ title, documentId }: EditorHeaderProps) {
  const { status } = useDocumentSync(documentId);

  return (
    <div className="editor-header">
      <h2>{title}</h2>
      <SyncStatusBadge status={status} />
    </div>
  );
}

export default EditorHeader;