import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Notification } from '../types';

interface NotificationContextValue {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => string;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const duration = notification.duration ?? 4000;

        setNotifications(prev => [...prev, { ...notification, id }]);

        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
    return ctx;
}

// Convenience hook
export function useNotification() {
    const { addNotification, removeNotification } = useNotificationContext();

    return {
        info: (message: string, options?: { duration?: number }) =>
            addNotification({ type: 'info', message, duration: options?.duration }),
        success: (message: string, options?: { duration?: number }) =>
            addNotification({ type: 'success', message, duration: options?.duration }),
        warning: (message: string, options?: { duration?: number }) =>
            addNotification({ type: 'warning', message, duration: options?.duration }),
        error: (message: string, options?: { duration?: number }) =>
            addNotification({ type: 'error', message, duration: options?.duration }),
        dismiss: removeNotification,
    };
}
