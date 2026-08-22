import { usePresence } from "../../hooks/usePresence";

interface PresenceBarProps {
  localUserId: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PresenceBar({ localUserId }: PresenceBarProps) {
  const collaborators = usePresence(localUserId);

  if (collaborators.length === 0) return null;

  return (
    <div className="presence-bar">
      {collaborators.map((entry) => (
        <div
          key={entry.user.id}
          className="presence-avatar"
          style={{ backgroundColor: entry.user.color }}
          title={`${entry.isSelf ? "You" : entry.user.name} — ${
            entry.editingBlockId ? "editing" : "viewing"
          }`}
        >
          {initials(entry.user.name)}
          {entry.editingBlockId && <span className="presence-dot" />}
        </div>
      ))}
    </div>
  );
}

export default PresenceBar;