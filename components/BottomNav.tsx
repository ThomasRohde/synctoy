import { useApp } from '../context';
import type { Route } from '../types';

interface NavItem {
    id: Route;
    icon: string;
    label: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'inbox', icon: 'inbox', label: 'Inbox' },
    { id: 'send', icon: 'send', label: 'Send' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
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
                            <span
                                className="material-symbols-outlined text-2xl"
                                style={{
                                    fontVariationSettings: isActive
                                        ? "'FILL' 1, 'wght' 500"
                                        : "'FILL' 0, 'wght' 400",
                                }}
                            >
                                {item.icon}
                            </span>
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
