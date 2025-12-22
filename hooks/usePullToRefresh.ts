import { useRef, useState, useCallback, useEffect } from 'react';

interface PullToRefreshOptions {
    onRefresh: () => Promise<void> | void;
    threshold?: number;
    enabled?: boolean;
}

interface PullState {
    pullDistance: number;
    isPulling: boolean;
    isRefreshing: boolean;
}

export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    enabled = true,
}: PullToRefreshOptions) {
    const [pullState, setPullState] = useState<PullState>({
        pullDistance: 0,
        isPulling: false,
        isRefreshing: false,
    });

    const touchStart = useRef<{ x: number; y: number; scrollTop: number } | null>(null);
    const isPulling = useRef(false);
    const containerRef = useRef<HTMLElement | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;

        const container = containerRef.current;
        if (!container) return;

        const touch = e.touches[0];
        if (!touch) return;

        const scrollTop = container.scrollTop;

        // Only start pull-to-refresh if we're at the top
        if (scrollTop === 0) {
            touchStart.current = {
                x: touch.clientX,
                y: touch.clientY,
                scrollTop,
            };
        }
    }, [enabled]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || !touchStart.current) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            touchStart.current = null;
            isPulling.current = false;
            return;
        }

        const touch = e.touches[0];
        if (!touch) return;

        const deltaY = touch.clientY - touchStart.current.y;
        const deltaX = touch.clientX - touchStart.current.x;

        // Start pulling if vertical movement is greater than horizontal and pulling down
        if (!isPulling.current && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
            isPulling.current = true;
            e.preventDefault();
        }

        if (isPulling.current && deltaY > 0) {
            e.preventDefault();
            // Apply resistance curve (diminishing returns)
            const pullDistance = Math.min(deltaY * 0.5, threshold * 1.5);
            setPullState(prev => ({
                ...prev,
                pullDistance,
                isPulling: true,
            }));
        }
    }, [enabled, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!enabled || !isPulling.current) {
            setPullState({ pullDistance: 0, isPulling: false, isRefreshing: false });
            return;
        }

        const shouldRefresh = pullState.pullDistance >= threshold;

        if (shouldRefresh) {
            setPullState(prev => ({
                ...prev,
                pullDistance: threshold,
                isPulling: false,
                isRefreshing: true,
            }));

            try {
                await onRefresh();
            } finally {
                setTimeout(() => {
                    setPullState({
                        pullDistance: 0,
                        isPulling: false,
                        isRefreshing: false,
                    });
                }, 300);
            }
        } else {
            setPullState({
                pullDistance: 0,
                isPulling: false,
                isRefreshing: false,
            });
        }

        touchStart.current = null;
        isPulling.current = false;
    }, [enabled, pullState.pullDistance, threshold, onRefresh]);

    useEffect(() => {
        return () => {
            touchStart.current = null;
            isPulling.current = false;
        };
    }, []);

    const setContainerRef = useCallback((element: HTMLElement | null) => {
        containerRef.current = element;
    }, []);

    return {
        pullState,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchEnd,
        },
        setContainerRef,
    };
}
