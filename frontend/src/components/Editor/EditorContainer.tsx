import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { useYDoc } from '../../hooks/useYDoc';
import { PresenceBar } from './PresenceBar';
import { BlockRenderer } from './BlockRenderer';
import {
  BlockManagementContext,
  type BlockManagementActions,
} from '../../context/BlockManagementContext';
import {
  exportDocument,
  addCollaborator,
  type ExportFormat,
} from '../../api/documentsApi';
import type { BlockType, DocumentDetail } from '../../types/document';

interface LocalUser {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface Props {
  documentId: string;
  documentMeta: DocumentDetail;
  localUser: LocalUser;
  onBack: () => void;
}

function newBlock(
  type: 'paragraph' | 'heading' | 'codeBlock'
): Y.Map<unknown> {
  const map = new Y.Map();

  map.set(
    'nodeId',
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  map.set('type', type);
  map.set('attrs', type === 'heading' ? { level: 2 } : {});
  map.set('content', '');
  map.set('children', new Y.Array());

  return map;
}

function findIndexByNodeId(
  blocks: Y.Array<Y.Map<unknown>>,
  nodeId: string
): number {
  return blocks.toArray().findIndex(
    (b) => b.get('nodeId') === nodeId
  );
}

/**
 * Week 2 "Sync Implementation" + Week 3 "Block Management":
 * connects to the live Yjs document, renders the block list, shows presence,
 * and exposes move/retype/delete commands to every block row via context.
 *
 * Week 4:
 * Owner-only document sharing through the collaborator API.
 */
export function EditorContainer({
  documentId,
  documentMeta,
  localUser,
  onBack,
}: Props) {
  const {
    blocks,
    connected,
    peers,
    lockedBlocks,
    localClientId,
    requestLock,
    releaseLock,
    setEditingBlock,
    updateSelection,
  } = useYDoc(documentId, localUser);

  const [, forceRender] = useState(0);

  useEffect(() => {
    const handler = () => forceRender((n) => n + 1);

    blocks.observeDeep(handler);

    return () => blocks.unobserveDeep(handler);
  }, [blocks]);

  const blockList = useMemo(
    () => blocks.toArray(),
    [blocks, blocks.length]
  );

  const [exporting, setExporting] =
    useState<ExportFormat | null>(null);

  const [exportMenuOpen, setExportMenuOpen] =
    useState(false);

  // Sharing state
  const [shareOpen, setShareOpen] =
    useState(false);

  const [shareEmail, setShareEmail] =
    useState('');

  const [sharing, setSharing] =
    useState(false);

  const [shareMessage, setShareMessage] =
    useState('');

  function handleAddBlock(
    type: 'paragraph' | 'heading' | 'codeBlock'
  ) {
    blocks.doc?.transact(() => {
      blocks.push([newBlock(type)]);
    });
  }

  function handleFocusBlock(blockId: string) {
    setEditingBlock(blockId);
    requestLock(blockId);
  }

  function handleBlurBlock(blockId: string) {
    setEditingBlock(null);
    releaseLock(blockId);
  }

  async function handleExport(format: ExportFormat) {
    setExportMenuOpen(false);
    setExporting(format);

    try {
      await exportDocument(
        documentId,
        documentMeta.title,
        format
      );
    } finally {
      setExporting(null);
    }
  }

  async function handleShare() {
    const email = shareEmail.trim();

    if (!email) {
      setShareMessage(
        'Please enter an email address.'
      );
      return;
    }

    setSharing(true);
    setShareMessage('');

    try {
      const result = await addCollaborator(
        documentId,
        email
      );

      setShareMessage(
        `${result.collaborator.name} can now access this document.`
      );

      setShareEmail('');
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        'Unable to share this document.';

      setShareMessage(message);
    } finally {
      setSharing(false);
    }
  }

  const blockActions: BlockManagementActions = {
    moveBlockUp(nodeId) {
      blocks.doc?.transact(() => {
        const idx = findIndexByNodeId(
          blocks,
          nodeId
        );

        if (idx <= 0) return;

        const item = blocks.get(idx);

        blocks.delete(idx, 1);
        blocks.insert(idx - 1, [item]);
      });
    },

    moveBlockDown(nodeId) {
      blocks.doc?.transact(() => {
        const idx = findIndexByNodeId(
          blocks,
          nodeId
        );

        if (
          idx === -1 ||
          idx >= blocks.length - 1
        ) {
          return;
        }

        const item = blocks.get(idx);

        blocks.delete(idx, 1);
        blocks.insert(idx + 1, [item]);
      });
    },

    deleteBlock(nodeId) {
      blocks.doc?.transact(() => {
        const idx = findIndexByNodeId(
          blocks,
          nodeId
        );

        if (idx === -1) return;

        blocks.delete(idx, 1);
      });
    },

    changeBlockType(
      nodeId,
      type: BlockType
    ) {
      blocks.doc?.transact(() => {
        const idx = findIndexByNodeId(
          blocks,
          nodeId
        );

        if (idx === -1) return;

        const block = blocks.get(idx);

        block.set('type', type);

        if (
          type === 'heading' &&
          !block.get('attrs')
        ) {
          block.set('attrs', {
            level: 2,
          });
        }
      });
    },
  };

  function gutterColorForBlock(
    nodeId: string
  ): string | null {
    const ownerId =
      lockedBlocks.get(nodeId);

    if (!ownerId) return null;

    if (ownerId === localClientId) {
      return localUser.color;
    }

    const namePart = ownerId
      .replace(
        /-[a-z0-9]{4,8}$/i,
        ''
      )
      .replace(/-/g, ' ');

    const match = peers.find(
      (p) =>
        p.name.toLowerCase() ===
        namePart.toLowerCase()
    );

    return (
      match?.color ?? '#6E5ADB'
    );
  }

  function lockOwnerLabel(
    nodeId: string
  ): string | null {
    const ownerId =
      lockedBlocks.get(nodeId);

    if (
      !ownerId ||
      ownerId === localClientId
    ) {
      return null;
    }

    const namePart = ownerId
      .replace(
        /-[a-z0-9]{4,8}$/i,
        ''
      )
      .replace(/-/g, ' ');

    const match = peers.find(
      (p) =>
        p.name.toLowerCase() ===
        namePart.toLowerCase()
    );

    return (
      match?.name ?? namePart
    );
  }

  const isOwner =
    documentMeta.ownerId === localUser.id;

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button
          className="ghost-button"
          onClick={onBack}
        >
          ← Library
        </button>

        <h2>{documentMeta.title}</h2>

        {isOwner && (
          <button
            className="ghost-button"
            onClick={() => {
              setShareOpen((value) => !value);
              setShareMessage('');
            }}
          >
            Share
          </button>
        )}

        <PresenceBar
          connected={connected}
          peers={peers}
          localUser={localUser}
        />

        <div className="export-menu">
          <button
            className="export-trigger"
            onClick={() =>
              setExportMenuOpen(
                (value) => !value
              )
            }
          >
            {exporting
              ? `Exporting ${exporting}…`
              : 'Export ▾'}
          </button>

          {exportMenuOpen && (
            <div className="export-dropdown">
              <button
                onClick={() =>
                  handleExport(
                    'markdown'
                  )
                }
              >
                Markdown (.md)
              </button>

              <button
                onClick={() =>
                  handleExport('html')
                }
              >
                HTML (.html)
              </button>

              <button
                onClick={() =>
                  handleExport('pdf')
                }
              >
                PDF (.pdf)
              </button>
            </div>
          )}
        </div>
      </div>

      {shareOpen && isOwner && (
        <div className="share-panel">
          <div className="share-panel-header">
            <strong>
              Share document
            </strong>

            <button
              className="ghost-button"
              onClick={() =>
                setShareOpen(false)
              }
            >
              ×
            </button>
          </div>

          <p>
            Enter the email address of a
            registered SyncDoc user.
          </p>

          <div className="share-form">
            <input
              type="email"
              value={shareEmail}
              onChange={(event) =>
                setShareEmail(
                  event.target.value
                )
              }
              placeholder="user@example.com"
              disabled={sharing}
            />

            <button
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing
                ? 'Sharing…'
                : 'Share'}
            </button>
          </div>

          {shareMessage && (
            <p className="share-message">
              {shareMessage}
            </p>
          )}
        </div>
      )}

      <BlockManagementContext.Provider
        value={blockActions}
      >
        <div className="block-list">
          {blockList.length === 0 && (
            <p className="empty-state">
              No blocks yet — add one below.
            </p>
          )}

          {blockList.map((block) => {
            const nodeId =
              block.get(
                'nodeId'
              ) as string;

            const ownerId =
              lockedBlocks.get(nodeId);

            const isLockedByOther =
              Boolean(ownerId) &&
              ownerId !== localClientId;

            return (
              <BlockRenderer
                key={nodeId}
                block={block}
                isLockedByOther={
                  isLockedByOther
                }
                lockOwnerLabel={lockOwnerLabel(
                  nodeId
                )}
                gutterColor={gutterColorForBlock(
                  nodeId
                )}
                onFocusBlock={
                  handleFocusBlock
                }
                onBlurBlock={
                  handleBlurBlock
                }
                onSelectionChange={
                  updateSelection
                }
                peers={peers}
              />
            );
          })}
        </div>
      </BlockManagementContext.Provider>

      <div className="add-block-row">
        <button
          onClick={() =>
            handleAddBlock(
              'paragraph'
            )
          }
        >
          ＋ Paragraph
        </button>

        <button
          onClick={() =>
            handleAddBlock(
              'heading'
            )
          }
        >
          ＋ Heading
        </button>

        <button
          onClick={() =>
            handleAddBlock(
              'codeBlock'
            )
          }
        >
          ＋ Code block
        </button>
      </div>
    </div>
  );
}