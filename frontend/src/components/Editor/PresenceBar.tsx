import type { PeerUser } from '../../types/document';

interface LocalUser {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface Props {
  connected: boolean;
  peers: PeerUser[];
  localUser: LocalUser;
}

/**
 * Week 2 "Sync Implementation": renders live collaborative state —
 * connection status plus a presence dot per connected peer, along with
 * a note on which block each peer currently has focused/locked.
 */
export function PresenceBar({
  connected,
  peers,
  localUser,
}: Props) {
  return (
    <div className="presence-bar">
      <span
        className={`connection-dot ${
          connected ? 'online' : 'offline'
        }`}
      />

      <span className="connection-label">
        {connected ? 'Live' : 'Connecting…'}
      </span>

      <span
        className="presence-avatar"
        style={{ background: localUser.color }}
        title={`${localUser.name} (you)`}
      >
        {localUser.name[0]?.toUpperCase()}
      </span>

      {peers.map((peer) => (
        <span
          key={peer.clientId}
          className="presence-avatar"
          style={{ background: peer.color }}
          title={
            peer.editingBlockId
              ? `${peer.name} — editing a block`
              : peer.name
          }
        >
          {peer.name[0]?.toUpperCase()}
        </span>
      ))}

      {peers.length === 0 && (
        <span className="presence-empty">
          You're the only one here right now.
        </span>
      )}
    </div>
  );
}