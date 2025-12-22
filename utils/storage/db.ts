import Dexie, { type Table } from 'dexie';
import dexieCloud, { type DexieCloudTable } from 'dexie-cloud-addon';
import type { HandoffItem, DeviceProfile, PersistedStateRecord, KnownDevice } from '../../types';

// Cloud URL storage key in localStorage (must be accessible synchronously before DB opens)
const CLOUD_URL_STORAGE_KEY = 'handoff-lite-cloud-url';
const DEVICE_ID_STORAGE_KEY = 'handoff-lite-device-id';
const SETUP_COMPLETE_STORAGE_KEY = 'handoff-lite-setup-complete';

// Get cloud URL from localStorage (synchronous, available before DB opens)
function getStoredCloudUrl(): string | undefined {
    try {
        const url = localStorage.getItem(CLOUD_URL_STORAGE_KEY);
        return url && url.trim() ? url.trim() : undefined;
    } catch {
        return undefined;
    }
}

// Save cloud URL to localStorage
function setStoredCloudUrl(url: string | undefined): void {
    try {
        if (url && url.trim()) {
            localStorage.setItem(CLOUD_URL_STORAGE_KEY, url.trim());
        } else {
            localStorage.removeItem(CLOUD_URL_STORAGE_KEY);
        }
    } catch {
        // Ignore storage errors
    }
}

// Get device ID from localStorage (critical: must not sync across devices!)
function getStoredDeviceId(): string {
    try {
        let id = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
        }
        return id;
    } catch {
        return crypto.randomUUID();
    }
}

// Check if setup is complete from localStorage
function getSetupComplete(): boolean {
    try {
        return localStorage.getItem(SETUP_COMPLETE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

// Save setup complete to localStorage
function setSetupComplete(complete: boolean): void {
    try {
        if (complete) {
            localStorage.setItem(SETUP_COMPLETE_STORAGE_KEY, 'true');
        } else {
            localStorage.removeItem(SETUP_COMPLETE_STORAGE_KEY);
        }
    } catch {
        // Ignore storage errors
    }
}

// Cloud configuration - check localStorage first, then env var
const INITIAL_CLOUD_URL = getStoredCloudUrl() || (import.meta.env.VITE_DEXIE_CLOUD_URL as string | undefined);

// Default device profile - uses localStorage for critical values that must persist
export const DEFAULT_DEVICE_PROFILE: DeviceProfile = {
    deviceId: getStoredDeviceId(), // From localStorage, never synced!
    deviceName: '',
    category: 'any',
    workMode: false,
    retentionDays: 7,
    defaultTargetCategory: 'any',
    rememberPassphrase: 'off',
    isSetupComplete: getSetupComplete(), // From localStorage
    enableBrowserNotifications: false,
    cloudUrl: INITIAL_CLOUD_URL, // From localStorage
};

// Type for cloud-enabled database
type HandoffDatabaseType = Dexie & {
    handoffItems: DexieCloudTable<HandoffItem, 'id'>;
    persistedState: Table<PersistedStateRecord, string>;
    knownDevices: DexieCloudTable<KnownDevice, 'deviceId'>;
    cloud: typeof dexieCloud.prototype;
};

class HandoffDatabase extends Dexie {
    handoffItems!: DexieCloudTable<HandoffItem, 'id'>;
    persistedState!: Table<PersistedStateRecord, string>;
    knownDevices!: DexieCloudTable<KnownDevice, 'deviceId'>;
    private currentCloudUrl: string | undefined = INITIAL_CLOUD_URL;

    constructor() {
        // Always add dexie-cloud-addon (can be configured later)
        // Database name includes version suffix to allow clean migration from incompatible schema
        super('handoff-lite-v2', { addons: [dexieCloud] });

        // Note: Dexie Cloud requires @id for synced tables to generate cloud-compatible IDs
        // Tables prefixed with $ are local-only and don't sync
        
        // Version 1: Initial schema with @id for Dexie Cloud sync
        // (Previous 'handoff-lite' database used incompatible 'id' schema)
        
        this.version(1).stores({
            handoffItems: '@id, createdAt, status, targetCategory, targetDeviceId, kind, [status+createdAt]',
            persistedState: 'key',
            knownDevices: 'deviceId, lastSeen',
        });

        // Configure cloud sync with URL from localStorage (available synchronously)
        // This MUST happen before any database operations for @id to work properly
        if (INITIAL_CLOUD_URL) {
            console.info('[db] Configuring Dexie Cloud with URL:', INITIAL_CLOUD_URL);
            this.cloud.configure({
                databaseUrl: INITIAL_CLOUD_URL,
                requireAuth: true,
                customLoginGui: false,
                tryUseServiceWorker: false,
                unsyncedTables: ['persistedState', 'knownDevices'],
            });
        } else {
            console.info('[db] No cloud URL configured - running in local-only mode');
        }
    }

    // Update cloud URL - saves to localStorage and requires page reload
    async updateCloudUrl(cloudUrl: string | undefined): Promise<void> {
        if (this.currentCloudUrl === cloudUrl) {
            return; // No change
        }

        // Save to localStorage for next page load
        setStoredCloudUrl(cloudUrl);
        this.currentCloudUrl = cloudUrl;
        
        // Note: Full effect requires page reload since cloud.configure() 
        // should be called before database operations begin
        console.info('[db] Cloud URL updated. Reload required for full effect.');
    }

    // Check if cloud sync is enabled and configured
    get isCloudEnabled(): boolean {
        return !!this.currentCloudUrl && !!this.cloud.options?.databaseUrl;
    }

    // Get current cloud URL
    get cloudUrl(): string | undefined {
        return this.currentCloudUrl;
    }

    // Helper to get device profile
    async getDeviceProfile(): Promise<DeviceProfile> {
        const record = await this.persistedState.get('deviceProfile');
        if (record?.value) {
            return { ...DEFAULT_DEVICE_PROFILE, ...(record.value as Partial<DeviceProfile>) };
        }
        return DEFAULT_DEVICE_PROFILE;
    }

    // Helper to save device profile
    async saveDeviceProfile(profile: DeviceProfile): Promise<void> {
        // Also persist critical values to localStorage for reliability
        setSetupComplete(profile.isSetupComplete);
        if (profile.cloudUrl !== undefined) {
            setStoredCloudUrl(profile.cloudUrl);
        }
        
        await this.persistedState.put({
            key: 'deviceProfile',
            value: profile,
            updatedAt: Date.now(),
        });
    }

    // Initialize device with unique ID if not set
    async initializeDevice(): Promise<DeviceProfile> {
        const profile = await this.getDeviceProfile();
        // Device ID comes from localStorage, never changes
        profile.deviceId = getStoredDeviceId();
        // Also ensure isSetupComplete is in sync with localStorage
        profile.isSetupComplete = getSetupComplete() || profile.isSetupComplete;
        if (profile.isSetupComplete) {
            setSetupComplete(true); // Sync to localStorage if not already
        }
        await this.saveDeviceProfile(profile);
        return profile;
    }

    // Add a new handoff item
    // Note: When using @id schema, Dexie Cloud generates the ID automatically
    // This works both online and offline - the addon handles ID generation
    async addItem(item: Omit<HandoffItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const now = Date.now();
        const newItem: Omit<HandoffItem, 'id'> = {
            ...item,
            createdAt: now,
            updatedAt: now,
        };
        
        // Let Dexie Cloud addon auto-generate the ID (works offline too)
        const id = await this.handoffItems.add(newItem as HandoffItem);

        // Record sender in known devices
        await this.registerDevice({
            deviceId: item.senderDeviceId,
            deviceName: item.senderDeviceName,
            category: item.senderCategory,
            lastSeen: now,
        });

        return id as string;
    }

    // Update item status
    async updateItemStatus(id: string, status: HandoffItem['status']): Promise<void> {
        const now = Date.now();
        const updates: Partial<HandoffItem> = {
            status,
            updatedAt: now,
        };

        if (status === 'opened') {
            updates.openedAt = now;
        } else if (status === 'done') {
            updates.doneAt = now;
        } else if (status === 'archived') {
            updates.archivedAt = now;
        }

        await this.handoffItems.update(id, updates);
    }

    // Get items by filter
    async getItemsByFilter(
        filter: 'new' | 'active' | 'archived' | 'all',
        deviceCategory?: DeviceProfile['category'],
        deviceId?: string
    ): Promise<HandoffItem[]> {
        const collection = this.handoffItems.orderBy('createdAt').reverse();

        const items = await collection.toArray();

        // Filter by status
        let filtered = items;
        switch (filter) {
            case 'new':
                filtered = items.filter(item => item.status === 'new');
                break;
            case 'active':
                filtered = items.filter(item => ['new', 'opened', 'done'].includes(item.status));
                break;
            case 'archived':
                filtered = items.filter(item => item.status === 'archived');
                break;
            case 'all':
            default:
                // No filter
                break;
        }

        // Filter by device targeting
        if (deviceId) {
            filtered = filtered.filter(item => {
                // If item has specific device targeting, check device ID
                if (item.targetDeviceId) {
                    return item.targetDeviceId === deviceId;
                }
                // Otherwise fall back to category matching
                if (deviceCategory && deviceCategory !== 'any') {
                    return item.targetCategory === 'any' || item.targetCategory === deviceCategory;
                }
                return true;
            });
        } else if (deviceCategory && deviceCategory !== 'any') {
            // Filter by device category if specified and no specific device targeting
            filtered = filtered.filter(item => {
                // Skip items with specific device targeting
                if (item.targetDeviceId) {
                    return false;
                }
                return item.targetCategory === 'any' || item.targetCategory === deviceCategory;
            });
        }

        return filtered;
    }

    // Run retention cleanup - archive items older than retentionDays
    async runRetentionCleanup(retentionDays: number): Promise<number> {
        const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
        const itemsToArchive = await this.handoffItems
            .where('createdAt')
            .below(cutoffTime)
            .filter(item => item.status !== 'archived')
            .toArray();

        const now = Date.now();
        for (const item of itemsToArchive) {
            await this.handoffItems.update(item.id, {
                status: 'archived',
                archivedAt: now,
                updatedAt: now,
            });
        }

        return itemsToArchive.length;
    }

    // Delete an item
    async deleteItem(id: string): Promise<void> {
        await this.handoffItems.delete(id);
    }

    // Clear all archived items
    async clearArchived(): Promise<number> {
        const archived = await this.handoffItems.where('status').equals('archived').toArray();
        const ids = archived.map(item => item.id);
        await this.handoffItems.bulkDelete(ids);
        return ids.length;
    }

    // Device registry methods
    async registerDevice(device: KnownDevice): Promise<void> {
        await this.knownDevices.put(device);
    }

    async getKnownDevices(): Promise<KnownDevice[]> {
        return await this.knownDevices.orderBy('lastSeen').reverse().toArray();
    }

    async getKnownDevice(deviceId: string): Promise<KnownDevice | undefined> {
        return await this.knownDevices.get(deviceId);
    }
}

export const db = new HandoffDatabase();

// Export typed db for cloud features access
export const cloudDb = db as HandoffDatabaseType;
