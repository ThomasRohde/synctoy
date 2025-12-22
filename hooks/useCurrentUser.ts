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
            next: (user: unknown) => {
                if (user && typeof user === 'object') {
                    const userObj = user as Record<string, unknown>;
                    setCurrentUser({
                        userId: (userObj.userId as string) || '',
                        email: userObj.email as string | undefined,
                        isLoggedIn: !!userObj.isLoggedIn,
                    });
                } else {
                    setCurrentUser(null);
                }
            },
            error: (err: unknown) => {
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
