import EditableField from "../EditableField";
import type { BlockComponentProps } from "./blockRegistry";

function HeadingBlock({ block, onChangeContent }: BlockComponentProps) {
  const level = Math.min(Math.max(block.level ?? 1, 1), 6);

  return (
    <EditableField
  blockId={block.id}
  as="input"
  value={block.content}
  onChange={onChangeContent}
  className={`block-heading block-heading-${level}`}
/>
  );
}

export default HeadingBlock;