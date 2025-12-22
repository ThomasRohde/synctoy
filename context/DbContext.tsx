import { createContext, useContext, ReactNode } from 'react';
import { db } from '../utils/storage/db';

type Database = typeof db;

const DbContext = createContext<Database | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
    return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDb(): Database {
    const ctx = useContext(DbContext);
    if (!ctx) throw new Error('useDb must be used within DbProvider');
    return ctx;
}
