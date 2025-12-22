# Handoff Lite - Copilot Instructions

> Cross-device URL/text inbox with optional E2EE • React 19 + Vite + Dexie.js

## Architecture Overview

**Data Flow**: `App.tsx` → Provider stack (`DbProvider` → `NotificationProvider` → `AppProvider`) → Route modules

### Key Abstractions

| Layer | Location | Purpose |
|-------|----------|---------|
| **Database** | `utils/storage/db.ts` | Dexie.js singleton with `HandoffItem` and `PersistedStateRecord` tables |
| **Context** | `context/` | `AppContext` (routing, device profile, session state), `DbContext` (db access), `NotificationContext` (toasts) |
| **Modules** | `modules/` | Page-level components: `Inbox`, `Composer`, `Settings`, `Setup` |
| **Components** | `components/` | Reusable UI: cards, nav, selectors |
| **Hooks** | `hooks/` | `useHandoffItems` (live queries), `useClipboard`, `usePersistedState` |

### Type Definitions

All types in `types.ts`. Key types:
- `HandoffItem` - main data model with `status: 'new' | 'opened' | 'done' | 'archived'`
- `DeviceProfile` - local device config (category, workMode, retentionDays)
- `PlainContent | EncryptedContent` - item content, encrypted uses `CryptoParams`

## Developer Commands

```bash
npm run dev           # Vite dev server (port 5000)
npm run build         # Production build
npm run lint          # ESLint
npm run format:check  # Prettier check
```

**No test runner configured** - verify features manually via browser.

## Conventions & Patterns

### Component Structure
- Modules import from `context/`, `hooks/`, `components/` via barrel exports (`index.ts`)
- Tailwind glass-card pattern: `bg-white/5 rounded-xl` or `glass-card` class
- CSS vars for layout: `--app-vh`, `--nav-height`, `--bottom-nav-height`

### State Management
```tsx
// App-wide state
const { deviceProfile, route, navigate, refreshItems } = useApp();

// Database operations
const db = useDb();
await db.addItem({ ...itemData });
await db.updateItemStatus(id, 'done');

// Live queries (auto-updates on DB changes)
const { items, isLoading } = useHandoffItems(filter, deviceCategory);

// Toasts
const notify = useNotification();
notify.success('Sent!');
```

### Encryption (Sensitive Mode)
`utils/crypto.ts` implements AES-256-GCM with PBKDF2:
```ts
import { encryptContent, decryptContent } from '../utils/crypto';
const encrypted = await encryptContent({ url: 'https://...' }, passphrase);
const plain = await decryptContent(encrypted, passphrase);
```

### URL Utilities
`utils/url.ts` provides:
- `isValidUrl(str)` - validates http/https URLs
- `detectContentKind(str)` - returns `'url' | 'text'`
- `parseShareParams(queryString)` - extracts `/share` route params

### Adding New Features

1. Define types in `types.ts`
2. Add database methods to `utils/storage/db.ts` if needed
3. Create component in `components/` or module in `modules/`
4. Export from barrel file (`index.ts`)
5. Wire into `AppContext` if routing/state needed

## Important Notes

- **Offline-first**: All data in IndexedDB via Dexie. Cloud sync planned but not implemented.
- **Hash routing**: Uses `window.location.hash` (e.g., `#inbox`, `#send`)
- **First-run wizard**: Routes to `Setup` if `deviceProfile.isSetupComplete === false`
- **Work Mode**: When enabled, only URLs allowed (blocks plain text)

---

## Klondike Session Workflow

This project uses `klondike` CLI for multi-session agent continuity. See `CLAUDE.md` for full details.

```bash
klondike status                           # Project overview
klondike session start --focus "..."      # Begin work
klondike feature start F00X               # Track feature
klondike feature verify F00X --evidence   # Mark complete
klondike session end --summary --next     # Clean handoff
```

**Pre-commit**: Run `npm run lint` and `npm run build` before committing.
