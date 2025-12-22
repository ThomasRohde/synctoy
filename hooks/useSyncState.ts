import { useState, useEffect } from 'react';
import { cloudDb, db } from '../utils/storage/db';

export type SyncStatus = 'local-only' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'syncing';

export interface SyncState {
    status: SyncStatus;
    isCloudEnabled: boolean;
    lastSyncTime: number | null;
    error: string | null;
}

export function useSyncState(): SyncState {
    const [state, setState] = useState<SyncState>({
        status: db.isCloudEnabled ? 'connecting' : 'local-only',
        isCloudEnabled: db.isCloudEnabled,
        lastSyncTime: null,
        error: null,
    });

    useEffect(() => {
        // Update cloud enabled status
        const isCloudEnabled = db.isCloudEnabled;
        setState(prev => ({
            ...prev,
            isCloudEnabled,
            status: isCloudEnabled ? prev.status : 'local-only',
        }));

        // If cloud is not enabled, stay in local-only mode
        if (!isCloudEnabled) {
            return;
        }

        // Subscribe to WebSocket status for connection state
        const wsSubscription = cloudDb.cloud.webSocketStatus.subscribe({
            next: (wsStatus) => {
                let status: SyncStatus;
                switch (wsStatus) {
                    case 'connecting':
                        status = 'connecting';
                        break;
                    case 'connected':
                        status = 'connected';
                        break;
                    case 'disconnected':
                        status = 'disconnected';
                        break;
                    case 'error':
                        status = 'error';
                        break;
                    default:
                        status = 'disconnected';
                }
                setState(prev => ({ ...prev, status, error: null }));
            },
            error: (err) => {
                setState(prev => ({
                    ...prev,
                    status: 'error',
                    error: err?.message || 'Connection error',
                }));
            },
        });

        // Subscribe to sync state for sync activity
        const syncSubscription = cloudDb.cloud.syncState.subscribe({
            next: (syncState) => {
                if (syncState.phase === 'pushing' || syncState.phase === 'pulling') {
                    setState(prev => ({ ...prev, status: 'syncing' }));
                } else if (syncState.phase === 'in-sync') {
                    setState(prev => ({
                        ...prev,
                        status: 'connected',
                        lastSyncTime: Date.now(),
                    }));
                }
            },
        });

        return () => {
            wsSubscription.unsubscribe();
            syncSubscription.unsubscribe();
        };
    }, [db.isCloudEnabled]); // Re-run when cloud status changes

    return state;
}
