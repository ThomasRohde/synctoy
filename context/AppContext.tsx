import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from 'react';
import type { DeviceProfile, Route, InboxFilter, SharePayload } from '../types';
import { db, DEFAULT_DEVICE_PROFILE } from '../utils/storage/db';
import { parseShareParams } from '../utils/url';

interface AppContextValue {
    // Navigation
    route: Route;
    navigate: (route: Route) => void;

    // Device profile
    deviceProfile: DeviceProfile;
    updateDeviceProfile: (updates: Partial<DeviceProfile>) => Promise<void>;
    isLoading: boolean;

    // Inbox filter
    inboxFilter: InboxFilter;
    setInboxFilter: (filter: InboxFilter) => void;

    // Share payload (from external share)
    sharePayload: SharePayload | null;
    setSharePayload: (payload: SharePayload | null) => void;
    clearSharePayload: () => void;

    // Passphrase (session-only, never persisted)
    sessionPassphrase: string | null;
    setSessionPassphrase: (passphrase: string | null) => void;

    // Refresh trigger
    refreshItems: () => void;
    refreshTrigger: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [route, setRoute] = useState<Route>('inbox');
    const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>(DEFAULT_DEVICE_PROFILE);
    const [isLoading, setIsLoading] = useState(true);
    const [inboxFilter, setInboxFilter] = useState<InboxFilter>('active');
    const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
    const [sessionPassphrase, setSessionPassphrase] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Initialize app
    useEffect(() => {
        const init = async () => {
            try {
                // Initialize device and get profile
                const profile = await db.initializeDevice();
                setDeviceProfile(profile);

                // Initialize cloud URL from profile
                if (profile.cloudUrl) {
                    await db.updateCloudUrl(profile.cloudUrl);
                }

                // Check for share params in URL
                const search = window.location.search;
                const hash = window.location.hash;

                if (search || hash.includes('?')) {
                    const queryString = search || hash.split('?')[1] || '';
                    const params = parseShareParams(queryString);
                    if (params.content) {
                        setSharePayload({
                            content: params.content,
                            title: params.title,
                            category: params.category as DeviceProfile['category'],
                            sensitive: params.sensitive,
                        });
                        setRoute('send');
                    }
                }

                // Check if path indicates share route
                if (window.location.pathname.includes('/share')) {
                    setRoute('send');
                }

                // Navigate to setup if not complete
                if (!profile.isSetupComplete) {
                    setRoute('setup');
                }

                // Run retention cleanup
                if (profile.retentionDays > 0) {
                    await db.runRetentionCleanup(profile.retentionDays);
                }
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    // Update device profile
    const updateDeviceProfile = useCallback(async (updates: Partial<DeviceProfile>) => {
        const newProfile = { ...deviceProfile, ...updates };
        setDeviceProfile(newProfile);
        await db.saveDeviceProfile(newProfile);
        
        // If cloudUrl changed, update the database connection
        if ('cloudUrl' in updates) {
            await db.updateCloudUrl(updates.cloudUrl);
        }
    }, [deviceProfile]);

    // Navigation with hash-based routing
    const navigate = useCallback((newRoute: Route) => {
        setRoute(newRoute);
        // Update URL hash for deep linking
        if (newRoute !== 'setup') {
            window.location.hash = newRoute;
        }
    }, []);

    // Listen for hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1) as Route;
            if (['inbox', 'send', 'settings', 'share'].includes(hash)) {
                setRoute(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const clearSharePayload = useCallback(() => {
        setSharePayload(null);
    }, []);

    const refreshItems = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return (
        <AppContext.Provider
            value={{
                route,
                navigate,
                deviceProfile,
                updateDeviceProfile,
                isLoading,
                inboxFilter,
                setInboxFilter,
                sharePayload,
                setSharePayload,
                clearSharePayload,
                sessionPassphrase,
                setSessionPassphrase,
                refreshItems,
                refreshTrigger,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
