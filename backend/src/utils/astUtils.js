import * as Y from 'yjs';
import mongoose from 'mongoose';

/**
 * Bridges the two representations SyncDoc keeps of a document:
 *
 *  - Yjs side (live, CRDT-merged): a top-level `blocks` Y.Array whose
 *    entries are Y.Map instances, each with { nodeId, type, attrs, content,
 *    children } where `children` is itself a nested Y.Array of Y.Maps for
 *    nodes like lists.
 *
 *  - Mongo side (durable, structural): the recursive AST tree stored on
 *    Document.root (see models/DocumentNode.js).
 *
 * `yBlocksToAst` runs after every debounced persistence tick (Week 2 ->
 * Week 3 handoff point). `astToYBlocks` runs once, when a brand-new
 * document is created, to seed the live Y.Doc from the initial AST.
 */

function newNodeId() {
  return new mongoose.Types.ObjectId().toString();
}

/** Recursively converts a Y.Map block (and its Y.Array children) into a plain AST node object. */
function yMapToAstNode(yMap, order) {
  const childrenYArray = yMap.get('children');
  const children =
    childrenYArray instanceof Y.Array
      ? childrenYArray.toArray().map((child, idx) => yMapToAstNode(child, idx))
      : [];

  return {
    nodeId: yMap.get('nodeId') || newNodeId(),
    type: yMap.get('type') || 'paragraph',
    attrs: yMap.get('attrs') || {},
    content: yMap.get('content') || '',
    order,
    children,
  };
}

/**
 * Converts the live Y.Doc's `blocks` array into a full AST tree suitable
 * for Document.root. Wraps everything under a synthetic 'document' root
 * node, since the Mongo schema expects a single root.
 */
export function yBlocksToAst(ydoc) {
  const blocksArray = ydoc.getArray('blocks');
  const children = blocksArray.toArray().map((block, idx) => yMapToAstNode(block, idx));
  return {
    nodeId: 'root',
    type: 'document',
    attrs: {},
    content: '',
    order: 0,
    children,
  };
}

/** Recursively builds a Y.Map block (with nested Y.Array children) from a plain AST node. */
function astNodeToYMap(node) {
  const map = new Y.Map();
  map.set('nodeId', node.nodeId || newNodeId());
  map.set('type', node.type);
  map.set('attrs', node.attrs || {});
  map.set('content', node.content || '');

  const childArray = new Y.Array();
  if (Array.isArray(node.children) && node.children.length) {
    childArray.push(node.children.map(astNodeToYMap));
  }
  map.set('children', childArray);
  return map;
}

/**
 * Seeds a freshly-created Y.Doc's `blocks` array from a stored AST root.
 * Used the first time a document is opened for live editing and no
 * persisted `yState` binary exists yet.
 */
export function astToYBlocks(ydoc, astRoot) {
  const blocksArray = ydoc.getArray('blocks');
  const topLevelNodes = astRoot?.children?.length
    ? astRoot.children
    : [
        {
          nodeId: newNodeId(),
          type: 'paragraph',
          attrs: {},
          content: '',
          children: [],
        },
      ];
  blocksArray.push(topLevelNodes.map(astNodeToYMap));
}
