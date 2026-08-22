import type { ReactNode } from "react";
import type { DocumentBlock } from "../../../types";
import type { LocalUser } from "../../../collaboration/localUser";

interface BlockShellProps {
  block: DocumentBlock;
  children: ReactNode;
  lockedBy?: LocalUser[];
  onFocus?: () => void;
  onBlur?: () => void;
}

function BlockShell({ block, children, lockedBy, onFocus, onBlur }: BlockShellProps) {
  const isLocked = !!lockedBy && lockedBy.length > 0;
  const lockLabel = isLocked ? lockedBy!.map((u) => u.name).join(", ") : null;

  return (
    <div
      className={`block-shell${isLocked ? " block-shell-locked" : ""}`}
      data-block-type={block.type}
      data-block-id={block.id}
      style={isLocked ? { borderColor: lockedBy![0].color } : undefined}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {isLocked && (
        <span className="block-lock-badge" style={{ backgroundColor: lockedBy![0].color }}>
          {lockLabel} editing
        </span>
      )}
      {children}
    </div>
  );
}

export default BlockShell;