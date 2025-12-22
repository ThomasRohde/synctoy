import { Inbox, Send, Settings } from 'lucide-react';
import { useApp } from '../context';
import type { Route } from '../types';

interface NavItem {
    id: Route;
    icon: typeof Inbox;
    label: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'inbox', icon: Inbox, label: 'Inbox' },
    { id: 'send', icon: Send, label: 'Send' },
    { id: 'settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
    const { route, navigate } = useApp();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/10"
            style={{
                height: 'var(--bottom-nav-height)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <div className="flex items-center justify-around h-full max-w-md mx-auto">
                {NAV_ITEMS.map(item => {
                    const isActive = route === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.id)}
                            className={`
                                flex flex-col items-center justify-center
                                w-20 h-full min-h-[44px]
                                transition-colors duration-150
                                ${isActive ? 'text-primary' : 'text-gray-400 hover:text-white'}
                            `}
                        >
                            <item.icon
                                className="w-6 h-6"
                                strokeWidth={isActive ? 2.5 : 2}
                                fill={isActive ? 'currentColor' : 'none'}
                            />
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
