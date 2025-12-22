import { useEffect, useRef } from 'react';
import { useApp } from '../context';
import { useHandoffItems } from './useHandoffItems';

/**
 * Hook to show browser notifications when new items arrive
 */
export function useBrowserNotifications() {
    const { deviceProfile, navigate } = useApp();
    const { items } = useHandoffItems('new', deviceProfile.category, 0);
    const previousItemCountRef = useRef<number>(items.length);

    useEffect(() => {
        // Only proceed if notifications are enabled and supported
        if (!deviceProfile.enableBrowserNotifications || !('Notification' in window)) {
            return;
        }

        // Check if permission is granted
        if (Notification.permission !== 'granted') {
            return;
        }

        // Get new items count
        const currentCount = items.length;
        const previousCount = previousItemCountRef.current;

        // If we have more items than before, show notification
        if (currentCount > previousCount && previousCount !== -1) {
            const newItemsCount = currentCount - previousCount;
            const title = newItemsCount === 1 ? 'New item received' : `${newItemsCount} new items received`;

            const notification = new Notification(title, {
                body: 'Click to view in your inbox',
                icon: '/favicon.ico',
                tag: 'handoff-new-item',
                requireInteraction: false,
            });

            notification.onclick = () => {
                window.focus();
                navigate('inbox');
                notification.close();
            };
        }

        // Update the ref for next comparison
        previousItemCountRef.current = currentCount;
    }, [items.length, deviceProfile.enableBrowserNotifications, navigate]);
}
