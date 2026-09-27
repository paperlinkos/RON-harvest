import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { isSyncActive } from '../services/syncService';

interface HeaderProps {
  pendingCount: number;
  syncedCount: number;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({ pendingCount, syncedCount, onManualSync }) => {
  const { isOnline } = useNetworkStatus();
  const syncing = isSyncActive();

  return (
    <header className="header-container">
      <div className="header-brand">
        <h1 className="header-title">REACH OUT NIGERIA</h1>
        <p className="header-subtitle">Soul-Winning Campaign Platform</p>
      </div>

      <div className="header-actions">
        {isOnline ? (
          <div className="status-badge status-online" title="Connected to network">
            <Wifi size={14} className="icon-pulse" />
            <span>ONLINE</span>
          </div>
        ) : (
          <div className="status-badge status-offline" title="Offline mode active">
            <WifiOff size={14} />
            <span>OFFLINE — SAVING LOCALLY</span>
          </div>
        )}

        {pendingCount > 0 && isOnline && (
          <button
            onClick={onManualSync}
            disabled={syncing}
            className="sync-button"
            title="Sync pending records to cloud"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'SYNCING...' : `SYNC (${pendingCount})`}</span>
          </button>
        )}

        {pendingCount === 0 && syncedCount > 0 && isOnline && (
          <div className="status-badge status-synced-all">
            <CheckCircle2 size={14} />
            <span>ALL SYNCED</span>
          </div>
        )}
      </div>
    </header>
  );
};
