import { CloudOff, CloudSync, CloudCheck, RotateCw, WifiOff, HelpCircle, ArrowLeft, LucideIcon } from 'lucide-react';
import { useApp } from '../context';
import { useSyncState, type SyncStatus } from '../hooks';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    actions?: React.ReactNode;
    showSyncStatus?: boolean;
}

function getSyncIndicator(status: SyncStatus): { color: string; icon: LucideIcon; title: string } {
    switch (status) {
        case 'local-only':
            return { color: 'text-gray-500', icon: CloudOff, title: 'Local-only mode' };
        case 'connecting':
            return { color: 'text-yellow-400 animate-pulse', icon: CloudSync, title: 'Connecting...' };
        case 'connected':
            return { color: 'text-green-400', icon: CloudCheck, title: 'Synced' };
        case 'syncing':
            return { color: 'text-blue-400 animate-pulse', icon: RotateCw, title: 'Syncing...' };
        case 'offline':
            return { color: 'text-amber-500', icon: WifiOff, title: 'Offline' };
        case 'disconnected':
            return { color: 'text-orange-400', icon: CloudOff, title: 'Disconnected' };
        case 'error':
            return { color: 'text-red-400', icon: CloudOff, title: 'Sync error' };
        default:
            return { color: 'text-gray-500', icon: HelpCircle, title: 'Unknown' };
    }
}

export function Header({ title, subtitle, showBack, onBack, actions, showSyncStatus = true }: HeaderProps) {
    const { navigate } = useApp();
    const syncState = useSyncState();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('inbox');
        }
    };

    const syncIndicator = getSyncIndicator(syncState.status);
    const SyncIcon = syncIndicator.icon;

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10"
            style={{
                height: 'var(--nav-height)',
                paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
        >
            <div className="flex items-center justify-between h-full px-4 max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <button
                            onClick={handleBack}
                            className="p-2.5 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-lg font-semibold">{title}</h1>
                        {subtitle && (
                            <p className="text-xs text-gray-400">{subtitle}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {showSyncStatus && (
                        <SyncIcon
                            className={`w-5 h-5 ${syncIndicator.color}`}
                            title={syncIndicator.title}
                        />
                    )}
                    {actions}
                </div>
            </div>
        </header>
    );
}
