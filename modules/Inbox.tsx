import { useMemo, useState } from 'react';
import { useApp } from '../context';
import { useHandoffItems, usePullToRefresh } from '../hooks';
import { Header, FilterTabs, HandoffItemCard, EmptyState, LoadingSpinner } from '../components';

export function Inbox() {
    const { deviceProfile, inboxFilter, setInboxFilter, refreshTrigger, navigate, refreshItems } = useApp();
    const [searchQuery, setSearchQuery] = useState('');

    const { items, isLoading } = useHandoffItems(
        inboxFilter,
        deviceProfile.category,
        refreshTrigger
    );

    // Pull-to-refresh gesture
    const { pullState, handlers: pullHandlers, setContainerRef } = usePullToRefresh({
        onRefresh: async () => {
            await refreshItems();
        },
        threshold: 80,
        enabled: !isLoading,
    });

    // Calculate counts for filter badges
    const counts = useMemo(() => {
        // We need all items to calculate counts properly
        return {
            new: items.filter(i => i.status === 'new').length,
            active: items.filter(i => ['new', 'opened', 'done'].includes(i.status)).length,
            archived: items.filter(i => i.status === 'archived').length,
            all: items.length,
        };
    }, [items]);

    const filteredItems = useMemo(() => {
        // First filter by status
        let filtered = items;
        switch (inboxFilter) {
            case 'new':
                filtered = items.filter(i => i.status === 'new');
                break;
            case 'active':
                filtered = items.filter(i => ['new', 'opened', 'done'].includes(i.status));
                break;
            case 'archived':
                filtered = items.filter(i => i.status === 'archived');
                break;
        }

        // Then filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                // Search in URL
                if (item.url && item.url.toLowerCase().includes(query)) return true;

                // Search in text content
                if (item.text && item.text.toLowerCase().includes(query)) return true;

                // Search in preview (for encrypted items or generated previews)
                if (item.preview && item.preview.toLowerCase().includes(query)) return true;

                // Search in source device name
                if (item.source?.toLowerCase().includes(query)) return true;

                return false;
            });
        }

        return filtered;
    }, [items, inboxFilter, searchQuery]);

    const getEmptyMessage = () => {
        // If searching and no results
        if (searchQuery.trim()) {
            return {
                icon: 'search_off',
                title: 'No results found',
                description: `No items match "${searchQuery}". Try a different search term.`,
            };
        }

        switch (inboxFilter) {
            case 'new':
                return {
                    icon: 'mark_email_read',
                    title: 'All caught up!',
                    description: 'No new items waiting for you.',
                };
            case 'active':
                return {
                    icon: 'inbox',
                    title: 'Inbox is empty',
                    description: 'Send something from another device to get started.',
                };
            case 'archived':
                return {
                    icon: 'archive',
                    title: 'No archived items',
                    description: 'Items you archive will appear here.',
                };
            default:
                return {
                    icon: 'inbox',
                    title: 'No items yet',
                    description: 'Start by sending your first handoff.',
                };
        }
    };

    return (
        <div className="min-h-[var(--app-vh)] bg-background-dark">
            <Header
                title="Inbox"
                subtitle={`${deviceProfile.deviceName} • ${deviceProfile.category}`}
            />

            <main
                ref={setContainerRef}
                className="pt-[var(--nav-height)] pb-[calc(var(--bottom-nav-height)+16px)] px-4 overflow-y-auto"
                style={{
                    height: '100vh',
                    maxHeight: 'var(--app-vh)',
                }}
                {...pullHandlers}
            >
                {/* Pull-to-refresh indicator */}
                {(pullState.isPulling || pullState.isRefreshing) && (
                    <div
                        className="flex items-center justify-center transition-all"
                        style={{
                            height: `${pullState.pullDistance}px`,
                            opacity: Math.min(pullState.pullDistance / 80, 1),
                        }}
                    >
                        <span
                            className={`material-symbols-outlined text-primary ${
                                pullState.isRefreshing ? 'animate-spin' : ''
                            }`}
                        >
                            {pullState.isRefreshing ? 'sync' : 'refresh'}
                        </span>
                    </div>
                )}

                <div className="max-w-2xl mx-auto">
                    {/* Filter tabs */}
                    <div className="py-4 sticky top-[var(--nav-height)] z-10 bg-background-dark">
                        <FilterTabs
                            value={inboxFilter}
                            onChange={setInboxFilter}
                            counts={counts}
                        />
                    </div>

                    {/* Search box */}
                    <div className="pb-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-2.5 bg-card-dark border border-border-color rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                                    aria-label="Clear search"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        close
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="py-16">
                            <LoadingSpinner text="Loading items..." />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <EmptyState
                            {...getEmptyMessage()}
                            action={{
                                label: 'Send something',
                                onClick: () => navigate('send'),
                            }}
                        />
                    ) : (
                        <div className="space-y-3 pb-4">
                            {filteredItems.map(item => (
                                <HandoffItemCard
                                    key={item.id}
                                    item={item}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
