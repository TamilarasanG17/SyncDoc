import { useMemo, type ReactNode } from "react";

import { getYDoc } from "./ydoc";
import { CollaborationContext } from "./useCollaboration";
import type { CollaborationState } from "./types";

interface CollaborationProviderProps {
  documentId: string;
  children: ReactNode;
}

export function CollaborationProvider({ documentId, children }: CollaborationProviderProps) {
  const ydoc = useMemo(() => getYDoc(documentId), [documentId]);

  const value: CollaborationState = {
    status: "disconnected",
    ydoc,
  };

  return (
    <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>
  );
}