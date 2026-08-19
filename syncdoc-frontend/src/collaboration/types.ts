import type { RefObject } from "react";
import type { Doc } from "yjs";
import type { WebsocketProvider } from "y-websocket";

export type CollaborationStatus = "connecting" | "connected" | "disconnected" | "error";

export interface CollaborationState {
  status: CollaborationStatus;
  ydoc: Doc;
  providerRef: RefObject<WebsocketProvider | null>;
}