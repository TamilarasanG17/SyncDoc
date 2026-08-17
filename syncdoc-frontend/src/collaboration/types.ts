import type { Doc } from "yjs";

export type CollaborationStatus = "disconnected" | "connecting" | "connected" | "error";

export interface CollaborationState {
  status: CollaborationStatus;
  ydoc: Doc;
}