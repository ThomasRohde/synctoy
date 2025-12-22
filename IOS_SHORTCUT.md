# iOS Shortcut Setup for Handoff Lite

This guide explains how to create an iOS Shortcut that integrates Handoff Lite with the iOS Share Sheet, allowing you to send URLs and text from any app directly to your inbox with **one-tap auto-send**.

## Prerequisites

- iOS 13 or later
- Shortcuts app installed (pre-installed on iOS 13+)
- Handoff Lite accessible at `https://thomasrohde.github.io/synctoy/` (or your own deployment)

## Deep Link Format

Handoff Lite uses query parameters for share links:

```
https://thomasrohde.github.io/synctoy/?handoff=1&nonce=...&kind=url&target=...
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `handoff` | Yes | Must be `1` to trigger share receiver |
| `nonce` | Yes | Unique ID (6-128 chars) for duplicate prevention |
| `kind` | No | `url` or `text` (auto-detected if omitted) |
| `target` | For URLs | The URL to share (URL-encoded) |
| `text` | For text | The text content (URL-encoded) |
| `title` | No | Optional title for the item |
| `targetCategory` | No | `work`, `private`, or `any` (default: `any`) |
| `source` | No | Source app name (e.g., `ChatGPT%20iOS`) |
| `open` | No | Set to `inbox` to navigate there after sending |

## Creating the Shortcut

### Step-by-Step Instructions

1. **Open the Shortcuts app** on your iPhone

2. **Create a new shortcut**:
   - Tap the "+" button in the top right
   - Tap "Add Action"

3. **Configure Share Sheet input**:
   - Search for "Receive" and add **"Receive [Any Input] from [Share Sheet]"**
   - Tap on "Any" and select: URLs, Text, Safari web pages

4. **Generate a unique nonce**:
   - Add **"Random Number"** action
   - Set minimum: `100000000000`
   - Set maximum: `999999999999`
   - Add **"Format Date"** action (Current Date, format: `yyyyMMddHHmmss`)
   - Add **"Text"** action with: `[Random Number][Formatted Date]`
   - This creates a unique nonce like `12345678901220251222143025`

5. **Detect content type and build URL**:
   - Add **"Get URLs from [Shortcut Input]"**
   - Add **"Count"** action to count URLs
   
   - Add **"If [Count] is greater than 0"**:
     - Add **"Get URLs from [Shortcut Input]"** → gets the first URL
     - Add **"URL Encode [URLs]"** (Encode Mode: Form)
     - Add **"Text"**:
       ```
       https://thomasrohde.github.io/synctoy/?handoff=1&nonce=[Nonce Text]&kind=url&target=[Encoded URL]&open=inbox&source=iOS%20Shortcut
       ```
   
   - Add **"Otherwise"**:
     - Add **"URL Encode [Shortcut Input]"** (Encode Mode: Form)
     - Add **"Text"**:
       ```
       https://thomasrohde.github.io/synctoy/?handoff=1&nonce=[Nonce Text]&kind=text&text=[Encoded Text]&open=inbox&source=iOS%20Shortcut
       ```
   
   - Add **"End If"**

6. **Open the deep link**:
   - Add **"Open URLs"** action with the Text output from the If/Otherwise

7. **Configure shortcut settings**:
   - Tap the shortcut name at the top and rename to **"Send to Handoff"**
   - Tap the dropdown arrow next to the name
   - Enable **"Show in Share Sheet"**
   - Optionally customize the icon (blue arrow recommended)

## Simplified Shortcut (URL Only)

If you primarily share URLs, here's a simpler version:

1. **Receive** [URLs] from [Share Sheet]
2. **Random Number** (min: 100000000000, max: 999999999999)
3. **URL Encode** [Shortcut Input] (Form mode)
4. **Text**: `https://thomasrohde.github.io/synctoy/?handoff=1&nonce=[Random Number]&kind=url&target=[Encoded Value]&open=inbox`
5. **Open URLs** [Text]

## Using the Shortcut

1. **From any app** (Safari, ChatGPT, Notes, Mail, etc.), find content to share
2. **Tap the Share button** (square with arrow pointing up)
3. **Scroll down** to the shortcuts section and tap **"Send to Handoff"**
4. **Handoff Lite opens** and automatically sends the content
5. **A toast notification** confirms "Sent to Handoff"
6. **Content syncs** to all your devices via Dexie Cloud

## Example Flow

```
You're in ChatGPT iOS, copy a response URL
↓
Tap Share → "Send to Handoff"
↓
Shortcut generates: 
https://thomasrohde.github.io/synctoy/?handoff=1&nonce=547821098712202512221430&kind=url&target=https%3A%2F%2Fchat.openai.com%2Fc%2Fabc123&open=inbox&source=iOS%20Shortcut
↓
Handoff Lite opens, processes the link, shows "Sent to Handoff"
↓
Item appears in Inbox, syncs to your other devices
```

## Advanced: Category-Specific Shortcuts

Create separate shortcuts for different device categories:

**"Send to Handoff (Work)"**:
```
...&targetCategory=work&...
```

**"Send to Handoff (Private)"**:
```
...&targetCategory=private&...
```

This pre-selects the target category, useful for separating work and personal items.

## Reducing Confirmation Prompts

iOS shows security prompts when shortcuts open URLs. Here's how to minimize them:

### Enable Advanced Shortcuts Settings

Go to **Settings → Shortcuts → Advanced** and enable:
- ✅ **Allow Running Scripts**
- ✅ **Allow Sharing Large Amounts of Data**  
- ✅ **Allow Deleting Without Confirmation**

This reduces some prompts and allows the shortcut to run more smoothly.

### Run the Shortcut Multiple Times

iOS learns to trust shortcuts over time. After running "Send to Handoff" 5-10 times, iOS may stop showing the "Allow opening URL?" confirmation.

### Add Shortcut to Home Screen

Shortcuts launched from the Home Screen sometimes have fewer prompts than those run from the Share Sheet:
1. Open the Shortcuts app
2. Long-press on "Send to Handoff"
3. Tap **"Add to Home Screen"**
4. Use this icon to trigger the shortcut directly

### Alternative: Clipboard-Based Approach (Zero Prompts)

For a prompt-free experience, use this alternative approach:

1. **Receive** [Any Input] from [Share Sheet]
2. **Random Number** + **Format Date** → create nonce
3. **Build URL** (same as before)
4. **Copy to Clipboard** [URL]
5. **Show Notification**: "Copied! Tap to open Handoff"
6. **Open App** → Safari (optional)

This copies the deep link to clipboard instead of opening it directly. Then:
- Open Safari and paste the URL, OR
- Open Handoff Lite and it will detect the clipboard content

### Why Prompts Exist

The "Allow [shortcut] to open [URL]?" prompt is an iOS security feature that cannot be fully disabled. It protects users from malicious shortcuts that could:
- Open phishing sites
- Trigger unwanted downloads
- Redirect to harmful content

The prompts reduce with trust over time, but Apple prioritizes security over convenience here.

## Troubleshooting

### Shortcut doesn't appear in Share Sheet
- Go to **Settings → Shortcuts**
- Ensure **"Allow Running Scripts"** is enabled
- In the shortcut editor, verify **"Show in Share Sheet"** is enabled

### "Nothing to send" error
- Ensure the `nonce` is at least 6 characters long
- For URLs, verify the `target` parameter contains a valid http/https URL
- For text, ensure the `text` parameter is not empty

### Duplicate items appearing
- This shouldn't happen - the nonce prevents duplicates
- If it does, clear `synctoy_share_nonces` from localStorage

### Shortcut opens Safari instead of PWA
- iOS doesn't reliably redirect to PWAs for query-param URLs
- The share will still work - Safari opens Handoff Lite and processes it
- For best experience, bookmark the app or keep it open

### URL too long
- iOS has ~2000 character URL limits
- Very long text content may be truncated
- For large content, copy/paste directly in the Handoff Lite app

### Content doesn't sync
- Ensure Dexie Cloud is configured in Settings
- Check that you're logged in on both devices
- Pull-to-refresh in the Inbox to force sync

## Security Note

Content shared via Shortcut is passed through the URL, which may appear in browser history. For sensitive content:
- Use the Handoff Lite app directly with Sensitive Mode enabled
- Shortcut-based encryption is not supported (passphrases can't be securely handled)

## Test Links

Test the share receiver manually:

**URL test:**
```
https://thomasrohde.github.io/synctoy/?handoff=1&nonce=test123456789&kind=url&target=https://example.com&title=Test%20Link&open=inbox
```

**Text test:**
```
https://thomasrohde.github.io/synctoy/?handoff=1&nonce=test987654321&kind=text&text=Hello%20from%20test&open=inbox
```

## Need Help?

If you encounter issues:
1. Verify the base URL is correct for your deployment
2. Test the deep link format manually in Safari
3. Check browser console for `[ShareReceiver]` log messages
4. Ensure you have a fresh nonce for each share attempt
