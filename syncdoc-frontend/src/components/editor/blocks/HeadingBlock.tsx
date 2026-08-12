import type{ DocumentBlock } from "../../../types";

interface HeadingBlockProps {
  block: DocumentBlock;
}

function HeadingBlock({ block }: HeadingBlockProps) {
  const level = block.level || 1;

  if (level === 1) {
    return <h1 className="block-heading">{block.content}</h1>;
  }

  if (level === 2) {
    return <h2 className="block-heading">{block.content}</h2>;
  }

  return <h3 className="block-heading">{block.content}</h3>;
}

export default HeadingBlock;