import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WebsocketProvider } from "y-websocket";

import { getYDoc } from "./ydoc";
import { WEBSOCKET_URL } from "./config";
import { CollaborationContext } from "./useCollaboration";
import type { CollaborationState, CollaborationStatus } from "./types";

interface CollaborationProviderProps {
  documentId: string;
  children: ReactNode;
}

export function CollaborationProvider({ documentId, children }: CollaborationProviderProps) {
  const ydoc = useMemo(() => getYDoc(documentId), [documentId]);
  const [status, setStatus] = useState<CollaborationStatus>("connecting");
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(WEBSOCKET_URL, documentId, ydoc);
    providerRef.current = wsProvider;

    // ---- ADD THIS BLOCK ----
    if (import.meta.env.DEV) {
      (window as unknown as { __ydoc?: typeof ydoc }).__ydoc = ydoc;
    }
    // -------------------------

    const handleStatus = ({ status: nextStatus }: { status: string }) => {
      setStatus(nextStatus as CollaborationStatus);
    };

    wsProvider.on("status", handleStatus);

    return () => {
      wsProvider.off("status", handleStatus);
      wsProvider.destroy();
      providerRef.current = null;
    };
  }, [documentId, ydoc]);

  const value: CollaborationState = { status, ydoc, providerRef };

  return (
    <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>
  );
}