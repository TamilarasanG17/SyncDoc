interface BlockToolbarProps {
  onAddBlock: (type: string) => void;
}

function BlockToolbar({
  onAddBlock,
}: BlockToolbarProps) {
  return (
    <div className="block-toolbar">

      <button
        onClick={() => onAddBlock("heading")}
      >
        Heading
      </button>

      <button
        onClick={() => onAddBlock("paragraph")}
      >
        Paragraph
      </button>

      <button
        onClick={() => onAddBlock("code")}
      >
        Code
      </button>

    </div>
  );
}

export default BlockToolbar;