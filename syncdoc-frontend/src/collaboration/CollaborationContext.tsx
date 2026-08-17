import { createContext, useContext, useMemo, type ReactNode } from "react";

import { getYDoc } from "./ydoc";
import type { CollaborationState } from "./types";

const CollaborationContext = createContext<CollaborationState | null>(null);

interface CollaborationProviderProps {
  documentId: string;
  children: ReactNode;
}

export function CollaborationProvider({ documentId, children }: CollaborationProviderProps) {
  const ydoc = useMemo(() => getYDoc(documentId), [documentId]);

  // Day 2 will replace this static "disconnected" with a real WebsocketProvider
  // connection and update status as it connects/syncs/errors.
  const value: CollaborationState = {
    status: "disconnected",
    ydoc,
  };

  return (
    <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>
  );
}

export function useCollaboration(): CollaborationState {
  const context = useContext(CollaborationContext);

  if (!context) {
    throw new Error("useCollaboration must be used within a CollaborationProvider");
  }

  return context;
}