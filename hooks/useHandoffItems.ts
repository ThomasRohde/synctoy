import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../utils/storage/db';
import type { HandoffItem, InboxFilter, DeviceCategory } from '../types';

interface UseHandoffItemsResult {
    items: HandoffItem[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => void;
}

export function useHandoffItems(
    filter: InboxFilter,
    deviceCategory?: DeviceCategory,
    refreshTrigger?: number
): UseHandoffItemsResult {
    const [error, setError] = useState<Error | null>(null);

    // Use Dexie live query for real-time updates
    const items = useLiveQuery(
        async () => {
            try {
                const result = await db.getItemsByFilter(filter, deviceCategory);
                setError(null);
                return result;
            } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e));
                setError(err);
                return [];
            }
        },
        [filter, deviceCategory, refreshTrigger],
        []
    );

    const isLoading = items === undefined;

    const refresh = useCallback(() => {
        // Dexie live query handles this automatically
    }, []);

    return {
        items: items ?? [],
        isLoading,
        error,
        refresh,
    };
}
