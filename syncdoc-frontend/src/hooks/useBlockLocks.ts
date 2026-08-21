import { useMemo } from "react";
import { useAwarenessStates } from "./useAwarenessStates";
import type { LocalUser } from "../collaboration/localUser";

export type BlockLocks = Map<string, LocalUser[]>;

export function useBlockLocks(localUserId: string): BlockLocks {
  const entries = useAwarenessStates();

  return useMemo(() => {
    const locks: BlockLocks = new Map();

    entries.forEach(({ state }) => {
      if (!state.user || !state.editingBlockId) return;
      if (state.user.id === localUserId) return;

      const existing = locks.get(state.editingBlockId) ?? [];
      existing.push(state.user);
      locks.set(state.editingBlockId, existing);
    });

    return locks;
  }, [entries, localUserId]);
}