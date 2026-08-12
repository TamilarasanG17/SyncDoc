import type{ DocumentBlock } from "../../../types";

interface CodeBlockProps {
  block: DocumentBlock;
}

function CodeBlock({ block }: CodeBlockProps) {
  return (
    <pre className="block-code">
      <code>{block.content}</code>
    </pre>
  );
}

export default CodeBlock;