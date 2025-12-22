import { useState, useEffect } from 'react';
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
            next: (ui: unknown) => {
                if (!ui || typeof ui !== 'object') {
                    setInteraction(null);
                    return;
                }

                const interaction = ui as Record<string, unknown>;
                // Map the Dexie Cloud userInteraction to our AuthInteraction type
                setInteraction({
                    type: interaction.type as AuthInteraction['type'],
                    title: interaction.title as string | undefined,
                    alerts: interaction.alerts as AuthInteraction['alerts'],
                    fields: interaction.fields as AuthInteraction['fields'],
                    submitLabel: interaction.submitLabel as string | undefined,
                    cancelLabel: interaction.cancelLabel as string | undefined,
                    onSubmit: async (fields: Record<string, string>) => {
                        try {
                            const onSubmit = interaction.onSubmit as (fields: Record<string, string>) => Promise<void>;
                            await onSubmit(fields);
                        } catch (error) {
                            console.error('Auth submission error:', error);
                        }
                    },
                    onCancel: () => {
                        const onCancel = interaction.onCancel as () => void;
                        onCancel();
                        setInteraction(null);
                    },
                });
            },
            error: (err: unknown) => {
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
