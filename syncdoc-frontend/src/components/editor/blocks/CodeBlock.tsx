import type { DocumentBlock } from "../../../types";

interface CodeBlockProps {
  block: DocumentBlock;
}

function CodeBlock({ block }: CodeBlockProps) {
  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span>Code</span>
      </div>
      <pre className="block-code">
        <code>{block.content}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;