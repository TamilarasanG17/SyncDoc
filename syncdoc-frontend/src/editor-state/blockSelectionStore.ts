import { useSyncExternalStore } from "react";
import type { SelectionRange } from "./types";

interface StoreState {
  activeBlockId: string | null;
  selection: SelectionRange | null;
}

type Listener = () => void;

function createBlockSelectionStore() {
  let state: StoreState = { activeBlockId: null, selection: null };
  const listeners = new Set<Listener>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot(): StoreState {
      return state;
    },
    setActiveBlock(blockId: string | null) {
      if (state.activeBlockId === blockId) return;
      state = { activeBlockId: blockId, selection: blockId ? state.selection : null };
      emit();
    },
    setSelection(selection: SelectionRange | null) {
      state = { ...state, selection };
      emit();
    },
    reset() {
      state = { activeBlockId: null, selection: null };
      emit();
    },
  };
}

export const blockSelectionStore = createBlockSelectionStore();

// Atomic subscriptions: each hook only re-renders the component that
// called it when ITS OWN relevant slice actually changes — not on every
// keystroke or focus change elsewhere in the document.

export function useIsBlockActive(blockId: string): boolean {
  return useSyncExternalStore(blockSelectionStore.subscribe, () =>
    blockSelectionStore.getSnapshot().activeBlockId === blockId
  );
}

export function useBlockSelectionRange(blockId: string): SelectionRange | null {
  return useSyncExternalStore(blockSelectionStore.subscribe, () => {
    const snapshot = blockSelectionStore.getSnapshot();
    return snapshot.activeBlockId === blockId ? snapshot.selection : null;
  });
}

export function useActiveBlockId(): string | null {
  return useSyncExternalStore(
    blockSelectionStore.subscribe,
    () => blockSelectionStore.getSnapshot().activeBlockId
  );
}