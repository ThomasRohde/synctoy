import { useObservable } from 'dexie-react-hooks';
import { db, cloudDb } from '../utils/storage/db';
import type { UserLogin } from 'dexie-cloud-addon';

export function useCurrentUser(): UserLogin | null {
    // Return null if cloud is not enabled
    if (!db.isCloudEnabled) {
        return null;
    }

    // Use dexie-react-hooks to observe currentUser
    const currentUser = useObservable(cloudDb.cloud.currentUser, null);
    
    return currentUser;
}
