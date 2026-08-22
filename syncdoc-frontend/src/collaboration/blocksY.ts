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
    children: childrenArray ? childrenArray.toArray().map(yMapToBlock) : undefined,
  };
}

export function yArrayToBlocks(array: Y.Array<Y.Map<unknown>>): DocumentBlock[] {
  return array.toArray().map(yMapToBlock);
}