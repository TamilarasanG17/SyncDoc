import type { LocalUser } from "./localUser";

export interface AwarenessState {
  user: LocalUser;
  editingBlockId: string | null;
}