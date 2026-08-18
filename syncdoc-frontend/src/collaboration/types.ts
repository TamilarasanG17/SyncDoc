import type { Doc } from "yjs";
import type { WebsocketProvider } from "y-websocket";

export type CollaborationStatus = "connecting" | "connected" | "disconnected" | "error";

export interface CollaborationState {
  status: CollaborationStatus;
  ydoc: Doc;
  provider: WebsocketProvider | null;
}