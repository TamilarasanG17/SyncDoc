import * as Y from "yjs";
import type { DocumentBlock, EditRange } from "../types";

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

// One cached DocumentBlock per Y.Map instance. Reused across renders unless
// this block's own fields changed, or one of its children's cached object
// changed (checked by reference, recursively bottom-up).
const blockCache = new WeakMap<Y.Map<unknown>, DocumentBlock>();

function sameEditRange(a?: EditRange, b?: EditRange): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.start === b.start && a.end === b.end;
}

export function yMapToBlock(map: Y.Map<unknown>): DocumentBlock {
  const childrenYArray = map.get("children") as Y.Array<Y.Map<unknown>> | undefined;
  const children = childrenYArray ? childrenYArray.toArray().map(yMapToBlock) : undefined;

  const cached = blockCache.get(map);

  const id = map.get("id") as string;
  const type = map.get("type") as DocumentBlock["type"];
  const content = map.get("content") as string;
  const level = map.get("level") as number | undefined;
  const lastEditRange = map.get("lastEditRange") as EditRange | undefined;

  const childrenUnchanged =
    children === undefined
      ? cached?.children === undefined
      : !!cached?.children &&
        children.length === cached.children.length &&
        children.every((child, i) => child === cached.children![i]);

  const selfUnchanged =
    !!cached &&
    cached.id === id &&
    cached.type === type &&
    cached.content === content &&
    cached.level === level &&
    sameEditRange(cached.lastEditRange, lastEditRange);

  if (cached && selfUnchanged && childrenUnchanged) {
    return cached;
  }

  const block: DocumentBlock = { id, type, content, level, lastEditRange, children };
  blockCache.set(map, block);
  return block;
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