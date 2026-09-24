import { useSyncExternalStore } from 'react';
import * as Y from 'yjs';
import type { BlockType, PeerUser } from '../../types/document';
import { blockSelectionStore } from '../../state/blockSelectionStore';
import { useBlockManagement } from '../../context/BlockManagementContext';

interface Props {
  block: Y.Map<unknown>;
  isLockedByOther: boolean;
  lockOwnerLabel: string | null;
  gutterColor: string | null;
  onFocusBlock: (blockId: string) => void;
  onBlurBlock: (blockId: string) => void;
    onSelectionChange: (
    selection: { blockId: string; start: number; end: number } | null
  ) => void;
    peers: PeerUser[];
}

const TYPE_LABEL: Record<string, string> = {
  paragraph: 'PARAGRAPH',
  heading: 'HEADING',
  codeBlock: 'CODE',
  list: 'LIST',
  listItem: 'LIST ITEM',
  text: 'TEXT',
};

const RETYPE_OPTIONS: BlockType[] = ['paragraph', 'heading', 'codeBlock'];

/**
 * Renders (and lets the user edit) a single AST block bound to a live
 * Y.Map. Week 3 adds: the signature gutter rail (colored per active
 * editor), atomic cursor/selection tracking via blockSelectionStore
 * (only THIS component re-renders when the cursor moves here), and a
 * hover toolbar wired to BlockManagementContext for move/retype/delete.
 */
export function BlockRenderer({
  block,
  isLockedByOther,
  lockOwnerLabel,
  gutterColor,
  onFocusBlock,
  onBlurBlock,
  onSelectionChange,
  peers,
}: Props) {
  const nodeId = block.get('nodeId') as string;
  const type = block.get('type') as string;
  const content = (block.get('content') as string) || '';
  const attrs = (block.get('attrs') as Record<string, unknown>) || {};
  const { moveBlockUp, moveBlockDown, deleteBlock, changeBlockType } = useBlockManagement();

  // Atomic, per-block subscription: re-renders only this row when this
  // block's cursor/selection changes, never the rest of the document.
  const selection = useSyncExternalStore(
  blockSelectionStore.subscribe(nodeId),
  () => blockSelectionStore.getSelection(nodeId)
);

const activeBlockId = useSyncExternalStore(
  blockSelectionStore.subscribeActive,
  blockSelectionStore.getActiveBlock
);

const isActive = activeBlockId === nodeId;

const remoteSelections = peers.filter(
  (peer) =>
    peer.selection &&
    peer.selection.blockId === nodeId
);


  function handleChange(value: string) {
    block.doc?.transact(() => {
      block.set('content', value);
    });
  }

 function handleSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
  const el = e.currentTarget;

  const selection = {
    blockId: nodeId,
    start: el.selectionStart,
    end: el.selectionEnd,
  };

  // Keep the existing local selection tracking.
  blockSelectionStore.setSelection(nodeId, {
    start: el.selectionStart,
    end: el.selectionEnd,
  });

  // Send the selection/cursor position to other users.
  onSelectionChange(selection);
}

  function handleFocus() {
    blockSelectionStore.setActiveBlock(nodeId);
    onFocusBlock(nodeId);
  }

  function handleBlur() {
  blockSelectionStore.setActiveBlock(null);
  blockSelectionStore.setSelection(nodeId, null);

  // Tell other users that this user no longer has
  // an active cursor/selection in this block.
  onSelectionChange(null);

  onBlurBlock(nodeId);
}

  const isCode = type === 'codeBlock';
  const isHeading = type === 'heading';
  const placeholder = isHeading ? 'Heading…' : isCode ? '// code…' : 'Type something…';
  const selectionLabel = selection
    ? selection.start === selection.end
      ? `Cursor at ${selection.start}`
      : `Selected ${selection.end - selection.start} chars (${selection.start}–${selection.end})`
    : null;

  return (
    <div
      className={`block-row ${isActive ? 'is-active' : ''} ${isLockedByOther ? 'is-locked' : ''}`}
      style={{ ['--gutter-color' as string]: gutterColor || 'transparent' }}
    >
      <div className="block-gutter" />

      <div className={`block block-${type}`}>
        <div className="block-head">
          <span className="block-badge">{TYPE_LABEL[type] || type.toUpperCase()}</span>
          {isLockedByOther && <span className="lock-chip">✏ {lockOwnerLabel} is editing</span>}
          <div className="block-toolbar">
            <button title="Move up" onClick={() => moveBlockUp(nodeId)}>↑</button>
            <button title="Move down" onClick={() => moveBlockDown(nodeId)}>↓</button>
            <select
              title="Change block type"
              value={type}
              onChange={(e) => changeBlockType(nodeId, e.target.value as BlockType)}
            >
              {RETYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {TYPE_LABEL[opt]}
                </option>
              ))}
            </select>
            <button title="Delete block" className="danger" onClick={() => deleteBlock(nodeId)}>
              ✕
            </button>
          </div>
        </div>

        <textarea
          className={isCode ? 'block-code' : isHeading ? `block-heading level-${attrs.level ?? 1}` : 'block-paragraph'}
          value={content}
          placeholder={placeholder}
          disabled={isLockedByOther}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => handleChange(e.target.value)}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onClick={handleSelect}
          rows={isCode ? 4 : isHeading ? 1 : 2}
        />

        {isActive && selectionLabel && <div className="block-caret-hint">{selectionLabel}</div>}
        {remoteSelections.map((peer) => {
  const remoteSelection = peer.selection;

  if (!remoteSelection) return null;

  const remoteLabel =
    remoteSelection.start === remoteSelection.end
      ? `${peer.name} · cursor at ${remoteSelection.start}`
      : `${peer.name} · selected ${remoteSelection.end - remoteSelection.start} chars`;

  return (
    <div
      key={`${peer.clientId}-${remoteSelection.blockId}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '6px',
        marginRight: '8px',
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        background: `${peer.color}18`,
        border: `1px solid ${peer.color}55`,
        color: peer.color,
      }}
    >
      <span
        style={{
          width: '7px',
          height: '14px',
          background: peer.color,
          display: 'inline-block',
          borderRadius: '2px',
        }}
      />

      {remoteLabel}
    </div>
  );
})}
      </div>
    </div>
  );
}
