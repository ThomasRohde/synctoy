import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface PwaInstallState {
    /** Whether the app can be installed (prompt is available) */
    canInstall: boolean;
    /** Whether the app is already installed as a PWA */
    isInstalled: boolean;
    /** Trigger the install prompt */
    promptInstall: () => Promise<boolean>;
}

/**
 * Hook to manage PWA installation on Windows/desktop browsers.
 * Captures the beforeinstallprompt event and provides a method to trigger installation.
 */
export function usePwaInstall(): PwaInstallState {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        const checkInstalled = () => {
            // Check display-mode media query
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            // Check iOS standalone mode
            const isIosStandalone = (navigator as { standalone?: boolean }).standalone === true;
            // Check if launched from installed PWA
            const isInstalledPwa = document.referrer.includes('android-app://') || 
                                   window.matchMedia('(display-mode: window-controls-overlay)').matches;
            
            setIsInstalled(isStandalone || isIosStandalone || isInstalledPwa);
        };
        
        checkInstalled();

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e: MediaQueryListEvent) => {
            setIsInstalled(e.matches);
        };
        mediaQuery.addEventListener('change', handleDisplayModeChange);

        // Capture the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Store the event for later use
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            console.info('[PWA] Install prompt available');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful installation
        const handleAppInstalled = () => {
            console.info('[PWA] App was installed');
            setDeferredPrompt(null);
            setIsInstalled(true);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            mediaQuery.removeEventListener('change', handleDisplayModeChange);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) {
            console.warn('[PWA] No install prompt available');
            return false;
        }

        try {
            // Show the install prompt
            await deferredPrompt.prompt();
            
            // Wait for the user's choice
            const { outcome } = await deferredPrompt.userChoice;
            console.info('[PWA] User choice:', outcome);
            
            // Clear the deferred prompt - can only be used once
            setDeferredPrompt(null);
            
            return outcome === 'accepted';
        } catch (error) {
            console.error('[PWA] Install prompt error:', error);
            return false;
        }
    }, [deferredPrompt]);

    return {
        canInstall: deferredPrompt !== null && !isInstalled,
        isInstalled,
        promptInstall,
    };
}
