import { useRef, useState, useCallback, useEffect } from 'react';

interface SwipeGestureOptions {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    threshold?: number;
    enabled?: boolean;
}

interface SwipeState {
    offsetX: number;
    isSwiping: boolean;
    direction: 'left' | 'right' | null;
}

export function useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold = 100,
    enabled = true,
}: SwipeGestureOptions) {
    const [swipeState, setSwipeState] = useState<SwipeState>({
        offsetX: 0,
        isSwiping: false,
        direction: null,
    });

    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const touchCurrent = useRef<{ x: number; y: number } | null>(null);
    const isDragging = useRef(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;

        const touch = e.touches[0];
        if (!touch) return;

        touchStart.current = { x: touch.clientX, y: touch.clientY };
        touchCurrent.current = { x: touch.clientX, y: touch.clientY };
        isDragging.current = false;
    }, [enabled]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || !touchStart.current || !touchCurrent.current) return;

        const touch = e.touches[0];
        if (!touch) return;

        touchCurrent.current = { x: touch.clientX, y: touch.clientY };

        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;

        // Start dragging if horizontal movement is greater than vertical
        if (!isDragging.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            isDragging.current = true;
            e.preventDefault();
        }

        if (isDragging.current) {
            e.preventDefault();
            const direction = deltaX < 0 ? 'left' : 'right';
            setSwipeState({
                offsetX: deltaX,
                isSwiping: true,
                direction,
            });
        }
    }, [enabled]);

    const handleTouchEnd = useCallback(() => {
        if (!enabled || !isDragging.current) {
            setSwipeState({ offsetX: 0, isSwiping: false, direction: null });
            return;
        }

        const offsetX = swipeState.offsetX;

        // Check if swipe threshold was reached
        if (Math.abs(offsetX) >= threshold) {
            if (offsetX < 0 && onSwipeLeft) {
                onSwipeLeft();
            } else if (offsetX > 0 && onSwipeRight) {
                onSwipeRight();
            }
        }

        // Reset state
        touchStart.current = null;
        touchCurrent.current = null;
        isDragging.current = false;
        setSwipeState({ offsetX: 0, isSwiping: false, direction: null });
    }, [enabled, swipeState.offsetX, threshold, onSwipeLeft, onSwipeRight]);

    useEffect(() => {
        return () => {
            touchStart.current = null;
            touchCurrent.current = null;
            isDragging.current = false;
        };
    }, []);

    return {
        swipeState,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchEnd,
        },
    };
}
