import EditorHeader from "./EditorHeader";
import BlockContainer from "./BlockContainer";
import type { DocumentBlock } from "../../types";

interface EditorProps {
  title: string;
  blocks: DocumentBlock[];
}

function Editor({ title, blocks }: EditorProps) {
  return (
    <section className="editor">

      <EditorHeader title={title} />

      <BlockContainer blocks={blocks} />

    </section>
  );
}

export default Editor;