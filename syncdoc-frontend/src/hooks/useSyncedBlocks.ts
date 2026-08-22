import { useEffect, useState } from "react";
import * as Y from "yjs";

import { useCollaboration } from "../collaboration/useCollaboration";
import { blockToYMap, yArrayToBlocks } from "../collaboration/blocksY";
import type { DocumentBlock } from "../types";

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

    // Fires on any change anywhere in the nested block tree — top-level
    // inserts/removes AND edits inside a child block's Y.Map.
    sharedBlocks.observeDeep(handleChange);

    const provider = providerRef.current;

    // Only seed the shared doc once we know whether a remote copy already
    // exists. Seeding before the initial sync completes risks two clients
    // both writing their own copy at once.
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

  return blocks;
}