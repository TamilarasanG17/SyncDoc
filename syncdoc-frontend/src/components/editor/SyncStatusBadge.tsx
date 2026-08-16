import type { SyncStatus } from "../../types";

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

const statusLabels: Record<SyncStatus, string> = {
  synced: "Saved",
  syncing: "Saving...",
  offline: "Offline",
  error: "Sync error",
};

function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  return <span className={`sync-status sync-status-${status}`}>{statusLabels[status]}</span>;
}

export default SyncStatusBadge;