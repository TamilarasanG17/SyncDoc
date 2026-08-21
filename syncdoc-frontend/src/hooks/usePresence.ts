import { useMemo } from "react";
import { useAwarenessStates } from "./useAwarenessStates";
import type { LocalUser } from "../collaboration/localUser";

export interface PresenceEntry {
  user: LocalUser;
  editingBlockId: string | null;
  isSelf: boolean;
}

export function usePresence(localUserId: string): PresenceEntry[] {
  const entries = useAwarenessStates();

  return useMemo(() => {
    const seen = new Map<string, PresenceEntry>();

    entries.forEach(({ state }) => {
      if (!state.user) return;

      // Keep the latest state per user id — a reconnect can briefly produce
      // two awareness entries for the same person.
      seen.set(state.user.id, {
        user: state.user,
        editingBlockId: state.editingBlockId ?? null,
        isSelf: state.user.id === localUserId,
      });
    });

    return Array.from(seen.values()).sort((a, b) => (a.isSelf ? -1 : b.isSelf ? 1 : 0));
  }, [entries, localUserId]);
}