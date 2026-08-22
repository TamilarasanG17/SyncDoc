import type { DocumentBlock } from "../../../types";

interface HeadingBlockProps {
  block: DocumentBlock;
}

const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

function HeadingBlock({ block }: HeadingBlockProps) {
  const level = Math.min(Math.max(block.level ?? 1, 1), 6);
  const Tag = headingTags[level - 1];

  return <Tag className={`block-heading block-heading-${level}`}>{block.content}</Tag>;
}

export default HeadingBlock;