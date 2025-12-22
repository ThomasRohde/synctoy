import { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/storage/db';

interface UsePersistedStateResult<T> {
    value: T;
    setValue: (val: T | ((prev: T) => T)) => Promise<void>;
    isLoading: boolean;
}

export function usePersistedState<T>(key: string, defaultValue: T): UsePersistedStateResult<T> {
    const [value, setLocalValue] = useState<T>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial value
    useEffect(() => {
        let mounted = true;

        db.persistedState.get(key).then(record => {
            if (mounted) {
                if (record) {
                    setLocalValue(record.value as T);
                }
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
        };
    }, [key]);

    // Save value
    const setValue = useCallback(
        async (val: T | ((prev: T) => T)) => {
            const newValue = typeof val === 'function' ? (val as (prev: T) => T)(value) : val;
            setLocalValue(newValue);

            await db.persistedState.put({
                key,
                value: newValue,
                updatedAt: Date.now(),
            });
        },
        [key, value]
    );

    return { value, setValue, isLoading };
}
