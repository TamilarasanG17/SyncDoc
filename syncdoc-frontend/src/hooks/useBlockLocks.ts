import { useEffect, useState } from "react";
import { useCollaboration } from "../collaboration/useCollaboration";
import type { AwarenessState } from "../collaboration/awareness";
import type { LocalUser } from "../collaboration/localUser";

export type BlockLocks = Map<string, LocalUser[]>;

export function useBlockLocks(localUserId: string): BlockLocks {
  const { providerRef, status } = useCollaboration();
  const [locks, setLocks] = useState<BlockLocks>(new Map());

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;

    const handleAwarenessChange = () => {
      const nextLocks: BlockLocks = new Map();

      provider.awareness.getStates().forEach((rawState, clientId) => {
        if (clientId === provider.awareness.clientID) return;

        const state = rawState as Partial<AwarenessState>;
        if (!state.user || !state.editingBlockId) return;
        if (state.user.id === localUserId) return;

        const existing = nextLocks.get(state.editingBlockId) ?? [];
        existing.push(state.user);
        nextLocks.set(state.editingBlockId, existing);
      });

      setLocks(nextLocks);
    };

    provider.awareness.on("change", handleAwarenessChange);

    return () => {
      provider.awareness.off("change", handleAwarenessChange);
    };
  }, [providerRef, status, localUserId]);

  return locks;
}