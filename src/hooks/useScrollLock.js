import { useEffect, useCallback } from 'react';

/**
 * Hook to lock body scroll when a modal/popup is open.
 * Handles scroll position preservation and touchmove blocking for mobile.
 */
export const useScrollLock = (isLocked) => {
    const lock = useCallback(() => {
        const scrollPosition = window.scrollY;
        document.body.style.top = `-${scrollPosition}px`;
        document.body.classList.add('modal-open');
        document.body.dataset.scrollPos = scrollPosition;
    }, []);

    const unlock = useCallback(() => {
        const scrollPosition = parseInt(document.body.dataset.scrollPos || '0', 10);
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollPosition);
    }, []);

    useEffect(() => {
        if (isLocked) {
            lock();
        } else {
            unlock();
        }

        // Cleanup on unmount
        return () => {
            if (isLocked) {
                unlock();
            }
        };
    }, [isLocked, lock, unlock]);

    // Touch gesture blocking for iOS
    useEffect(() => {
        if (!isLocked) return;

        const preventTouch = (e) => {
            // Only prevent if the target is NOT inside a scrollable modal content
            if (!e.target.closest('.modal-content')) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchmove', preventTouch, { passive: false });

        return () => {
            document.removeEventListener('touchmove', preventTouch);
        };
    }, [isLocked]);
};
