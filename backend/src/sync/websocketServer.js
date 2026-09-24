import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { WebSocketServer } from 'ws';
import { loadIntoYDoc, schedulePersist, flushPersist } from './persistence.js';

// Custom message type tags, written as the first varUint of every frame.
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_LOCK = 2; // custom: block-level "who is editing what" locks

const LOCK_TTL_MS = 8000; // a lock auto-expires if a client goes away without releasing it

/**
 * One WSSharedDoc per open document ("room"). Wraps a Y.Doc with the
 * bookkeeping the sync + awareness protocols need, plus a lightweight
 * lock table for the "localized operational block-locking" requirement:
 * a soft, advisory lock so two users editing the SAME block get a visible
 * warning instead of a silent structural collision, layered on top of
 * (not replacing) Yjs's own CRDT merge guarantees.
 */
class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super({ gc: true });
    this.name = name;
    this.conns = new Map(); // ws -> Set<clientID>
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);
    this.locks = new Map(); // blockId -> { clientId, acquiredAt }

    this.awareness.on('update', ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated, removed);
      if (origin instanceof Object && origin.conn !== undefined) {
        const conn = origin.conn;
        const connControlledIDs = this.conns.get(conn);
        if (connControlledIDs) {
          added.forEach((id) => connControlledIDs.add(id));
          removed.forEach((id) => connControlledIDs.delete(id));
        }
      }
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const message = encoding.toUint8Array(encoder);
      this.conns.forEach((_, conn) => sendSafely(conn, message));
    });

    this.on('update', (update, origin) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);
      this.conns.forEach((_, conn) => {
        if (conn !== origin) sendSafely(conn, message);
      });
      // Debounced durable persistence into the AST Database (Mongo).
      schedulePersist(this.name, this, origin?.__syncdocClientId);
    });
  }

  /** Acquires a soft lock on a block for a given clientId; returns success + current owner. */
  acquireLock(blockId, clientId) {
    const existing = this.locks.get(blockId);
    const expired = existing && Date.now() - existing.acquiredAt > LOCK_TTL_MS;
    if (!existing || expired || existing.clientId === clientId) {
      this.locks.set(blockId, { clientId, acquiredAt: Date.now() });
      return { granted: true, ownerId: clientId };
    }
    return { granted: false, ownerId: existing.clientId };
  }

  releaseLock(blockId, clientId) {
    const existing = this.locks.get(blockId);
    if (existing && existing.clientId === clientId) {
      this.locks.delete(blockId);
      return true;
    }
    return false;
  }

  /** Releases every lock held by a client (used on disconnect). */
  releaseAllLocksFor(clientId) {
    const released = [];
    for (const [blockId, info] of this.locks.entries()) {
      if (info.clientId === clientId) {
        this.locks.delete(blockId);
        released.push(blockId);
      }
    }
    return released;
  }

  broadcastLockState(blockId, ownerId, granted) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_LOCK);
    encoding.writeVarString(encoder, JSON.stringify({ blockId, ownerId, granted }));
    const message = encoding.toUint8Array(encoder);
    this.conns.forEach((_, conn) => sendSafely(conn, message));
  }
}

function sendSafely(conn, message) {
  try {
    if (conn.readyState === conn.OPEN) conn.send(message, { binary: true });
  } catch (err) {
    conn.close();
  }
}

const docs = new Map(); // docName -> WSSharedDoc

/** Gets (creating + hydrating from Mongo if needed) the shared Y.Doc "room" for a document id. */
async function getYDoc(docName) {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new WSSharedDoc(docName);
    docs.set(docName, doc);
    await loadIntoYDoc(docName, doc);
  }
  return doc;
}

function closeConn(doc, conn) {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);

    // Advisory locks shouldn't outlive the connection that holds them.
    const clientId = conn.__syncdocClientId;
    if (clientId) {
      const released = doc.releaseAllLocksFor(clientId);
      released.forEach((blockId) => doc.broadcastLockState(blockId, null, false));
    }

    if (doc.conns.size === 0) {
      flushPersist(doc.name, doc, conn.__syncdocClientId).catch((err) =>
        console.error(`[sync] flush on close failed for ${doc.name}:`, err.message)
      );
    }
  }
  conn.close();
}

function handleLockMessage(doc, conn, decoder) {
  const payload = JSON.parse(decoding.readVarString(decoder));
  const { action, blockId } = payload;
  const clientId = conn.__syncdocClientId;

  if (action === 'acquire') {
    const { granted, ownerId } = doc.acquireLock(blockId, clientId);
    doc.broadcastLockState(blockId, ownerId, granted);
  } else if (action === 'release') {
    const didRelease = doc.releaseLock(blockId, clientId);
    if (didRelease) doc.broadcastLockState(blockId, null, false);
  }
}

function messageListener(conn, doc, message) {
  try {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case MESSAGE_SYNC: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
        if (encoding.length(encoder) > 1) sendSafely(conn, encoding.toUint8Array(encoder));
        break;
      }
      case MESSAGE_AWARENESS: {
        awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), {
          conn,
        });
        break;
      }
      case MESSAGE_LOCK: {
        handleLockMessage(doc, conn, decoder);
        break;
      }
      default:
        console.warn('[sync] unknown message type', messageType);
    }
  } catch (err) {
    console.error('[sync] message handling error:', err.message);
  }
}

/**
 * Wires a raw `ws` connection into the CRDT sync + awareness + lock
 * broadcast loop for a given document room. Mirrors the well-known
 * y-websocket connection bootstrap: send sync-step-1, then the current
 * awareness state, then just relay messages both ways.
 */
export async function setupWSConnection(conn, docName, clientId) {
  conn.binaryType = 'arraybuffer';
  conn.__syncdocClientId = clientId;

  const doc = await getYDoc(docName);
  doc.conns.set(conn, new Set());

  conn.on('message', (message) => messageListener(conn, doc, new Uint8Array(message)));
  conn.on('close', () => closeConn(doc, conn));
  conn.on('error', () => closeConn(doc, conn));

  // 1. Initial sync step
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, doc);
  sendSafely(conn, encoding.toUint8Array(syncEncoder));

  // 2. Current awareness state of every other connected peer
  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
    );
    sendSafely(conn, encoding.toUint8Array(awarenessEncoder));
  }

  // 3. Current lock table, so a newly-joined client sees blocks already
  //    being edited by someone else.
  for (const [blockId, info] of doc.locks.entries()) {
    doc.broadcastLockState(blockId, info.clientId, true);
  }
}

/**
 * Attaches a `ws` WebSocketServer in noServer mode to the given HTTP
 * server, routing only requests to `/sync` into the Yjs sync handler so
 * the same port also serves the plain REST API.
 */
export function attachSyncServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname, searchParams } = new URL(request.url, 'http://localhost');
    if (pathname !== '/sync') return; // let other upgrade handlers (if any) deal with it

    wss.handleUpgrade(request, socket, head, (ws) => {
      const docName = searchParams.get('doc');
      const clientId = searchParams.get('clientId') || `anon-${Date.now()}`;
      if (!docName) {
        ws.close(4000, 'Missing ?doc= query parameter');
        return;
      }
      setupWSConnection(ws, docName, clientId).catch((err) => {
        console.error('[sync] failed to set up connection:', err.message);
        ws.close();
      });
    });
  });

  console.log('[sync] Yjs WebSocket sync server attached at /sync');
  return wss;
}
