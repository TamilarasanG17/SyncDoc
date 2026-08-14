import type { DocumentBlock } from "../../../types";

import HeadingBlock from "./HeadingBlock";
import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";

interface BlockRendererProps {
  block: DocumentBlock;
}

function BlockRenderer({ block }: BlockRendererProps) {
  const renderContent = () => {
    switch (block.type) {
      case "heading":
        return <HeadingBlock block={block} />;
      case "paragraph":
        return <ParagraphBlock block={block} />;
      case "code":
        return <CodeBlock block={block} />;
      default:
        return null;
    }
  };

  const hasChildren = !!block.children && block.children.length > 0;

  return (
    <div className="ast-node" data-block-id={block.id}>
      {renderContent()}

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