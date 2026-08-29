import * as Y from "yjs";
import type { DocumentBlock } from "../types";

export function blockToYMap(block: DocumentBlock): Y.Map<unknown> {
  const map = new Y.Map();

  map.set("id", block.id);
  map.set("type", block.type);
  map.set("content", block.content);

  if (block.level !== undefined) {
    map.set("level", block.level);
  }

  if (block.lastEditRange) {
    map.set("lastEditRange", block.lastEditRange);
  }

  const childrenArray = new Y.Array<Y.Map<unknown>>();
  if (block.children) {
    childrenArray.push(block.children.map(blockToYMap));
  }
  map.set("children", childrenArray);

  return map;
}

export function yMapToBlock(map: Y.Map<unknown>): DocumentBlock {
  const childrenArray = map.get("children") as Y.Array<Y.Map<unknown>> | undefined;

  return {
    id: map.get("id") as string,
    type: map.get("type") as DocumentBlock["type"],
    content: map.get("content") as string,
    level: map.get("level") as number | undefined,
    lastEditRange: map.get("lastEditRange") as DocumentBlock["lastEditRange"],
    children: childrenArray ? childrenArray.toArray().map(yMapToBlock) : undefined,
  };
}


export function yArrayToBlocks(array: Y.Array<Y.Map<unknown>>): DocumentBlock[] {
  return array.toArray().map(yMapToBlock);
}

export function findBlockYMap(
  array: Y.Array<Y.Map<unknown>>,
  blockId: string
): Y.Map<unknown> | null {
  for (const map of array.toArray()) {
    if (map.get("id") === blockId) return map;

    const children = map.get("children") as Y.Array<Y.Map<unknown>> | undefined;
    if (children) {
      const found = findBlockYMap(children, blockId);
      if (found) return found;
    }
  }

  return null;
}