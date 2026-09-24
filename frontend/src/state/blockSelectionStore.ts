type Selection = { start: number; end: number } | null;
type Listener = () => void;

/**
 * Week 3 "Block Management": tracks the active cursor position and
 * selection bounds *per block*, outside of React state, using the
 * external-store pattern (React's useSyncExternalStore). Each block only
 * subscribes to its own key, so moving a cursor inside one block never
 * re-renders any other block in the document - "update specific AST
 * nodes on screen" taken literally, rather than the Week 2 approach of
 * deep-observing the whole Y.Array and re-rendering everything.
 */
class BlockSelectionStore {
  private selections = new Map<string, Selection>();
  private listeners = new Map<string, Set<Listener>>();
  private activeBlockId: string | null = null;
  private activeListeners = new Set<Listener>();

  setSelection(blockId: string, selection: Selection) {
    this.selections.set(blockId, selection);
    this.listeners.get(blockId)?.forEach((listen) => listen());
  }

  getSelection(blockId: string): Selection {
    return this.selections.get(blockId) ?? null;
  }

  subscribe = (blockId: string) => (listener: Listener) => {
    if (!this.listeners.has(blockId)) this.listeners.set(blockId, new Set());
    this.listeners.get(blockId)!.add(listener);
    return () => {
      this.listeners.get(blockId)?.delete(listener);
    };
  };

  setActiveBlock(blockId: string | null) {
    if (this.activeBlockId === blockId) return;
    this.activeBlockId = blockId;
    this.activeListeners.forEach((listen) => listen());
  }

  getActiveBlock = () => this.activeBlockId;

  subscribeActive = (listener: Listener) => {
    this.activeListeners.add(listener);
    return () => {
      this.activeListeners.delete(listener);
    };
  };
}

// Singleton: one store per browser tab/document view, recreated whenever
// the editor mounts a fresh document (see EditorContainer).
export const blockSelectionStore = new BlockSelectionStore();
