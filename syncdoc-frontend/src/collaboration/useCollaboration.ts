import { createContext, useContext } from "react";
import type { CollaborationState } from "./types";

export const CollaborationContext = createContext<CollaborationState | null>(null);

export function useCollaboration(): CollaborationState {
  const context = useContext(CollaborationContext);

  if (!context) {
    throw new Error("useCollaboration must be used within a CollaborationProvider");
  }

  return context;
}