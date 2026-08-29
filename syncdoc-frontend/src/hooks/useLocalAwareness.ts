import { useCallback, useEffect, useState } from "react";
import { useCollaboration } from "../collaboration/useCollaboration";
import { getLocalUser } from "../collaboration/localUser";

export function useLocalAwareness() {
  const { providerRef, status } = useCollaboration();
  const [localUser] = useState(getLocalUser);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;

    provider.awareness.setLocalStateField("user", localUser);
    provider.awareness.setLocalStateField("editingBlockId", null);

    return () => {
      provider.awareness.setLocalState(null);
    };
  }, [providerRef, status, localUser]);

  const setEditingBlock = useCallback(
    (blockId: string | null) => {
      providerRef.current?.awareness.setLocalStateField("editingBlockId", blockId);
    },
    [providerRef]
  );

  return { setEditingBlock, localUserId: localUser.id };
}