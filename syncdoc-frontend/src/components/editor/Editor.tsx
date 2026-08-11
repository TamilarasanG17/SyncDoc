import EditorHeader from "./EditorHeader";
import BlockContainer from "./BlockContainer";

interface EditorProps {
  title: string;
}

function Editor({ title }: EditorProps) {
  return (
    <section className="editor">

      <EditorHeader title={title} />

      <BlockContainer />

    </section>
  );
}

export default Editor;