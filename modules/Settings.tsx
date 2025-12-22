import { useState, useEffect } from 'react';
import { useApp, useNotification, useDb } from '../context';
import { Header, CategorySelector } from '../components';
import { useSyncState, useCurrentUser, usePwaInstall, type SyncStatus } from '../hooks';
import { cloudDb } from '../utils/storage/db';

// Helper to get sync status display info
function getSyncStatusInfo(status: SyncStatus): { color: string; label: string; icon: string } {
    switch (status) {
        case 'local-only':
            return { color: 'bg-gray-500', label: 'Local-only mode', icon: 'cloud_off' };
        case 'connecting':
            return { color: 'bg-yellow-500', label: 'Connecting...', icon: 'cloud_sync' };
        case 'connected':
            return { color: 'bg-green-500', label: 'Connected', icon: 'cloud_done' };
        case 'syncing':
            return { color: 'bg-blue-500', label: 'Syncing...', icon: 'sync' };
        case 'disconnected':
            return { color: 'bg-orange-500', label: 'Disconnected', icon: 'cloud_off' };
        case 'offline':
            return { color: 'bg-amber-500', label: 'Offline', icon: 'wifi_off' };
        case 'error':
            return { color: 'bg-red-500', label: 'Sync error', icon: 'cloud_off' };
        default:
            return { color: 'bg-gray-500', label: 'Unknown', icon: 'help' };
    }
}

interface SettingSection {
    id: string;
    label: string;
    icon: string;
}

const SECTIONS: SettingSection[] = [
    { id: 'device', label: 'Device', icon: 'devices' },
    { id: 'behavior', label: 'Behavior', icon: 'tune' },
    { id: 'data', label: 'Data', icon: 'storage' },
    { id: 'about', label: 'About', icon: 'info' },
];

export function Settings() {
    const { deviceProfile, updateDeviceProfile } = useApp();
    const notify = useNotification();
    const db = useDb();
    const syncState = useSyncState();
    const currentUser = useCurrentUser();
    const pwaInstall = usePwaInstall();
    const [activeSection, setActiveSection] = useState('device');
    const [isClearingArchived, setIsClearingArchived] = useState(false);
    const [cloudUrlInput, setCloudUrlInput] = useState(deviceProfile.cloudUrl || '');

    const syncStatusInfo = getSyncStatusInfo(syncState.status);

    // Sync cloudUrlInput with deviceProfile changes
    useEffect(() => {
        setCloudUrlInput(deviceProfile.cloudUrl || '');
    }, [deviceProfile.cloudUrl]);

    const handleUpdateCloudUrl = async () => {
        const trimmedUrl = cloudUrlInput.trim();
        if (trimmedUrl === (deviceProfile.cloudUrl || '')) {
            return; // No change
        }

        try {
            await updateDeviceProfile({ cloudUrl: trimmedUrl || undefined });
            notify.success(trimmedUrl ? 'Cloud sync URL updated - reloading...' : 'Cloud sync disabled - reloading...');
            // Reload the page after a short delay so the notification is seen
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch {
            notify.error('Failed to update cloud URL');
        }
    };

    const handleLogin = async () => {
        try {
            // Check if cloud is properly configured
            if (!cloudDb.cloud.options?.databaseUrl) {
                notify.error('Cloud sync not configured. Try refreshing the page.');
                return;
            }
            // Trigger login flow - this will prompt for email via userInteraction
            await cloudDb.cloud.login();
        } catch (error: unknown) {
            console.error('Login error:', error);
            // Don't show error if user cancelled
            const err = error as { name?: string; message?: string };
            if (err.name !== 'AbortError') {
                notify.error('Failed to initiate login: ' + (err.message || 'Unknown error'));
            }
        }
    };

    const handleLogout = async () => {
        try {
            await cloudDb.cloud.logout();
            notify.success('Logged out successfully');
        } catch (error: unknown) {
            console.error('Logout error:', error);
            const err = error as { message?: string };
            notify.error('Failed to logout: ' + (err.message || 'Unknown error'));
        }
    };

    const handleClearArchived = async () => {
        if (!confirm('Are you sure you want to delete all archived items? This cannot be undone.')) {
            return;
        }

        setIsClearingArchived(true);
        try {
            const count = await db.clearArchived();
            notify.success(`Cleared ${count} archived items`);
        } catch {
            notify.error('Failed to clear archived items');
        } finally {
            setIsClearingArchived(false);
        }
    };

    const handleRunRetention = async () => {
        try {
            const count = await db.runRetentionCleanup(deviceProfile.retentionDays);
            notify.success(`Archived ${count} old items`);
        } catch {
            notify.error('Failed to run retention cleanup');
        }
    };

    return (
        <div className="min-h-[var(--app-vh)] bg-background-dark">
            <Header title="Settings" />

            <main className="pt-[var(--nav-height)] pb-[calc(var(--bottom-nav-height)+16px)] px-4">
                <div className="max-w-2xl mx-auto py-4">
                    <div className="flex gap-4">
                        {/* Sidebar navigation */}
                        <nav className="hidden sm:block w-48 flex-shrink-0">
                            <div className="sticky top-[calc(var(--nav-height)+16px)] space-y-1">
                                {SECTIONS.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-left
                                            transition-colors duration-150
                                            ${activeSection === section.id
                                                ? 'bg-primary/20 text-primary'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {section.icon}
                                        </span>
                                        <span className="text-sm font-medium">{section.label}</span>
                                    </button>
                                ))}
                            </div>
                        </nav>

                        {/* Mobile section tabs */}
                        <div className="sm:hidden w-full mb-4 overflow-x-auto">
                            <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-max min-w-full">
                                {SECTIONS.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`
                                            flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-md text-sm
                                            ${activeSection === section.id
                                                ? 'bg-primary text-white'
                                                : 'text-gray-400'
                                            }
                                        `}
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {section.icon}
                                        </span>
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Settings content */}
                    <div className="flex-1 space-y-6">
                        {/* Device section */}
                        {activeSection === 'device' && (
                            <div className="space-y-6">
                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">badge</span>
                                        Device Name
                                    </h3>
                                    <input
                                        type="text"
                                        value={deviceProfile.deviceName}
                                        onChange={(e) => updateDeviceProfile({ deviceName: e.target.value })}
                                        placeholder="My Device"
                                        className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/10 focus:border-primary outline-none"
                                    />
                                    <p className="text-sm text-gray-400">
                                        This name will be shown when you send items to other devices.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">category</span>
                                        Device Category
                                    </h3>
                                    <CategorySelector
                                        value={deviceProfile.category}
                                        onChange={(category) => updateDeviceProfile({ category })}
                                    />
                                    <p className="text-sm text-gray-400">
                                        Items targeted to a specific category will only appear on matching devices.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">share</span>
                                        Default Target
                                    </h3>
                                    <CategorySelector
                                        value={deviceProfile.defaultTargetCategory}
                                        onChange={(defaultTargetCategory) => updateDeviceProfile({ defaultTargetCategory })}
                                    />
                                    <p className="text-sm text-gray-400">
                                        Default target category when sending new items.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Behavior section */}
                        {activeSection === 'behavior' && (
                            <div className="space-y-6">
                                <div className="glass-card rounded-xl p-4">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-amber-400">
                                                work
                                            </span>
                                            <div>
                                                <span className="font-medium">Work Mode</span>
                                                <p className="text-sm text-gray-400">
                                                    Only allow sending URLs, block plain text
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={deviceProfile.workMode}
                                                onChange={(e) => updateDeviceProfile({ workMode: e.target.checked })}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-6 rounded-full transition-colors ${
                                                deviceProfile.workMode ? 'bg-amber-500' : 'bg-white/20'
                                            }`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                                                    deviceProfile.workMode ? 'translate-x-6' : 'translate-x-0.5'
                                                } mt-0.5`} />
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-blue-400">
                                                notifications_active
                                            </span>
                                            <div>
                                                <span className="font-medium">Browser Notifications</span>
                                                <p className="text-sm text-gray-400">
                                                    Get notified when new items arrive
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={deviceProfile.enableBrowserNotifications}
                                                onChange={async (e) => {
                                                    const enabled = e.target.checked;
                                                    if (enabled && 'Notification' in window) {
                                                        const permission = await Notification.requestPermission();
                                                        if (permission === 'granted') {
                                                            updateDeviceProfile({ enableBrowserNotifications: true });
                                                            notify.success('Browser notifications enabled');
                                                        } else {
                                                            notify.warning('Notification permission denied');
                                                        }
                                                    } else {
                                                        updateDeviceProfile({ enableBrowserNotifications: false });
                                                        notify.info('Browser notifications disabled');
                                                    }
                                                }}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-6 rounded-full transition-colors ${
                                                deviceProfile.enableBrowserNotifications ? 'bg-blue-500' : 'bg-white/20'
                                            }`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                                                    deviceProfile.enableBrowserNotifications ? 'translate-x-6' : 'translate-x-0.5'
                                                } mt-0.5`} />
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">schedule</span>
                                        Auto-Archive Retention
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="30"
                                            value={deviceProfile.retentionDays}
                                            onChange={(e) => updateDeviceProfile({ retentionDays: Number(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-medium w-20 text-right">
                                            {deviceProfile.retentionDays} days
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Items older than this will be automatically archived.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">key</span>
                                        Remember Passphrase
                                    </h3>
                                    <select
                                        value={deviceProfile.rememberPassphrase}
                                        onChange={(e) => updateDeviceProfile({ 
                                            rememberPassphrase: e.target.value as 'off' | 'session' | 'device' 
                                        })}
                                        className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/10 focus:border-primary outline-none"
                                    >
                                        <option value="off">Never (always ask)</option>
                                        <option value="session">For this session only</option>
                                    </select>
                                    <p className="text-sm text-gray-400">
                                        Whether to remember the passphrase for encrypted items.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Data section */}
                        {activeSection === 'data' && (
                            <div className="space-y-6">
                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">cloud</span>
                                        Cloud Sync URL
                                    </h3>
                                    <div className="space-y-2">
                                        <input
                                            type="url"
                                            value={cloudUrlInput}
                                            onChange={(e) => setCloudUrlInput(e.target.value)}
                                            onBlur={handleUpdateCloudUrl}
                                            placeholder="https://your-dexie-cloud.example.com/db123abc"
                                            className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/10 focus:border-primary outline-none font-mono"
                                        />
                                        {cloudUrlInput !== (deviceProfile.cloudUrl || '') && (
                                            <button
                                                onClick={handleUpdateCloudUrl}
                                                className="text-sm text-primary hover:text-primary/80"
                                            >
                                                Save changes
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Enter your Dexie Cloud database URL to enable cross-device sync. Leave empty to use local-only mode.
                                    </p>
                                    {deviceProfile.cloudUrl && (
                                        <button
                                            onClick={() => {
                                                setCloudUrlInput('');
                                                updateDeviceProfile({ cloudUrl: undefined });
                                                notify.info('Cloud sync disabled');
                                            }}
                                            className="text-sm text-red-400 hover:text-red-300"
                                        >
                                            Clear and disable sync
                                        </button>
                                    )}
                                </div>

                                {deviceProfile.cloudUrl && (
                                    <div className="glass-card rounded-xl p-4 space-y-4">
                                        <h3 className="font-medium flex items-center gap-2">
                                            <span className="material-symbols-outlined">person</span>
                                            Authentication
                                        </h3>
                                        
                                        {currentUser?.isLoggedIn ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-green-300">Logged In</p>
                                                        <p className="text-sm text-gray-400">{currentUser.email || currentUser.userId}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full px-4 py-2.5 min-h-[44px] bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                                    <span className="material-symbols-outlined text-yellow-400">warning</span>
                                                    <p className="text-sm text-gray-300">Not logged in. Login to sync with user identity across devices.</p>
                                                </div>
                                                <button
                                                    onClick={handleLogin}
                                                    className="w-full px-4 py-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors"
                                                >
                                                    Login with Email
                                                </button>
                                            </div>
                                        )}
                                        
                                        <p className="text-xs text-gray-500">
                                            Authentication allows you to sync items across devices using your email identity.
                                        </p>
                                    </div>
                                )}

                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">cloud_sync</span>
                                        Sync Status
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${syncStatusInfo.color} ${
                                            syncState.status === 'syncing' || syncState.status === 'connecting'
                                                ? 'animate-pulse'
                                                : ''
                                        }`} />
                                        <span className="material-symbols-outlined text-lg text-gray-400">
                                            {syncStatusInfo.icon}
                                        </span>
                                        <span className="text-gray-300">{syncStatusInfo.label}</span>
                                    </div>
                                    {syncState.isCloudEnabled ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-400">
                                                Connected to Dexie Cloud. Items sync automatically across devices.
                                            </p>
                                            {syncState.lastSyncTime && (
                                                <p className="text-xs text-gray-500">
                                                    Last synced: {new Date(syncState.lastSyncTime).toLocaleTimeString()}
                                                </p>
                                            )}
                                            {syncState.error && (
                                                <p className="text-xs text-red-400">
                                                    Error: {syncState.error}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            Data is stored locally on this device. Configure a Cloud Sync URL above to enable cross-device sync.
                                        </p>
                                    )}
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">auto_delete</span>
                                        Run Retention Now
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Archive items older than {deviceProfile.retentionDays} days.
                                    </p>
                                    <button
                                        onClick={handleRunRetention}
                                        className="px-4 py-2.5 min-h-[44px] bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                                    >
                                        Run Cleanup
                                    </button>
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2 text-red-400">
                                        <span className="material-symbols-outlined">delete_forever</span>
                                        Clear Archived Items
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Permanently delete all archived items. This cannot be undone.
                                    </p>
                                    <button
                                        onClick={handleClearArchived}
                                        disabled={isClearingArchived}
                                        className="px-4 py-2.5 min-h-[44px] bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {isClearingArchived ? 'Clearing...' : 'Clear Archived'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* About section */}
                        {activeSection === 'about' && (
                            <div className="space-y-6">
                                <div className="glass-card rounded-xl p-6 text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-4xl text-primary">
                                            swap_horiz
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Handoff Lite</h2>
                                    <p className="text-gray-400 mb-4">Version 0.1.0</p>
                                    <p className="text-sm text-gray-400 max-w-md mx-auto">
                                        A minimal, cross-device inbox for URLs and text with 
                                        device targeting and optional end-to-end encryption.
                                    </p>
                                </div>

                                {/* Install App card */}
                                <div className="glass-card rounded-xl p-4 space-y-3">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined">install_desktop</span>
                                        Install App
                                    </h3>
                                    {pwaInstall.isInstalled ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                            <span className="material-symbols-outlined text-green-400">check_circle</span>
                                            <p className="text-sm text-gray-300">App is installed on this device</p>
                                        </div>
                                    ) : pwaInstall.canInstall ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-400">
                                                Install Handoff Lite for quick access from your desktop or taskbar.
                                            </p>
                                            <button
                                                onClick={async () => {
                                                    const accepted = await pwaInstall.promptInstall();
                                                    if (accepted) {
                                                        notify.success('App installed successfully!');
                                                    }
                                                }}
                                                className="w-full px-4 py-3 min-h-[44px] bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined">download</span>
                                                Install Handoff Lite
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            Open this app in Chrome, Edge, or another compatible browser to enable installation.
                                        </p>
                                    )}
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-3">
                                    <h3 className="font-medium">Features</h3>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                            Send URLs and text between devices
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                            Device targeting (Work/Private/Any)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                            Optional AES-256-GCM encryption
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                            Offline-first with IndexedDB
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                            Optional Dexie Cloud sync
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                            Status tracking (New → Done → Archived)
                                        </li>
                                    </ul>
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-3">
                                    <h3 className="font-medium">Device ID</h3>
                                    <code className="block text-xs text-gray-400 bg-black/20 p-2 rounded break-all">
                                        {deviceProfile.deviceId}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
