import EditableField from "../EditableField";
import type { BlockComponentProps } from "./blockRegistry";

function CodeBlock({ block, onChangeContent }: BlockComponentProps) {
  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span>Code</span>
      </div>
      <EditableField
        as="textarea"
        value={block.content}
        onChange={onChangeContent}
        className="block-code-input"
      />
    </div>
  );
}

export default CodeBlock;