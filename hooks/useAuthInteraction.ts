import { useState, useEffect } from 'react';
import { useObservable } from 'dexie-react-hooks';
import { db, cloudDb } from '../utils/storage/db';

interface AuthInteraction {
    type: 'email' | 'otp' | 'message-alert' | 'logout-confirmation';
    title?: string;
    alerts?: Array<{ type: 'info' | 'warning' | 'error'; message: string; messageParams?: Record<string, string> }>;
    fields?: Record<string, { type?: string; label?: string; placeholder?: string }>;
    submitLabel?: string;
    cancelLabel?: string;
    onSubmit: (fields: Record<string, string>) => void;
    onCancel: () => void;
}

export function useAuthInteraction() {
    const [interaction, setInteraction] = useState<AuthInteraction | null>(null);

    useEffect(() => {
        // Only subscribe if cloud is enabled
        if (!db.isCloudEnabled) {
            return;
        }

        const subscription = cloudDb.cloud.userInteraction.subscribe({
            next: (ui: any) => {
                if (!ui) {
                    setInteraction(null);
                    return;
                }

                // Map the Dexie Cloud userInteraction to our AuthInteraction type
                setInteraction({
                    type: ui.type as AuthInteraction['type'],
                    title: ui.title,
                    alerts: ui.alerts,
                    fields: ui.fields,
                    submitLabel: ui.submitLabel,
                    cancelLabel: ui.cancelLabel,
                    onSubmit: async (fields: Record<string, string>) => {
                        try {
                            await ui.onSubmit(fields);
                        } catch (error) {
                            console.error('Auth submission error:', error);
                        }
                    },
                    onCancel: () => {
                        ui.onCancel();
                        setInteraction(null);
                    },
                });
            },
            error: (err: any) => {
                console.error('User interaction error:', err);
                setInteraction(null);
            },
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return interaction;
}
