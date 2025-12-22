import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { useNotificationContext } from '../context';
import type { NotificationType } from '../types';

const ICON_MAP: Record<NotificationType, typeof Info> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
};

const COLOR_MAP = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
};

export function NotificationToast() {
    const { notifications, removeNotification } = useNotificationContext();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-20 right-4 z-[3000] flex flex-col gap-2 pointer-events-none">
            {notifications.slice(-5).map(notification => (
                <div
                    key={notification.id}
                    className="
                        pointer-events-auto
                        flex items-center gap-3 px-4 py-3
                        glass-card rounded-lg shadow-xl
                        animate-slide-in-right
                        max-w-sm
                    "
                >
                    <div className={`w-8 h-8 rounded-full ${COLOR_MAP[notification.type]} flex items-center justify-center flex-shrink-0`}>
                        {(() => {
                            const IconComponent = ICON_MAP[notification.type];
                            return <IconComponent className="w-4 h-4 text-white" />;
                        })()}
                    </div>
                    <span className="text-white text-sm flex-1">{notification.message}</span>
                    <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-white/50 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
