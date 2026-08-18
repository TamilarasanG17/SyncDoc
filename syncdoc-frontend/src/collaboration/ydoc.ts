import * as Y from "yjs";

const docs = new Map<string, Y.Doc>();

// One Y.Doc instance per document id, reused across remounts/re-renders
// so we don't create duplicate CRDT state or lose in-memory history.
export function getYDoc(documentId: string): Y.Doc {
  let doc = docs.get(documentId);

  if (!doc) {
    doc = new Y.Doc();
    docs.set(documentId, doc);
  }

  return doc;
}