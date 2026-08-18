import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    setStatus("connecting");

    const wsProvider = new WebsocketProvider(WEBSOCKET_URL, documentId, ydoc);

    const handleStatus = ({ status: nextStatus }: { status: string }) => {
      setStatus(nextStatus as CollaborationStatus);
    };

    wsProvider.on("status", handleStatus);
    setProvider(wsProvider);

    return () => {
      wsProvider.off("status", handleStatus);
      wsProvider.destroy();
      setProvider(null);
    };
  }, [documentId, ydoc]);

  const value: CollaborationState = { status, ydoc, provider };

  return (
    <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>
  );
}