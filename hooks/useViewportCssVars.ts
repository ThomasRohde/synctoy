import { useEffect } from 'react';

/**
 * Sets CSS custom properties for viewport dimensions.
 * Handles mobile browser chrome (address bar) correctly.
 */
export function useViewportCssVars(): void {
    useEffect(() => {
        const updateVars = () => {
            // Use visualViewport if available (handles mobile keyboard, etc.)
            const vh = window.visualViewport?.height ?? window.innerHeight;
            const vw = window.visualViewport?.width ?? window.innerWidth;

            document.documentElement.style.setProperty('--app-vh', `${vh}px`);
            document.documentElement.style.setProperty('--app-vw', `${vw}px`);
        };

        updateVars();

        window.addEventListener('resize', updateVars);
        window.visualViewport?.addEventListener('resize', updateVars);

        return () => {
            window.removeEventListener('resize', updateVars);
            window.visualViewport?.removeEventListener('resize', updateVars);
        };
    }, []);
}
