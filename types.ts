// Type definitions for Handoff Lite

// Device category for targeting
export type DeviceCategory = 'work' | 'private' | 'any';

// Item status matching Windows15 spec
export type ItemStatus = 'new' | 'opened' | 'done' | 'archived';

// Item kind
export type ItemKind = 'url' | 'text';

// Crypto parameters for encrypted items
export interface CryptoParams {
    alg: 'AES-GCM';
    keyDerivation: 'PBKDF2';
    salt: string; // base64
    iv: string; // base64
    iterations: number;
    version: number;
}

// Handoff item content - can be plain or encrypted
export interface PlainContent {
    url?: string;
    text?: string;
}

export interface EncryptedContent {
    ciphertext: string; // base64
    crypto: CryptoParams;
}

// Main Handoff Item type
export interface HandoffItem {
    id: string;
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
    senderDeviceId: string;
    senderDeviceName: string;
    senderCategory: DeviceCategory;
    targetCategory: DeviceCategory;
    targetDeviceId?: string; // Optional specific device targeting
    kind: ItemKind;
    status: ItemStatus;
    isSensitive: boolean;
    // Content depends on isSensitive
    content: PlainContent | EncryptedContent;
    // Metadata
    title?: string;
    preview?: string;
    openedAt?: number;
    doneAt?: number;
    archivedAt?: number;
}

// Device profile stored locally
export interface DeviceProfile {
    deviceId: string;
    deviceName: string;
    category: DeviceCategory;
    workMode: boolean; // URLs only
    retentionDays: number; // 1-30
    defaultTargetCategory: DeviceCategory;
    rememberPassphrase: 'off' | 'session' | 'device';
    isSetupComplete: boolean;
    enableBrowserNotifications: boolean;
    cloudUrl?: string; // Optional Dexie Cloud URL for sync
}

// Persisted state record for generic key-value storage
export interface PersistedStateRecord {
    key: string;
    value: unknown;
    updatedAt: number;
}

// Notification types
export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
}

// Known device for device registry
export interface KnownDevice {
    deviceId: string;
    deviceName: string;
    category: DeviceCategory;
    lastSeen: number; // timestamp
}

// Filter for inbox view
export type InboxFilter = 'new' | 'active' | 'archived' | 'all';

// Navigation routes
export type Route = 'inbox' | 'send' | 'settings' | 'share' | 'setup';

// Share payload from external sources (iOS Shortcuts, etc.)
export interface SharePayload {
    content: string;
    title?: string;
    category?: DeviceCategory;
    sensitive?: boolean;
}
