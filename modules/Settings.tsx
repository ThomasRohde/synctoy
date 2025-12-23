import { useState, useEffect } from 'react';
import {
    Smartphone,
    SlidersHorizontal,
    Database,
    Info,
    Tag,
    Folder,
    Share2,
    Briefcase,
    Bell,
    Clock,
    Key,
    Cloud,
    CloudOff,
    CloudSync,
    CloudCheck,
    RotateCw,
    WifiOff,
    HelpCircle,
    User,
    CheckCircle,
    AlertTriangle,
    Trash2,
    AlertCircle,
    ArrowLeftRight,
    Terminal,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
} from 'lucide-react';
import { useApp, useNotification, useDb } from '../context';
import { Header, CategorySelector } from '../components';
import { useSyncState, useCurrentUser, useClipboard, type SyncStatus } from '../hooks';
import { cloudDb } from '../utils/storage/db';

// Helper to get sync status display info
function getSyncStatusInfo(status: SyncStatus): { color: string; label: string; icon: typeof CloudOff } {
    switch (status) {
        case 'local-only':
            return { color: 'bg-gray-500', label: 'Local-only mode', icon: CloudOff };
        case 'connecting':
            return { color: 'bg-yellow-500', label: 'Connecting...', icon: CloudSync };
        case 'connected':
            return { color: 'bg-green-500', label: 'Connected', icon: CloudCheck };
        case 'syncing':
            return { color: 'bg-blue-500', label: 'Syncing...', icon: RotateCw };
        case 'disconnected':
            return { color: 'bg-orange-500', label: 'Disconnected', icon: CloudOff };
        case 'offline':
            return { color: 'bg-amber-500', label: 'Offline', icon: WifiOff };
        case 'error':
            return { color: 'bg-red-500', label: 'Sync error', icon: CloudOff };
        default:
            return { color: 'bg-gray-500', label: 'Unknown', icon: HelpCircle };
    }
}

interface SettingSection {
    id: string;
    label: string;
    icon: typeof Smartphone;
}

const SECTIONS: SettingSection[] = [
    { id: 'device', label: 'Device', icon: Smartphone },
    { id: 'behavior', label: 'Behavior', icon: SlidersHorizontal },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
];

export function Settings() {
    const { deviceProfile, updateDeviceProfile } = useApp();
    const notify = useNotification();
    const db = useDb();
    const syncState = useSyncState();
    const currentUser = useCurrentUser();
    const clipboard = useClipboard();
    const [activeSection, setActiveSection] = useState('device');
    const [isClearingArchived, setIsClearingArchived] = useState(false);
    const [cloudUrlInput, setCloudUrlInput] = useState(deviceProfile.cloudUrl || '');
    const [isApiDocsExpanded, setIsApiDocsExpanded] = useState(false);
    const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

    const syncStatusInfo = getSyncStatusInfo(syncState.status);
    
    // Get configured database URL for API examples
    const configuredDbUrl = cloudDb.cloud.options?.databaseUrl || deviceProfile.cloudUrl || 'https://<your-db>.dexie.cloud';
    
    // Handle copy with visual feedback
    const handleCopyCode = async (code: string, blockId: string) => {
        const success = await clipboard.copy(code);
        if (success) {
            setCopiedBlock(blockId);
            notify.success('Copied to clipboard');
            setTimeout(() => setCopiedBlock(null), 2000);
        }
    };

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
                <div className="max-w-4xl mx-auto py-4">
                    {/* Mobile section tabs */}
                    <div className="sm:hidden mb-4 overflow-x-auto -mx-4 px-4">
                        <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-max min-w-full">
                            {SECTIONS.map(section => {
                                const IconComponent = section.icon;
                                return (
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
                                        <IconComponent className="w-4 h-4" />
                                        {section.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-6">
                        {/* Sidebar navigation - desktop only */}
                        <nav className="hidden sm:block w-48 flex-shrink-0">
                            <div className="sticky top-[calc(var(--nav-height)+16px)] space-y-1">
                                {SECTIONS.map(section => {
                                    const IconComponent = section.icon;
                                    return (
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
                                            <IconComponent className="w-4 h-4" />
                                            <span className="text-sm font-medium">{section.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Settings content */}
                        <div className="flex-1 space-y-6 min-w-0">
                        {/* Device section */}
                        {activeSection === 'device' && (
                            <div className="space-y-6">
                                <div className="glass-card rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
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
                                        <Folder className="w-4 h-4" />
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
                                        <Share2 className="w-4 h-4" />
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
                                            <Briefcase className="w-5 h-5 text-amber-400" />
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
                                            <Bell className="w-5 h-5 text-blue-400" />
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
                                        <Clock className="w-4 h-4" />
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
                                        <Key className="w-4 h-4" />
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
                                        <Cloud className="w-4 h-4" />
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
                                            <User className="w-4 h-4" />
                                            Authentication
                                        </h3>
                                        
                                        {currentUser?.isLoggedIn ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                                    <CheckCircle className="w-5 h-5 text-green-400" />
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
                                                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
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
                                        <CloudSync className="w-4 h-4" />
                                        Sync Status
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${syncStatusInfo.color} ${
                                            syncState.status === 'syncing' || syncState.status === 'connecting'
                                                ? 'animate-pulse'
                                                : ''
                                        }`} />
                                        {(() => {
                                            const SyncIcon = syncStatusInfo.icon;
                                            return <SyncIcon className="w-5 h-5 text-gray-400" />;
                                        })()}
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
                                        <AlertCircle className="w-4 h-4" />
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
                                        <Trash2 className="w-4 h-4" />
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
                                        <ArrowLeftRight className="w-10 h-10 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Handoff Lite</h2>
                                    <p className="text-gray-400 mb-4">Version 0.1.0</p>
                                    <p className="text-sm text-gray-400 max-w-md mx-auto">
                                        A minimal, cross-device inbox for URLs and text with 
                                        device targeting and optional end-to-end encryption.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4 space-y-3">
                                    <h3 className="font-medium">Features</h3>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Send URLs and text between devices
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Device targeting (Work/Private/Any)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Optional AES-256-GCM encryption
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Offline-first with IndexedDB
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Optional Dexie Cloud sync
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Status tracking (New → Done → Archived)
                                        </li>
                                    </ul>
                                </div>

                                {/* API Documentation - Only show when logged in */}
                                {currentUser?.isLoggedIn && (
                                    <div className="glass-card rounded-xl p-4 space-y-4">
                                        <button
                                            onClick={() => setIsApiDocsExpanded(!isApiDocsExpanded)}
                                            className="w-full flex items-center justify-between text-left group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Terminal className="w-4 h-4" />
                                                <h3 className="font-medium">Send Items via REST API</h3>
                                            </div>
                                            {isApiDocsExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                            )}
                                        </button>

                                        {isApiDocsExpanded && (
                                            <div className="space-y-4 pt-2 max-h-96 overflow-y-auto">
                                                <p className="text-sm text-gray-400">
                                                    SyncToy stores items locally in Dexie (IndexedDB) and can optionally sync them via Dexie Cloud. 
                                                    When Dexie Cloud is connected, you can also insert items from outside the app (for example from a terminal) 
                                                    by calling the Dexie Cloud REST API. The PWA will then sync the new items automatically.
                                                </p>

                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                                        Prerequisites
                                                    </h4>
                                                    <ul className="text-sm text-gray-400 space-y-1.5 list-disc list-inside">
                                                        <li>Your database URL: <code className="text-xs bg-black/20 px-1 py-0.5 rounded">{configuredDbUrl}</code></li>
                                                        <li>Dexie Cloud API client credentials from <code className="text-xs bg-black/20 px-1 py-0.5 rounded">dexie-cloud.key</code> file:
                                                            <div className="ml-6 mt-1 text-xs">
                                                                <div>• <code className="bg-black/20 px-1 py-0.5 rounded">client_id</code>: Found on line 2 of dexie-cloud.key</div>
                                                                <div>• <code className="bg-black/20 px-1 py-0.5 rounded">client_secret</code>: Found on line 3 of dexie-cloud.key</div>
                                                            </div>
                                                        </li>
                                                        <li className="text-amber-400">⚠️ Never commit <code className="text-xs bg-black/20 px-1 py-0.5 rounded">dexie-cloud.key</code> to git or expose in frontend code</li>
                                                    </ul>
                                                </div>

                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">Step 1: Get Access Token</h4>
                                                    <p className="text-sm text-gray-400">
                                                        Request a token using client credentials. For terminal usage, you'll typically use <code className="text-xs bg-black/20 px-1 py-0.5 rounded">grant_type: "client_credentials"</code>.
                                                    </p>
                                                    <div className="relative">
                                                        <pre className="text-xs bg-black/40 p-3 rounded-lg overflow-x-auto border border-white/10 text-gray-300">{`DB_URL="${configuredDbUrl}"
CLIENT_ID="<from dexie-cloud.key>"
CLIENT_SECRET="<from dexie-cloud.key>"

TOKEN="$(curl -s "$DB_URL/token" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"grant_type\\": \\"client_credentials\\",
    \\"scopes\\": [\\"ACCESS_DB\\",\\"GLOBAL_READ\\",\\"GLOBAL_WRITE\\"],
    \\"client_id\\": \\"$CLIENT_ID\\",
    \\"client_secret\\": \\"$CLIENT_SECRET\\"
  }" | jq -r .accessToken)"`}</pre>
                                                        <button
                                                            onClick={() => handleCopyCode(
                                                                `DB_URL="${configuredDbUrl}"\nCLIENT_ID="<from dexie-cloud.key>"\nCLIENT_SECRET="<from dexie-cloud.key>"\n\nTOKEN="$(curl -s "$DB_URL/token" \\\n  -H "Content-Type: application/json" \\\n  -d "{\n    \\"grant_type\\": \\"client_credentials\\",\n    \\"scopes\\": [\\"ACCESS_DB\\",\\"GLOBAL_READ\\",\\"GLOBAL_WRITE\\"],\n    \\"client_id\\": \\"$CLIENT_ID\\",\n    \\"client_secret\\": \\"$CLIENT_SECRET\\"\n  }" | jq -r .accessToken)"`,
                                                                'token'
                                                            )}
                                                            className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                                                            title="Copy to clipboard"
                                                        >
                                                            {copiedBlock === 'token' ? (
                                                                <Check className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">Step 2: Insert Items</h4>
                                                    <p className="text-sm text-gray-400">
                                                        POST items to <code className="text-xs bg-black/20 px-1 py-0.5 rounded">/all/handoffItems</code> with <code className="text-xs bg-black/20 px-1 py-0.5 rounded">realmId</code> and <code className="text-xs bg-black/20 px-1 py-0.5 rounded">owner</code> set to the target user's email.
                                                    </p>

                                                    <div className="space-y-2">
                                                        <h5 className="text-xs font-medium text-gray-300">URL Item Example:</h5>
                                                        <div className="relative">
                                                            <pre className="text-xs bg-black/40 p-3 rounded-lg overflow-x-auto border border-white/10 text-gray-300">{`USER_EMAIL="${currentUser?.email || '<your-email>'}"

curl -s "$DB_URL/all/handoffItems" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "url",
    "status": "new",
    "realmId": "'$USER_EMAIL'",
    "owner": "'$USER_EMAIL'",
    "content": {
      "url": "https://example.com"
    },
    "title": "Example Website",
    "senderDeviceName": "API Script",
    "senderCategory": "any",
    "targetCategory": "any",
    "isSensitive": false,
    "createdAt": '"$(date +%s)000"',
    "updatedAt": '"$(date +%s)000"'
  }'`}</pre>
                                                            <button
                                                                onClick={() => handleCopyCode(
                                                                    `USER_EMAIL="${currentUser?.email || '<your-email>'}"\n\ncurl -s "$DB_URL/all/handoffItems" \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "kind": "url",\n    "status": "new",\n    "realmId": "'\$USER_EMAIL'",\n    "owner": "'\$USER_EMAIL'",\n    "content": {\n      "url": "https://example.com"\n    },\n    "title": "Example Website",\n    "senderDeviceName": "API Script",\n    "senderCategory": "any",\n    "targetCategory": "any",\n    "isSensitive": false,\n    "createdAt": $(date +%s)000,\n    "updatedAt": $(date +%s)000\n  }'`,
                                                                    'url-item'
                                                                )}
                                                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                                                                title="Copy to clipboard"
                                                            >
                                                                {copiedBlock === 'url-item' ? (
                                                                    <Check className="w-4 h-4 text-green-400" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h5 className="text-xs font-medium text-gray-300">Text Item Example:</h5>
                                                        <div className="relative">
                                                            <pre className="text-xs bg-black/40 p-3 rounded-lg overflow-x-auto border border-white/10 text-gray-300">{`USER_EMAIL="${currentUser?.email || '<your-email>'}"

curl -s "$DB_URL/all/handoffItems" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "text",
    "status": "new",
    "realmId": "'$USER_EMAIL'",
    "owner": "'$USER_EMAIL'",
    "content": {
      "text": "Remember to check X before Y"
    },
    "title": "Quick Note",
    "senderDeviceName": "API Script",
    "senderCategory": "any",
    "targetCategory": "any",
    "isSensitive": false,
    "createdAt": '"$(date +%s)000"',
    "updatedAt": '"$(date +%s)000"'
  }'`}</pre>
                                                            <button
                                                                onClick={() => handleCopyCode(
                                                                    `USER_EMAIL="${currentUser?.email || '<your-email>'}"\n\ncurl -s "$DB_URL/all/handoffItems" \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "kind": "text",\n    "status": "new",\n    "realmId": "'\$USER_EMAIL'",\n    "owner": "'\$USER_EMAIL'",\n    "content": {\n      "text": "Remember to check X before Y"\n    },\n    "title": "Quick Note",\n    "senderDeviceName": "API Script",\n    "senderCategory": "any",\n    "targetCategory": "any",\n    "isSensitive": false,\n    "createdAt": $(date +%s)000,\n    "updatedAt": $(date +%s)000\n  }'`,
                                                                    'text-item'
                                                                )}
                                                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                                                                title="Copy to clipboard"
                                                            >
                                                                {copiedBlock === 'text-item' ? (
                                                                    <Check className="w-4 h-4 text-green-400" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                                    <h4 className="text-sm font-medium flex items-center gap-2 text-red-400">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        Security Warning
                                                    </h4>
                                                    <p className="text-xs text-gray-300">
                                                        The <code className="bg-black/20 px-1 py-0.5 rounded">client_secret</code> in <code className="bg-black/20 px-1 py-0.5 rounded">dexie-cloud.key</code> is sensitive. 
                                                        Keep it out of the frontend and out of git. Use it only in terminal scripts or on a server you control.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
