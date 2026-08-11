interface NewDocumentButtonProps {
  onClick: () => void;
}

function NewDocumentButton({
  onClick,
}: NewDocumentButtonProps) {
  return (
    <button
      className="new-document-button"
      onClick={onClick}
    >
      + New Document
    </button>
  );
}

export default NewDocumentButton;