import { useState, useCallback } from 'react';
import { useNotification } from '../context';

interface UseClipboardResult {
    copiedText: string | null;
    copy: (text: string) => Promise<boolean>;
    paste: () => Promise<string | null>;
    isSupported: boolean;
}

export function useClipboard(): UseClipboardResult {
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const notify = useNotification();

    const isSupported = typeof navigator !== 'undefined' && 
        !!navigator.clipboard && 
        typeof navigator.clipboard.writeText === 'function';

    const copy = useCallback(async (text: string): Promise<boolean> => {
        if (!isSupported) {
            notify.error('Clipboard not supported in this browser');
            return false;
        }

        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            notify.error('Failed to copy to clipboard');
            return false;
        }
    }, [isSupported, notify]);

    const paste = useCallback(async (): Promise<string | null> => {
        if (!isSupported) {
            notify.error('Clipboard not supported in this browser');
            return null;
        }

        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            console.error('Failed to read from clipboard:', error);
            // This is expected when permission is denied - don't show error
            return null;
        }
    }, [isSupported, notify]);

    return { copiedText, copy, paste, isSupported };
}
