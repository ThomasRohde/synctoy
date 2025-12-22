import type { InboxFilter } from '../types';

interface FilterTabsProps {
    value: InboxFilter;
    onChange: (filter: InboxFilter) => void;
    counts?: {
        new: number;
        active: number;
        archived: number;
        all: number;
    };
}

const FILTERS: { id: InboxFilter; label: string }[] = [
    { id: 'new', label: 'New' },
    { id: 'active', label: 'Active' },
    { id: 'archived', label: 'Archived' },
    { id: 'all', label: 'All' },
];

export function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
    return (
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
            {FILTERS.map(filter => {
                const isActive = value === filter.id;
                const count = counts?.[filter.id];

                return (
                    <button
                        key={filter.id}
                        onClick={() => onChange(filter.id)}
                        className={`
                            flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-md text-sm font-medium
                            transition-colors duration-150
                            ${isActive
                                ? 'bg-primary text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }
                        `}
                    >
                        {filter.label}
                        {count !== undefined && count > 0 && (
                            <span className={`
                                px-1.5 py-0.5 text-xs rounded-full
                                ${isActive ? 'bg-white/20' : 'bg-white/10'}
                            `}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
