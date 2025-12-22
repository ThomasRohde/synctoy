import React from 'react';

interface UpdatePromptProps {
    needsRefresh: boolean;
    offlineReady: boolean;
    onUpdate: () => void;
    onDismiss: () => void;
}

/**
 * Toast-style prompt shown when a new version of the app is available.
 */
export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
    needsRefresh,
    offlineReady,
    onUpdate,
    onDismiss,
}) => {
    // Don't show if there's nothing to display
    if (!needsRefresh && !offlineReady) {
        return null;
    }

    return (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
            <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4 max-w-sm w-full pointer-events-auto animate-slide-down">
                {needsRefresh ? (
                    <>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-blue-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium text-sm">Update Available</h3>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    A new version is ready. Refresh to update.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={onDismiss}
                                className="flex-1 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Later
                            </button>
                            <button
                                onClick={onUpdate}
                                className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                            >
                                Refresh Now
                            </button>
                        </div>
                    </>
                ) : offlineReady ? (
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm">Ready for Offline</h3>
                            <p className="text-slate-400 text-xs mt-0.5">
                                App cached and works offline.
                            </p>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="text-slate-400 hover:text-white p-1"
                            aria-label="Dismiss"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
