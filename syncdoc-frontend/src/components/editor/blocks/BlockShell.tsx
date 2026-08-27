import type { ReactNode } from "react";
import type { DocumentBlock } from "../../../types";
import type { LocalUser } from "../../../collaboration/localUser";
import { useIsBlockActive, useBlockSelectionRange } from "../../../editor-state/blockSelectionStore";

interface BlockShellProps {
  block: DocumentBlock;
  children: ReactNode;
  lockedBy?: LocalUser[];
  onFocus?: () => void;
  onBlur?: () => void;
}

function BlockShell({ block, children, lockedBy, onFocus, onBlur }: BlockShellProps) {
  const isActive = useIsBlockActive(block.id);
  const selection = useBlockSelectionRange(block.id);

  const isLocked = !!lockedBy && lockedBy.length > 0;
  const lockLabel = isLocked ? lockedBy!.map((u) => u.name).join(", ") : null;

  const className = [
    "block-shell",
    isActive ? "block-shell-active" : "",
    isLocked ? "block-shell-locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      data-block-type={block.type}
      data-block-id={block.id}
      style={isLocked ? { borderColor: lockedBy![0].color } : undefined}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {isLocked && (
        <span className="block-lock-badge" style={{ backgroundColor: lockedBy![0].color }}>
          {lockLabel} editing
        </span>
      )}

      {isActive && import.meta.env.DEV && selection && (
        <span className="block-cursor-debug">
          {selection.start === selection.end
            ? `caret @ ${selection.start}`
            : `sel ${selection.start}–${selection.end}`}
        </span>
      )}

      {children}
    </div>
  );
}

export default BlockShell;