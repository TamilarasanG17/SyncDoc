import EditableField from "../EditableField";
import type { BlockComponentProps } from "./blockRegistry";

function ParagraphBlock({ block, onChangeContent }: BlockComponentProps) {
  return (
    <EditableField
      as="textarea"
      value={block.content}
      onChange={onChangeContent}
      className="block-paragraph"
    />
  );
}

export default ParagraphBlock;