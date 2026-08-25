import { useCallback, useMemo, useState, type ReactNode } from "react";
import { BlockSelectionContext } from "./blockSelectionStore";
import type { SelectionRange } from "./types";

interface BlockSelectionProviderProps {
  children: ReactNode;
}

function BlockSelectionProvider({ children }: BlockSelectionProviderProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [selection, setSelectionState] = useState<SelectionRange | null>(null);

  const setActiveBlock = useCallback((blockId: string | null) => {
    setActiveBlockId(blockId);
  }, []);

  const setSelection = useCallback((next: SelectionRange | null) => {
    setSelectionState(next);
  }, []);

  const value = useMemo(
    () => ({ activeBlockId, selection, setActiveBlock, setSelection }),
    [activeBlockId, selection, setActiveBlock, setSelection]
  );

  return (
    <BlockSelectionContext.Provider value={value}>{children}</BlockSelectionContext.Provider>
  );
}

export default BlockSelectionProvider;