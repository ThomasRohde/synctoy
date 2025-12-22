import { useState, useEffect } from 'react';
import { cloudDb, db } from '../utils/storage/db';

export type SyncStatus = 'local-only' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'syncing' | 'offline';

export interface SyncState {
    status: SyncStatus;
    isCloudEnabled: boolean;
    lastSyncTime: number | null;
    error: string | null;
}

export function useSyncState(): SyncState {
    const [state, setState] = useState<SyncState>(() => ({
        status: db.isCloudEnabled ? 'connecting' : 'local-only',
        isCloudEnabled: db.isCloudEnabled,
        lastSyncTime: null,
        error: null,
    }));

    const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        // Check if cloud is enabled
        const isCloudEnabled = db.isCloudEnabled;
        
        // If cloud is not enabled, stay in local-only mode
        if (!isCloudEnabled) {
            setState({
                status: 'local-only',
                isCloudEnabled: false,
                lastSyncTime: null,
                error: null,
            });
            return;
        }

        // Subscribe to syncState observable
        const syncSubscription = cloudDb.cloud.syncState.subscribe({
            next: (syncState: any) => {
                let status: SyncStatus;
                const error = syncState.error?.message || null;

                // Check offline first
                if (!isOnline || syncState.status === 'offline') {
                    status = 'offline';
                } else if (syncState.status === 'error' || syncState.phase === 'error') {
                    status = 'error';
                } else if (syncState.phase === 'pushing' || syncState.phase === 'pulling') {
                    status = 'syncing';
                } else if (syncState.phase === 'in-sync') {
                    status = 'connected';
                } else {
                    // For 'not-in-sync' or other phases, check if we have a logged in user
                    status = 'connected'; // Show connected if cloud is configured
                }

                setState(prev => ({
                    ...prev,
                    status,
                    isCloudEnabled: true,
                    error,
                    lastSyncTime: syncState.phase === 'in-sync' ? Date.now() : prev.lastSyncTime,
                }));
            },
            error: (err: any) => {
                setState(prev => ({
                    ...prev,
                    status: 'error',
                    error: err?.message || 'Connection error',
                }));
            },
        });

        // Also check current user to determine connection state
        const userSubscription = cloudDb.cloud.currentUser.subscribe({
            next: (user: any) => {
                if (user?.isLoggedIn) {
                    // User is logged in, we can consider ourselves connected
                    setState(prev => {
                        // Only update if not actively syncing or errored
                        if (prev.status === 'connecting' || prev.status === 'disconnected') {
                            return { ...prev, status: 'connected' };
                        }
                        return prev;
                    });
                }
            },
        });

        return () => {
            syncSubscription.unsubscribe();
            userSubscription.unsubscribe();
        };
    }, [isOnline]);

    return state;
}
