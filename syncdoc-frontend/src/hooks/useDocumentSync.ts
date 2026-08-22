import type { SyncStatus } from "../types";
import { useCollaboration } from "../collaboration/useCollaboration";
import type { CollaborationStatus } from "../collaboration/types";

const statusMap: Record<CollaborationStatus, SyncStatus> = {
  connecting: "syncing",
  connected: "synced",
  disconnected: "offline",
  error: "error",
};

export function useDocumentSync() {
  const { status } = useCollaboration();
  return { status: statusMap[status] };
}