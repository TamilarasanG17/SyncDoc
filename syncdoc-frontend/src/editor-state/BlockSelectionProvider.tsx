

import type { ReactNode } from "react";

interface BlockSelectionProviderProps {
  children: ReactNode;
}

function BlockSelectionProvider({
  children,
}: BlockSelectionProviderProps) {
  return <>{children}</>;
}

export default BlockSelectionProvider;