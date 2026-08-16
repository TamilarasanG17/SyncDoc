import EditorHeader from "./EditorHeader";
import BlockContainer from "./BlockContainer";
import type { DocumentBlock } from "../../types";

interface EditorProps {
  documentId: string;
  title: string;
  blocks: DocumentBlock[];
}

function Editor({ documentId, title, blocks }: EditorProps) {
  return (
    <section className="editor">
      <EditorHeader title={title} documentId={documentId} />
      <BlockContainer blocks={blocks} />
    </section>
  );
}

export default Editor;