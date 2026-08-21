import type { DocumentBlock } from "../../../types";
import { blockRegistry } from "./blockRegistry";
import BlockShell from "./BlockShell";
import type { BlockLocks } from "../../../hooks/useBlockLocks";

interface BlockRendererProps {
  block: DocumentBlock;
  locks: BlockLocks;
  onEditBlock: (blockId: string | null) => void;
}

function BlockRenderer({ block, locks, onEditBlock }: BlockRendererProps) {
  const BlockComponent = blockRegistry[block.type];
  const hasChildren = !!block.children && block.children.length > 0;
  const lockedBy = locks.get(block.id);

  if (!BlockComponent) {
    console.warn(`No renderer registered for block type: ${block.type}`);
    return null;
  }

  return (
    <div className="ast-node" data-block-id={block.id}>
      <BlockShell
        block={block}
        lockedBy={lockedBy}
        onFocus={() => onEditBlock(block.id)}
        onBlur={() => onEditBlock(null)}
      >
        <BlockComponent block={block} />
      </BlockShell>

      {hasChildren && (
        <div className="ast-node-children">
          {block.children!.map((child) => (
            <div className="editor-block" key={child.id}>
              <BlockRenderer block={child} locks={locks} onEditBlock={onEditBlock} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlockRenderer;