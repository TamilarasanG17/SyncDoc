import { useEffect, useState } from "react";
import { useCollaboration } from "../collaboration/useCollaboration";
import type { AwarenessState } from "../collaboration/awareness";

export interface AwarenessEntry {
  clientId: number;
  state: Partial<AwarenessState>;
}

export function useAwarenessStates(): AwarenessEntry[] {
  const { providerRef, status } = useCollaboration();
  const [entries, setEntries] = useState<AwarenessEntry[]>([]);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;

    const handleChange = () => {
      const next: AwarenessEntry[] = [];
      provider.awareness.getStates().forEach((rawState, clientId) => {
        next.push({ clientId, state: rawState as Partial<AwarenessState> });
      });
      setEntries(next);
    };

    provider.awareness.on("change", handleChange);

    return () => {
      provider.awareness.off("change", handleChange);
    };
  }, [providerRef, status]);

  return entries;
}