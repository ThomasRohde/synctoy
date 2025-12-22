import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface ServiceWorkerState {
    needsRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: () => Promise<void>;
}

/**
 * Hook to manage PWA service worker registration and updates.
 * Uses 'autoUpdate' strategy - updates are applied automatically.
 */
export function useServiceWorker(): ServiceWorkerState {
    const [needsRefresh, setNeedsRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

    useEffect(() => {
        // Register service worker with update callbacks
        const updateServiceWorker = registerSW({
            immediate: true,
            onNeedRefresh() {
                // With autoUpdate, this triggers automatic refresh
                console.info('[SW] New content available, refreshing...');
                setNeedsRefresh(true);
            },
            onOfflineReady() {
                // App is ready to work offline
                console.info('[SW] App ready for offline use');
                setOfflineReady(true);
            },
            onRegisteredSW(swUrl, registration) {
                // Check for updates periodically (every 30 seconds)
                if (registration) {
                    setInterval(() => {
                        console.info('[SW] Checking for updates...');
                        registration.update();
                    }, 30 * 1000);
                }
                console.info('[SW] Registered:', swUrl);
            },
            onRegisterError(error) {
                console.error('[SW] Registration error:', error);
            },
        });

        setUpdateSW(() => updateServiceWorker);
    }, []);

    const updateServiceWorker = useCallback(async () => {
        if (updateSW) {
            await updateSW();
            // The page will reload automatically after skipWaiting
        }
    }, [updateSW]);

    return {
        needsRefresh,
        offlineReady,
        updateServiceWorker,
    };
}
