import { useNotificationContext } from '../context';

const ICON_MAP = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
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
                        <span className="material-symbols-outlined text-white text-lg">
                            {ICON_MAP[notification.type]}
                        </span>
                    </div>
                    <span className="text-white text-sm flex-1">{notification.message}</span>
                    <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-white/50 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            ))}
        </div>
    );
}
