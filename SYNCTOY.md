Product Requirements Document (PRD) — “Handoff Lite” (standalone Handoff Queue app)

Context and underlying goal (so we aim at the right thing)
You’re not really asking for “a new app”; you’re trying to isolate the single most valuable workflow in Windows15: moving a URL (and sometimes text) between “work” and “private” devices quickly, safely, and with minimal friction. The PRD below assumes you want a lightweight, standalone web/PWA that keeps the core Windows15 Handoff behavior: device targeting (Work/Private/Any), optional end-to-end encryption, and status/retention handling. ([GitHub][1])

1. Summary
   Product name: Handoff Lite
   One-liner: A minimal, cross-device inbox for URLs (and optional text) with cloud sync, device targeting, and optional end-to-end encryption.

Reference behavior from Windows15
Windows15 describes Handoff as: “Send URLs and text between devices instantly with cloud sync, optional encryption, and device targeting,” with statuses (New → Opened → Done → Archived), auto-archive retention, Work Mode (URLs only), and “Sensitive Mode” using AES-256-GCM. ([GitHub][1])

2. Goals and non-goals
   Goals

* Fast capture: get a URL from clipboard/share into the app in under ~10 seconds.
* Fast retrieval: open/copy a received item in 1–2 clicks/taps.
* Cross-device sync: near real-time updates across logged-in devices (or connected sync backend).
* Separation: “Work vs Private” targeting to reduce accidental cross-posting. ([GitHub][1])
* Optional E2EE: “Sensitive” items are encrypted client-side (AES-256-GCM) and stored encrypted in the cloud. ([GitHub][1])
* Offline-first: create items while offline; sync when connectivity returns (at least best-effort).

Non-goals

* Not a desktop OS, window manager, taskbar, app ecosystem, wallpaper engine, etc.
* Not a full clipboard manager/history (beyond “paste now” convenience).
* Not a team collaboration tool (single user, multi-device).
* Not a password manager (we only handle optional passphrase-based encryption for message content).

3. Target users and primary use cases
   Primary persona

* A “two-laptop” user: constrained corporate machine + private machine, frequently switching contexts.

Primary use cases

* “Send this link to my other device.”
* “Send this snippet of text to my other device” (optional / can be disabled by Work Mode).
* “Send this securely” (Sensitive Mode, passphrase-based).
* “Keep a small inbox and clear it” (Opened/Done/Archived + retention). ([GitHub][1])

4. Scope: MVP feature set
   MVP must include (mirrors Windows15 Handoff essentials)
   A. Handoff Inbox

* List items (most recent first) with:

  * Kind: url | text
  * Preview (host/path for URLs; first N chars for text)
  * Sender device label/name (if available)
  * Target category (Work/Private/Any)
  * Status (New/Opened/Done/Archived)
  * Timestamp
* Actions per item:

  * Open (URLs open in new tab; text opens a detail view)
  * Copy to clipboard
  * Mark Opened (automatic when opened)
  * Mark Done
  * Archive / Unarchive
* Filters: “New”, “Active”, “Archived”, and “All”
* Status model must match: New → Opened → Done → Archived (with ability to archive earlier). ([GitHub][1])

B. Composer (Send panel)

* Input: paste URL/text from clipboard or type.
* Kind detection:

  * If Work Mode is enabled, only allow valid URLs; reject plain text. ([GitHub][1])
  * Otherwise allow URL or text.
* Target category selector: Work | Private | Any. ([GitHub][1])
* Optional “Sensitive Mode” toggle:

  * If enabled, require passphrase entry (or use a stored/remembered passphrase on that device).
  * Encrypt content client-side using AES-256-GCM before sync/storage. ([GitHub][1])

C. Device profile + retention settings

* Device name (how it appears to other devices). ([GitHub][1])
* Device category: Work | Private | Any. ([GitHub][1])
* Auto-archive period (1–30 days) applied to non-archived items; items older than retention become Archived. ([GitHub][1])

D. Sync backend (Bring Your Own)

* Use a sync approach compatible with static hosting (GitHub Pages) and enterprise networks.
* Default path: Dexie.js + Dexie Cloud, consistent with Windows15’s approach (IndexedDB local-first + cloud sync). ([GitHub][1])
* The app must still function locally without cloud configured (single-device mode).

E. “Quick send” integration (MVP-lite)
Windows15 mentions a global shortcut/context menu quick send. ([GitHub][1])
For Handoff Lite MVP, implement at least one:

* A prominent “Paste & Send” button (reads clipboard via Clipboard API where permitted).
* A dedicated “/share” route that accepts content via URL query/fragment (to support iOS Shortcuts share sheet workflows).

5. Nice-to-haves (post-MVP)

* Browser Notification API for new incoming items (with opt-in).
* Per-category defaults (e.g., if device is “Work”, default target = Private).
* “Device targeting by specific device” (not just category), if you later add explicit device registry.
* Search box for inbox.
* Bulk actions: archive all done, clear archived, etc.
* Better iOS share-sheet flow:

  * Provide an iOS Shortcut template: Share → “Open URL” (Handoff Lite /share?payload=…).

6. UX flows (key screens)
   A. First-run setup
7. Choose device name (suggest OS/browser name).
8. Choose device category (Work/Private/Any).
9. Choose Work Mode (URLs only) toggle.
10. Configure sync:

    * “Local only” OR “Connect Dexie Cloud”
11. Set retention (default 7 days).

B. Send flow (fast path)

* User hits “Paste & Send”
* App reads clipboard, auto-detects URL vs text
* If Work Mode and content isn’t a URL → show error and offer “switch off Work Mode” (if permitted)
* User picks target category (defaulted)
* Optional: enable Sensitive Mode and enter passphrase
* Tap Send
* Confirmation toast + item appears in “Sent/Active” view (or just in unified list tagged as “sent by this device”)

C. Receive flow

* Incoming items appear at top with “New” badge
* Tap item:

  * URL: open in new tab and auto-mark Opened
  * Text: open detail modal, show full content, copy button, mark Opened
* Mark Done when handled
* Retention job auto-archives older items

D. Sensitive item flow

* If item is encrypted:

  * Show locked indicator
  * On open: prompt for passphrase (or use remembered passphrase)
  * Decrypt client-side; if passphrase wrong show error (do not leak content)
  * After decrypt: allow open/copy

7. Data model (logical)
   HandoffItem

* id: string (uuid)
* createdAt, updatedAt: ISO timestamp
* senderDeviceId: string
* senderDeviceName: string
* senderCategory: work|private|any
* targetCategory: work|private|any
* kind: url|text
* status: new|opened|done|archived  (aligned with Windows15) ([GitHub][1])
* content:

  * if not sensitive:

    * url?: string
    * text?: string
  * if sensitive:

    * ciphertext: base64
    * crypto: { alg: “AES-GCM”, keyDerivation: “PBKDF2”, salt, iv, iterations, version }
* metadata:

  * title?: string (optional user label)
  * preview?: string
  * openedAt?: timestamp
  * doneAt?: timestamp
  * archivedAt?: timestamp

DeviceProfile

* deviceId: string (persisted locally)
* deviceName: string ([GitHub][1])
* category: work|private|any ([GitHub][1])
* workMode: boolean ([GitHub][1])
* retentionDays: number (1–30) ([GitHub][1])
* defaultTargetCategory?: work|private|any
* rememberPassphrase: off|session|device (optional, post-MVP)

8. Encryption requirements (Sensitive Mode)
   Baseline requirement (match intent from Windows15)

* Use AES-256-GCM for content encryption. ([GitHub][1])
* Key derived from a user passphrase; passphrase itself is never synced.
* Store only ciphertext + necessary parameters (salt/iv/iterations/version).
* Decrypt only on the client.

Implementation constraints

* Use Web Crypto API (supported in modern browsers).
* Derivation suggestion (explicitly define to avoid ambiguity):

  * PBKDF2-HMAC-SHA-256, per-item random salt, high iteration count (tuned for mobile), produce 256-bit key.
* Threat model: protects cloud storage compromise; does not protect against compromised endpoint/browser.

9. Sync and offline requirements
   Offline-first

* Items must be readable from local IndexedDB.
* User can create items offline; items are queued and sync when online.
* Conflict strategy:

  * “Last write wins” for status fields (opened/done/archived), but preserve timestamps sensibly.

Real-time behavior

* When cloud sync is enabled, new items should appear “quickly” (target: seconds). Windows15 calls out real-time sync via Dexie Cloud. ([GitHub][1])

10. Technical requirements (implementation-oriented)
    Frontend

* React + TypeScript + Vite (consistent with Windows15 stack). ([GitHub][1])
* Tailwind for quick UI (optional, but keeps parity with your existing style).

Persistence

* Dexie.js (IndexedDB) local database.
* Optional Dexie Cloud connector for cross-device sync (BYO database). ([GitHub][1])

Static hosting

* Must run on GitHub Pages (no server required for core).
* All configuration via environment variables / runtime config JSON.

Routing

* /inbox
* /send
* /settings
* /share (accepts incoming payload from external share/shortcut)

11. Acceptance criteria (MVP)
    Functional

* User can send a URL item targeted to “Work/Private/Any” and see it on another device using the same sync backend.
* User can enable Work Mode and the app blocks sending plain text.
* User can enable Sensitive Mode, send an encrypted item, and decrypt it on another device using the same passphrase.
* Status transitions work and are synced: New → Opened → Done → Archived.
* Retention auto-archives items older than configured days.

Quality

* Cold start to usable inbox under ~2 seconds on a modern laptop; under ~4 seconds on a modern phone (best effort).
* No data loss when offline → online.
* Clear error messages for:

  * clipboard permission denied
  * invalid URL in Work Mode
  * missing/wrong passphrase
  * sync misconfiguration

12. Metrics (what “success” looks like)

* Median “share” time (user action → item visible on other device).
* Weekly active devices per user (signals it’s truly cross-device).
* % of items sent with Sensitive Mode (signals trust/usefulness).
* Inbox hygiene: fraction of items marked Done or Archived within retention window.

13. Release plan
    Phase 1 (MVP)

* Core inbox + composer
* Device profile + retention
* Category targeting
* Dexie local + optional Dexie Cloud sync
* Sensitive Mode encryption (AES-256-GCM) ([GitHub][1])
* /share route for iOS Shortcuts integration (simple payload)

Phase 2 (Polish)

* Better onboarding, presets, per-device defaults
* Search + bulk actions
* Optional notifications

Phase 3 (Power-user)

* Specific-device targeting (beyond category)
* Share extensions / deeper mobile integrations where platform allows

14. Open questions (documented, but not blocking for MVP)

* Do you want text sharing enabled by default, or default to Work Mode = URLs-only to avoid accidental policy issues?
* Should passphrases be “rememberable” on a device (risk tradeoff), or always re-entered?
* Do you want multi-backend sync (Dexie Cloud vs something else) as an explicit plugin point, or keep it single-path for simplicity?

If you want, I can also rewrite this PRD into a repo-ready `PRD.md` plus a tight “MVP backlog” (epics → user stories → acceptance tests) tailored to how you like to implement (phased, verifiable tasks).

[1]: https://github.com/ThomasRohde/windows15 "GitHub - ThomasRohde/windows15"
