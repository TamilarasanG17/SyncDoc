import { useEffect, useState } from "react";
import type { SyncStatus } from "../types";


export function useDocumentSync(documentId: string | undefined) {
  const [status] = useState<SyncStatus>("synced");

  useEffect(() => {
    // placeholder for the future WebSocket connection
  }, [documentId]);

  return { status };
}