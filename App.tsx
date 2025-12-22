import React, { Suspense } from 'react';
import {
    DbProvider,
    NotificationProvider,
    AppProvider,
    useApp,
} from './context';
import { NotificationToast, BottomNav, LoadingSpinner, AuthDialog } from './components';
import { Inbox, Composer, Settings, Setup } from './modules';
import { useViewportCssVars, useBrowserNotifications, useAuthInteraction } from './hooks';

// Route renderer component
function RouteRenderer() {
    const { route, isLoading } = useApp();

    if (isLoading) {
        return (
            <div className="min-h-[var(--app-vh)] flex items-center justify-center bg-background-dark">
                <LoadingSpinner size="lg" text="Loading..." />
            </div>
        );
    }

    // Setup doesn't show bottom nav
    if (route === 'setup') {
        return <Setup />;
    }

    return (
        <>
            <Suspense
                fallback={
                    <div className="min-h-[var(--app-vh)] flex items-center justify-center bg-background-dark">
                        <LoadingSpinner text="Loading..." />
                    </div>
                }
            >
                {route === 'inbox' && <Inbox />}
                {route === 'send' && <Composer />}
                {route === 'share' && <Composer />}
                {route === 'settings' && <Settings />}
            </Suspense>
            <BottomNav />
        </>
    );
}

// Main app with viewport handling
function AppContent() {
    useViewportCssVars();
    useBrowserNotifications();
    const authInteraction = useAuthInteraction();

    return (
        <div className="min-h-[var(--app-vh)] bg-background-dark text-white">
            <RouteRenderer />
            <NotificationToast />
            {authInteraction && <AuthDialog interaction={authInteraction} />}
        </div>
    );
}

// App wrapper with providers
const App: React.FC = () => {
    return (
        <DbProvider>
            <NotificationProvider>
                <AppProvider>
                    <AppContent />
                </AppProvider>
            </NotificationProvider>
        </DbProvider>
    );
};

export default App;
