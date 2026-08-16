import type { ReactNode } from "react";
import type { DocumentBlock } from "../../../types";

interface BlockShellProps {
  block: DocumentBlock;
  children: ReactNode;
}

function BlockShell({ block, children }: BlockShellProps) {
  return (
    <div className="block-shell" data-block-type={block.type} data-block-id={block.id}>
      {children}
    </div>
  );
}

export default BlockShell;