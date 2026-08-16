import type { DocumentBlock } from "../../../types";
import { blockRegistry } from "./blockRegistry";
import BlockShell from "./BlockShell";

interface BlockRendererProps {
  block: DocumentBlock;
}

function BlockRenderer({ block }: BlockRendererProps) {
  const BlockComponent = blockRegistry[block.type];
  const hasChildren = !!block.children && block.children.length > 0;

  if (!BlockComponent) {
    console.warn(`No renderer registered for block type: ${block.type}`);
    return null;
  }

  return (
    <div className="ast-node" data-block-id={block.id}>
      <BlockShell block={block}>
        <BlockComponent block={block} />
      </BlockShell>

      {hasChildren && (
        <div className="ast-node-children">
          {block.children!.map((child) => (
            <div className="editor-block" key={child.id}>
              <BlockRenderer block={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlockRenderer;