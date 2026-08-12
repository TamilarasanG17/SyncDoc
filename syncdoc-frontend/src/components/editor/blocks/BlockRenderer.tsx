import type{ DocumentBlock } from "../../../types";

import HeadingBlock from "./HeadingBlock";
import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";

interface BlockRendererProps {
  block: DocumentBlock;
}

function BlockRenderer({
  block,
}: BlockRendererProps) {
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
}

export default BlockRenderer;