import type { DocumentBlock } from "../../types/index";
import BlockRenderer from "./blocks/BlockRenderer";
import { useLocalAwareness } from "../../hooks/useLocalAwareness";
import { useBlockLocks } from "../../hooks/useBlockLocks";

interface BlockContainerProps {
  blocks: DocumentBlock[];
}

function BlockContainer({ blocks }: BlockContainerProps) {
  const { setEditingBlock, localUserId } = useLocalAwareness();
  const locks = useBlockLocks(localUserId);

  return (
    <div className="block-container">
      {blocks.map((block) => (
        <div className="editor-block" key={block.id}>
          <BlockRenderer block={block} locks={locks} onEditBlock={setEditingBlock} />
        </div>
      ))}
    </div>
  );
}

export default BlockContainer;