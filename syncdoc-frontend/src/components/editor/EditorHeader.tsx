interface EditorHeaderProps {
  title: string;
}

function EditorHeader({ title }: EditorHeaderProps) {
  return (
    <div className="editor-header">
      <h2>{title}</h2>

      <span className="editor-status">
        Saved
      </span>
    </div>
  );
}

export default EditorHeader;