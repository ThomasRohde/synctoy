/**
 * Haptic feedback utility for iOS and supported devices
 * Provides tactile feedback for key user interactions
 */

/**
 * Check if the device supports vibration API
 */
function isVibrationSupported(): boolean {
    return 'vibrate' in navigator;
}

/**
 * Light haptic feedback for subtle interactions (10ms)
 * Use for: hover states, minor UI changes
 */
export function light(): void {
    if (isVibrationSupported()) {
        navigator.vibrate(10);
    }
}

/**
 * Medium haptic feedback for confirmations (20ms)
 * Use for: button presses, toggles, selections
 */
export function medium(): void {
    if (isVibrationSupported()) {
        navigator.vibrate(20);
    }
}

/**
 * Success haptic feedback with pattern [10ms, 50ms pause, 10ms]
 * Use for: successful operations, completions
 */
export function success(): void {
    if (isVibrationSupported()) {
        navigator.vibrate([10, 50, 10]);
    }
}

/**
 * Error haptic feedback with longer vibration (30ms)
 * Use for: errors, warnings, failed operations
 */
export function error(): void {
    if (isVibrationSupported()) {
        navigator.vibrate(30);
    }
}

/**
 * Impact haptic feedback for physical interactions (15ms)
 * Use for: swipe gestures, drag operations, pull-to-refresh
 */
export function impact(): void {
    if (isVibrationSupported()) {
        navigator.vibrate(15);
    }
}
