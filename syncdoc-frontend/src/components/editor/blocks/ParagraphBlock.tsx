import type{ DocumentBlock } from "../../../types";

interface ParagraphBlockProps {
  block: DocumentBlock;
}

function ParagraphBlock({
  block,
}: ParagraphBlockProps) {
  return (
    <p className="block-paragraph">
      {block.content}
    </p>
  );
}

export default ParagraphBlock;