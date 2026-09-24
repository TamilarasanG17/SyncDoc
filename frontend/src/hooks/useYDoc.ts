import { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import type { PeerUser } from '../types/document';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/sync';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_LOCK = 2;

export interface LocalUser {
  name: string;
  color: string;
}

interface UseYDocResult {
  ydoc: Y.Doc;
  blocks: Y.Array<Y.Map<unknown>>;
  connected: boolean;
  peers: PeerUser[];
  lockedBlocks: Map<string, string>; // blockId -> ownerClientId
  localClientId: string;
  requestLock: (blockId: string) => void;
  releaseLock: (blockId: string) => void;
  setEditingBlock: (blockId: string | null) => void;
  updateSelection: (
    selection: { blockId: string; start: number; end: number } | null
  ) => void;
}

/**
 * Connects a React component to a SyncDoc document's live CRDT state
 * (Week 2 - "Sync Implementation"). Speaks the same custom
 * sync/awareness/lock protocol as backend/src/sync/websocketServer.js.
 */
export function useYDoc(docId: string, user: LocalUser): UseYDocResult {
  const ydoc = useMemo(() => new Y.Doc(), [docId]);
  const blocks = useMemo(() => ydoc.getArray<Y.Map<unknown>>('blocks'), [ydoc]);
  const awareness = useMemo(
    () => new awarenessProtocol.Awareness(ydoc),
    [ydoc]
  );

  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [lockedBlocks, setLockedBlocks] = useState<Map<string, string>>(
    new Map()
  );

  const clientIdRef = useRef<string>(
    `${user.name.replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`
  );

  useEffect(() => {
    const socket = new WebSocket(
      `${WS_URL}?doc=${encodeURIComponent(
        docId
      )}&clientId=${encodeURIComponent(clientIdRef.current)}`
    );

    socket.binaryType = 'arraybuffer';
    wsRef.current = socket;

    socket.addEventListener('open', () => {
      setConnected(true);

      awareness.setLocalState({
        user,
        editingBlockId: null,
        selection: null,
      });

      // Kick off sync step 1 from this client too, so a brand-new empty
      // Y.Doc still asks the server for whatever state already exists.
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeSyncStep1(encoder, ydoc);
      socket.send(encoding.toUint8Array(encoder));
    });

    socket.addEventListener('close', () => setConnected(false));
    socket.addEventListener('error', () => setConnected(false));

    socket.addEventListener('message', (event) => {
      const decoder = decoding.createDecoder(
        new Uint8Array(event.data as ArrayBuffer)
      );

      const messageType = decoding.readVarUint(decoder);

      if (messageType === MESSAGE_SYNC) {
        const encoder = encoding.createEncoder();

        encoding.writeVarUint(encoder, MESSAGE_SYNC);

        syncProtocol.readSyncMessage(
          decoder,
          encoder,
          ydoc,
          socket
        );

        if (encoding.length(encoder) > 1) {
          socket.send(encoding.toUint8Array(encoder));
        }
      } else if (messageType === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(
          awareness,
          decoding.readVarUint8Array(decoder),
          socket
        );
      } else if (messageType === MESSAGE_LOCK) {
        const { blockId, ownerId, granted } = JSON.parse(
          decoding.readVarString(decoder)
        );

        setLockedBlocks((prev) => {
          const next = new Map(prev);

          if (granted) {
            next.set(blockId, ownerId);
          } else {
            next.delete(blockId);
          }

          return next;
        });
      }
    });

    // Relay every local Yjs change to the server.
    const updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === socket) return;

      const encoder = encoding.createEncoder();

      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(encoding.toUint8Array(encoder));
      }
    };

    ydoc.on('update', updateHandler);

    // Relay local awareness changes (cursor / presence / editing-block).
    const awarenessUpdateHandler = ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      const changed = added.concat(updated, removed);

      const encoder = encoding.createEncoder();

      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);

      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          awareness,
          changed
        )
      );

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(encoding.toUint8Array(encoder));
      }

      const states = Array.from(awareness.getStates().entries())
        .filter(([id]) => id !== awareness.clientID)
        .map(([id, state]) => ({
          clientId: id,
          name: (state?.user?.name as string) || 'Anonymous',
          color: (state?.user?.color as string) || '#999999',
          editingBlockId:
            (state?.editingBlockId as string | null) ?? null,
          selection:
            (state?.selection as {
              blockId: string;
              start: number;
              end: number;
            } | null) ?? null,
        }));

      setPeers(states);
    };

    awareness.on('update', awarenessUpdateHandler);

    return () => {
      ydoc.off('update', updateHandler);

      awareness.off('update', awarenessUpdateHandler);

      awarenessProtocol.removeAwarenessStates(
        awareness,
        [awareness.clientID],
        'unmount'
      );

      socket.close();

      wsRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  function sendLockMessage(
    action: 'acquire' | 'release',
    blockId: string
  ) {
    const socket = wsRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const encoder = encoding.createEncoder();

    encoding.writeVarUint(encoder, MESSAGE_LOCK);

    encoding.writeVarString(
      encoder,
      JSON.stringify({
        action,
        blockId,
        clientId: clientIdRef.current,
      })
    );

    socket.send(encoding.toUint8Array(encoder));
  }

  function requestLock(blockId: string) {
    sendLockMessage('acquire', blockId);
  }

  function releaseLock(blockId: string) {
    sendLockMessage('release', blockId);
  }

  function setEditingBlock(blockId: string | null) {
    const current = awareness.getLocalState() || {};

    awareness.setLocalState({
      ...current,
      user,
      editingBlockId: blockId,
    });
  }

  function updateSelection(
    selection: {
      blockId: string;
      start: number;
      end: number;
    } | null
  ) {
    const current = awareness.getLocalState() || {};

    awareness.setLocalState({
      ...current,
      user,
      selection,
    });
  }

  return {
    ydoc,
    blocks,
    connected,
    peers,
    lockedBlocks,
    localClientId: clientIdRef.current,
    requestLock,
    releaseLock,
    setEditingBlock,
    updateSelection,
  };
}