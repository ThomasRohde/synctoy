import { useState, useEffect } from 'react';
import { db, cloudDb } from '../utils/storage/db';

interface CurrentUserInfo {
    userId: string;
    email?: string;
    isLoggedIn: boolean;
}

export function useCurrentUser(): CurrentUserInfo | null {
    const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);

    useEffect(() => {
        // If cloud is not enabled, stay null
        if (!db.isCloudEnabled) {
            setCurrentUser(null);
            return;
        }

        // Subscribe to currentUser changes
        const subscription = cloudDb.cloud.currentUser.subscribe({
            next: (user: any) => {
                if (user) {
                    setCurrentUser({
                        userId: user.userId || '',
                        email: user.email,
                        isLoggedIn: !!user.isLoggedIn,
                    });
                } else {
                    setCurrentUser(null);
                }
            },
            error: (err: any) => {
                console.error('Current user subscription error:', err);
                setCurrentUser(null);
            },
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return currentUser;
}
