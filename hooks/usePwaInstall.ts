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
    /** Browser-specific install instructions when automatic prompt isn't available */
    manualInstallInstructions: string | null;
    /** Trigger the install prompt */
    promptInstall: () => Promise<boolean>;
}

/**
 * Detect browser type for install instructions
 */
function getBrowserInfo(): { name: string; supportsInstallPrompt: boolean } {
    const ua = navigator.userAgent;
    
    if (ua.includes('Edg/')) {
        return { name: 'Edge', supportsInstallPrompt: true };
    }
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        return { name: 'Chrome', supportsInstallPrompt: true };
    }
    if (ua.includes('Firefox')) {
        return { name: 'Firefox', supportsInstallPrompt: false };
    }
    if (ua.includes('Safari') && !ua.includes('Chrome')) {
        return { name: 'Safari', supportsInstallPrompt: false };
    }
    return { name: 'Unknown', supportsInstallPrompt: false };
}

/**
 * Hook to manage PWA installation on Windows/desktop browsers.
 * Captures the beforeinstallprompt event and provides a method to trigger installation.
 */
export function usePwaInstall(): PwaInstallState {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    const browserInfo = getBrowserInfo();

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

    // Generate manual install instructions based on browser
    const getManualInstructions = (): string | null => {
        if (isInstalled) return null;
        if (deferredPrompt) return null; // Automatic install available
        
        switch (browserInfo.name) {
            case 'Chrome':
                return 'Click the install icon (⊕) in the address bar, or use Menu (⋮) → "Install Handoff Lite"';
            case 'Edge':
                return 'Click the install icon (⊕) in the address bar, or use Menu (…) → Apps → "Install Handoff Lite"';
            case 'Firefox':
                return 'Firefox doesn\'t support PWA installation. Use Chrome or Edge for the best experience.';
            case 'Safari':
                return 'Use the Share button → "Add to Dock" to install this app.';
            default:
                return 'Use the browser menu to install this app, or try Chrome/Edge for better PWA support.';
        }
    };

    return {
        canInstall: deferredPrompt !== null && !isInstalled,
        isInstalled,
        manualInstallInstructions: getManualInstructions(),
        promptInstall,
    };
}
