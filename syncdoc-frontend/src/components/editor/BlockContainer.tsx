import type{ DocumentBlock } from "../../types/index";
import BlockRenderer from "./blocks/BlockRenderer";

interface BlockContainerProps {
  blocks: DocumentBlock[];
}

function BlockContainer({
  blocks,
}: BlockContainerProps) {
  return (
    <div className="block-container">
      {blocks.map((block) => (
        <div
          className="editor-block"
          key={block.id}
        >
          <BlockRenderer block={block} />
        </div>
      ))}
    </div>
  );
}

export default BlockContainer;