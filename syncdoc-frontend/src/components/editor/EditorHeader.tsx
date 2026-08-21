import { useDocumentSync } from "../../hooks/useDocumentSync";
import SyncStatusBadge from "./SyncStatusBadge";
import PresenceBar from "./PresenceBar";

interface EditorHeaderProps {
  title: string;
  localUserId: string;
}

function EditorHeader({ title, localUserId }: EditorHeaderProps) {
  const { status } = useDocumentSync();

  return (
    <div className="editor-header">
      <h2>{title}</h2>
      <div className="editor-header-right">
        <PresenceBar localUserId={localUserId} />
        <SyncStatusBadge status={status} />
      </div>
    </div>
  );
}

export default EditorHeader;