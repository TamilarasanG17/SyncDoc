import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";

import { useCollaboration } from "../collaboration/useCollaboration";
import { blockToYMap, yArrayToBlocks, findBlockYMap } from "../collaboration/blocksY";
import type { DocumentBlock, EditRange } from "../types";

export function useSyncedBlocks(initialBlocks: DocumentBlock[]) {
  const { ydoc, providerRef } = useCollaboration();
  const sharedBlocks = ydoc.getArray<Y.Map<unknown>>("blocks");

  const [blocks, setBlocks] = useState<DocumentBlock[]>(() =>
    sharedBlocks.length > 0 ? yArrayToBlocks(sharedBlocks) : initialBlocks
  );

  useEffect(() => {
    const handleChange = () => {
      setBlocks(yArrayToBlocks(sharedBlocks));
    };

    sharedBlocks.observeDeep(handleChange);

    const provider = providerRef.current;

    const seedIfEmpty = () => {
      if (sharedBlocks.length === 0) {
        ydoc.transact(() => {
          sharedBlocks.push(initialBlocks.map(blockToYMap));
        });
      }
    };

    if (provider?.synced) {
      seedIfEmpty();
    } else {
      provider?.on("sync", seedIfEmpty);
    }

    return () => {
      sharedBlocks.unobserveDeep(handleChange);
      provider?.off("sync", seedIfEmpty);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBlocks, providerRef]);

  const updateBlockContent = useCallback(
    (blockId: string, content: string, range?: EditRange) => {
      const map = findBlockYMap(sharedBlocks, blockId);
      if (!map) return;

      ydoc.transact(() => {
        map.set("content", content);
        if (range) {
          map.set("lastEditRange", range);
        }
      });
    },
    [sharedBlocks, ydoc]
  );

  return { blocks, updateBlockContent };
}