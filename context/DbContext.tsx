import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import Dexie from 'dexie';
import { db } from '../utils/storage/db';

type Database = typeof db;

const DbContext = createContext<Database | null>(null);

// List of old database names to clean up
const OLD_DATABASE_NAMES = ['handoff-lite'];

export function DbProvider({ children }: { children: ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Clean up old databases on startup
        const cleanup = async () => {
            for (const dbName of OLD_DATABASE_NAMES) {
                try {
                    const exists = await Dexie.exists(dbName);
                    if (exists) {
                        console.info(`[DbProvider] Deleting old database: ${dbName}`);
                        await Dexie.delete(dbName);
                        console.info(`[DbProvider] Deleted old database: ${dbName}`);
                    }
                } catch (err) {
                    console.warn(`[DbProvider] Failed to delete old database ${dbName}:`, err);
                }
            }
            setIsReady(true);
        };
        cleanup();
    }, []);

    if (!isReady) {
        return null; // Or a loading spinner
    }

    return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDb(): Database {
    const ctx = useContext(DbContext);
    if (!ctx) throw new Error('useDb must be used within DbProvider');
    return ctx;
}
