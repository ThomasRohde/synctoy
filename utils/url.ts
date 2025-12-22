// URL validation and parsing utilities

// Check if a string is a valid URL
export function isValidUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// Get preview text for a URL (hostname + path preview)
export function getUrlPreview(urlString: string, maxLength: number = 50): string {
    try {
        const url = new URL(urlString);
        const preview = url.hostname + url.pathname;
        if (preview.length > maxLength) {
            return preview.substring(0, maxLength - 3) + '...';
        }
        return preview;
    } catch {
        return urlString.substring(0, maxLength);
    }
}

// Get preview text for plain text
export function getTextPreview(text: string, maxLength: number = 100): string {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length > maxLength) {
        return cleaned.substring(0, maxLength - 3) + '...';
    }
    return cleaned;
}

// Parse share URL query parameters
export function parseShareParams(search: string): {
    content?: string;
    title?: string;
    category?: string;
    sensitive?: boolean;
    autoSend?: boolean;
} {
    const params = new URLSearchParams(search);
    // Auto-send by default when coming from share links (unless explicitly disabled)
    const hasAutoSendParam = params.has('autoSend');
    const autoSend = hasAutoSendParam ? params.get('autoSend') !== 'false' : true;
    return {
        content: params.get('content') ?? params.get('url') ?? params.get('text') ?? undefined,
        title: params.get('title') ?? undefined,
        category: params.get('category') ?? undefined,
        sensitive: params.get('sensitive') === 'true',
        autoSend,
    };
}

// Encode content for share URL
export function createShareUrl(baseUrl: string, content: string, options?: {
    title?: string;
    category?: string;
    sensitive?: boolean;
}): string {
    const url = new URL('/share', baseUrl);
    url.searchParams.set('content', content);
    if (options?.title) url.searchParams.set('title', options.title);
    if (options?.category) url.searchParams.set('category', options.category);
    if (options?.sensitive) url.searchParams.set('sensitive', 'true');
    return url.toString();
}

// Detect content kind from string
export function detectContentKind(content: string): 'url' | 'text' {
    return isValidUrl(content.trim()) ? 'url' : 'text';
}

// Extract domain from URL for display
export function getDomain(urlString: string): string {
    try {
        const url = new URL(urlString);
        return url.hostname.replace(/^www\./, '');
    } catch {
        return urlString;
    }
}

// Get favicon URL for a domain
export function getFaviconUrl(urlString: string): string {
    try {
        const url = new URL(urlString);
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
        return '';
    }
}
