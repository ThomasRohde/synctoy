# iOS Shortcut Setup for Handoff Lite

This guide explains how to create an iOS Shortcut that integrates Handoff Lite with the iOS Share Sheet, allowing you to send URLs and text from any app directly to your inbox.

## Prerequisites

- iOS 13 or later
- Shortcuts app installed (pre-installed on iOS 13+)
- Handoff Lite app accessible via browser or installed as PWA

## Creating the Shortcut

### Method 1: Import Pre-built Shortcut (Recommended)

1. **Download the shortcut template**:
   - Open Safari on your iPhone
   - Navigate to: [Download Handoff Lite Shortcut](#creating-your-own-shortcut)
   - Tap "Get Shortcut"
   - Review the actions and tap "Add Shortcut"

2. **Configure the shortcut**:
   - Open the Shortcuts app
   - Find "Send to Handoff Lite"
   - Tap the ⋯ menu
   - Update the base URL to match your deployment:
     - Local: `http://localhost:5173`
     - Production: `https://your-domain.com`

### Method 2: Create Your Own Shortcut

1. **Open the Shortcuts app** on your iPhone

2. **Create a new shortcut**:
   - Tap the "+" button
   - Tap "Add Action"

3. **Add the following actions**:

   **Action 1: Receive input**
   - Search for "Receive" and add "Receive [Any Input] from [Share Sheet]"
   - This accepts content from the share sheet

   **Action 2: Get Type**
   - Search for "Get Type" and add "Get Type of [Shortcut Input]"
   - This determines if the shared content is a URL or text

   **Action 3: If (URL Check)**
   - Add "If [Type] is [URL]"

   **Action 4a: Get URL from input**
   - Add "Get URLs from [Shortcut Input]"

   **Action 4b: URL encode**
   - Add "URL Encode [URLs]"
   - Set encoding to "Form"

   **Action 5: Open URL (for URLs)**
   - Add "Open URLs"
   - Set URL to: `https://your-domain.com/#/share?url=[URL Encoded Value]`
   - Replace `your-domain.com` with your actual deployment URL

   **Action 6: Otherwise**
   - Add "Otherwise"

   **Action 7: URL encode text**
   - Add "URL Encode [Shortcut Input]"
   - Set encoding to "Form"

   **Action 8: Open URL (for text)**
   - Add "Open URLs"
   - Set URL to: `https://your-domain.com/#/share?text=[URL Encoded Value]`

   **Action 9: End If**
   - Add "End If"

4. **Configure shortcut settings**:
   - Tap the shortcut name and rename it to "Send to Handoff Lite"
   - Tap the icon to customize the appearance (optional)
   - Enable "Show in Share Sheet"
   - Select which content types to accept:
     - ✅ URLs
     - ✅ Text
     - ✅ Safari web pages

## Using the Shortcut

1. **From any app**, select content (URL, text, or web page)
2. **Tap the Share button** (square with arrow)
3. **Scroll down** and tap "Send to Handoff Lite"
4. **Handoff Lite will open** with the share composer pre-filled
5. **Select target device** and tap "Send"

## Example Shortcut Flow

```
Input: "https://example.com/article"
↓
Get Type → URL
↓
URL Encode → "https%3A%2F%2Fexample.com%2Farticle"
↓
Open URL → "https://handoff.app/#/share?url=https%3A%2F%2Fexample.com%2Farticle"
↓
Handoff Lite opens with URL pre-filled in composer
```

## Troubleshooting

### Shortcut doesn't appear in Share Sheet
- Go to Settings → Shortcuts
- Ensure "Allow Running Scripts" is enabled
- Reopen the Shortcuts app and verify "Show in Share Sheet" is enabled

### URL encoding issues
- Ensure you're using "Form" encoding mode
- iOS Shortcuts may have length limits for very long URLs (>2000 characters)

### Shortcut opens Safari instead of PWA
- If you've installed Handoff Lite as a PWA, iOS should automatically detect and open the PWA
- You may need to "Add to Home Screen" first for seamless integration

### Permission prompts
- First time you run the shortcut, iOS may ask for permission to access the URL
- Tap "Allow" to proceed

## Advanced: Shortcut for Specific Device Categories

You can create multiple shortcuts for different device categories:

**Work Device Shortcut**:
```
Open URL: https://your-domain.com/#/share?url=[URL]&target=work
```

**Private Device Shortcut**:
```
Open URL: https://your-domain.com/#/share?url=[URL]&target=private
```

This pre-selects the target category when opening the composer.

## Security Note

When sharing sensitive content, consider using the "Encrypt" option in the composer to protect your data with AES-256-GCM encryption.

## Need Help?

If you encounter issues:
1. Verify your deployment URL is correct and accessible
2. Check that F008 (Share Route) is implemented in your Handoff Lite instance
3. Test the share URL manually by visiting: `https://your-domain.com/#/share?text=test`
