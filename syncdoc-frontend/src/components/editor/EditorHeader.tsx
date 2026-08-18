import { useDocumentSync } from "../../hooks/useDocumentSync";
import SyncStatusBadge from "./SyncStatusBadge";

interface EditorHeaderProps {
  title: string;
}

function EditorHeader({ title }: EditorHeaderProps) {
  const { status } = useDocumentSync();

  return (
    <div className="editor-header">
      <h2>{title}</h2>
      <SyncStatusBadge status={status} />
    </div>
  );
}

export default EditorHeader;