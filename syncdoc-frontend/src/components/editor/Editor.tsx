import EditorHeader from "./EditorHeader";
import BlockContainer from "./BlockContainer";
import { CollaborationProvider } from "../../collaboration/CollaborationContext";
import type { DocumentBlock } from "../../types";

interface EditorProps {
  documentId: string;
  title: string;
  blocks: DocumentBlock[];
}

function Editor({ documentId, title, blocks }: EditorProps) {
  return (
    <CollaborationProvider documentId={documentId}>
      <section className="editor">
        <EditorHeader title={title} documentId={documentId} />
        <BlockContainer blocks={blocks} />
      </section>
    </CollaborationProvider>
  );
}

export default Editor;