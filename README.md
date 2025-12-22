# Handoff Lite

A minimal, cross-device inbox for URLs and text with cloud sync, device targeting, and optional end-to-end encryption.

## Features

- 🚀 **Fast Capture** - Get a URL from clipboard into the app in under 10 seconds
- 📱 **Cross-Device Sync** - Near real-time updates across logged-in devices
- 💼 **Device Targeting** - Work vs Private targeting to reduce accidental cross-posting
- 🔒 **Optional E2EE** - Sensitive items are encrypted client-side with AES-256-GCM
- 📴 **Offline-First** - Create items while offline; sync when connectivity returns
- 📊 **Status Tracking** - New → Opened → Done → Archived workflow

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with PWA support
- **Tailwind CSS** - Styling
- **Dexie.js** - IndexedDB wrapper for offline-first persistence
- **Dexie Cloud** - Optional real-time cross-device sync

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
synctoy/
├── App.tsx              # Main app component
├── index.tsx            # Entry point
├── index.css            # Global styles
├── types.ts             # TypeScript types
├── components/          # Reusable UI components
│   ├── BottomNav.tsx
│   ├── Header.tsx
│   ├── HandoffItemCard.tsx
│   ├── FilterTabs.tsx
│   ├── CategorySelector.tsx
│   └── ...
├── context/             # React Context providers
│   ├── AppContext.tsx   # App state & navigation
│   ├── DbContext.tsx    # Database provider
│   └── NotificationContext.tsx
├── hooks/               # Custom React hooks
│   ├── useClipboard.ts
│   ├── useHandoffItems.ts
│   └── usePersistedState.ts
├── modules/             # Page modules
│   ├── Inbox.tsx        # Main inbox view
│   ├── Composer.tsx     # Send/compose view
│   ├── Settings.tsx     # Settings view
│   └── Setup.tsx        # First-run setup wizard
└── utils/               # Utilities
    ├── crypto.ts        # AES-256-GCM encryption
    ├── url.ts           # URL validation/parsing
    └── storage/         # Dexie database
```

## Usage

### First Run

On first launch, you'll be guided through a setup wizard to:
1. Name your device
2. Choose a device category (Work/Private/Any)
3. Configure Work Mode and retention settings

### Sending Items

1. Navigate to the **Send** tab
2. Click **Paste from Clipboard** or type/paste content manually
3. Select target devices (Work/Private/Any)
4. Optionally enable **Sensitive Mode** for encryption
5. Click **Send**

### Receiving Items

Items appear in the **Inbox** tab with:
- Status badges (New/Opened/Done/Archived)
- Category indicators
- Encryption status
- Quick actions (Open, Copy, Mark Done, Archive)

### iOS Shortcuts Integration

Handoff Lite supports iOS Share Sheet integration via a custom Shortcut. This allows you to send URLs and text from any iOS app directly to your inbox.

**[📱 See IOS_SHORTCUT.md for detailed setup instructions](./IOS_SHORTCUT.md)**

Quick start:
1. Open Shortcuts app on iOS
2. Create new shortcut with "Receive from Share Sheet"
3. URL encode the input
4. Open: `https://your-domain.com/#/share?url=[Encoded Input]` (for URLs)
5. Or: `https://your-domain.com/#/share?text=[Encoded Input]` (for text)

Supported parameters:
- `url` - URL to send
- `text` - Text to send
- `target` - Target device category (work/private/any)

## Security

### Sensitive Mode Encryption

- Algorithm: AES-256-GCM
- Key derivation: PBKDF2-HMAC-SHA-256 with 100,000 iterations
- Per-item random salt and IV
- Passphrase never stored or synced
- Decryption only on client

### Threat Model

Protects against cloud storage compromise. Does not protect against:
- Compromised endpoint/browser
- Keyloggers or screen capture
- Weak passphrases

## Cloud Sync (Dexie Cloud)

Handoff Lite supports optional real-time cross-device sync via [Dexie Cloud](https://dexie.org/cloud/).

### Setup

1. Create a Dexie Cloud database:
   ```bash
   npx dexie-cloud create
   ```

2. Set the environment variable with your database URL:
   ```bash
   # .env.local
   VITE_DEXIE_CLOUD_URL=https://your-database-id.dexie.cloud
   ```

3. Rebuild and deploy. Sync will be enabled automatically.

### Features

- **Real-time sync**: Items appear on other devices within seconds
- **Offline queue**: Changes made offline are queued and synced when online
- **Background sync**: Uses service worker for sync even when app is closed
- **Conflict resolution**: Last-write-wins for status fields
- **Local-only fallback**: App works fully without cloud configuration

### Sync Status

The header shows a sync status indicator:
- 🔘 Gray cloud: Local-only mode (no cloud configured)
- 🟡 Pulsing: Connecting to cloud
- 🟢 Green cloud: Connected and synced
- 🔵 Pulsing: Actively syncing
- 🟠 Orange: Disconnected (will retry)
- 🔴 Red: Sync error

Detailed sync status is available in Settings > Data.

## Future Enhancements

- [ ] Bulk actions (archive all, clear archived)
- [ ] Specific device targeting improvements
- [ ] User authentication for Dexie Cloud

## License

MIT
