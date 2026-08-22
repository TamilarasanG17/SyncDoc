import type { DocumentBlock } from "../../types/index";
import BlockRenderer from "./blocks/BlockRenderer";
import { useBlockLocks } from "../../hooks/useBlockLocks";

interface BlockContainerProps {
  blocks: DocumentBlock[];
  localUserId: string;
  onEditBlock: (blockId: string | null) => void;
  onChangeBlockContent: (blockId: string, content: string) => void;
}

function BlockContainer({ blocks, localUserId, onEditBlock, onChangeBlockContent }: BlockContainerProps) {
  const locks = useBlockLocks(localUserId);

  return (
    <div className="block-container">
      {blocks.map((block) => (
        <div className="editor-block" key={block.id}>
          <BlockRenderer
            block={block}
            locks={locks}
            onEditBlock={onEditBlock}
            onChangeBlockContent={onChangeBlockContent}
          />
        </div>
      ))}
    </div>
  );
}

export default BlockContainer;