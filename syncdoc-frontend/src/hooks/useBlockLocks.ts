import { useMemo, useRef } from "react";
import { useAwarenessStates } from "./useAwarenessStates";
import type { LocalUser } from "../collaboration/localUser";

export type BlockLocks = Map<string, LocalUser[]>;

function computeSignature(
  entries: ReturnType<typeof useAwarenessStates>,
  localUserId: string
): string {
  const parts: string[] = [];

  entries.forEach(({ state }) => {
    if (!state.user || !state.editingBlockId) return;
    if (state.user.id === localUserId) return;
    parts.push(`${state.editingBlockId}:${state.user.id}`);
  });

  return parts.sort().join(",");
}

export function useBlockLocks(localUserId: string): BlockLocks {
  const entries = useAwarenessStates();
  const cacheRef = useRef<{ signature: string; locks: BlockLocks }>({
    signature: "",
    locks: new Map(),
  });

  return useMemo(() => {
    const signature = computeSignature(entries, localUserId);

    if (signature === cacheRef.current.signature) {
      return cacheRef.current.locks;
    }

    const locks: BlockLocks = new Map();
    entries.forEach(({ state }) => {
      if (!state.user || !state.editingBlockId) return;
      if (state.user.id === localUserId) return;

      const existing = locks.get(state.editingBlockId) ?? [];
      existing.push(state.user);
      locks.set(state.editingBlockId, existing);
    });

    cacheRef.current = { signature, locks };
    return locks;
  }, [entries, localUserId]);
}