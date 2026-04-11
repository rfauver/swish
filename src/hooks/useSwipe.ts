import { useEffect, useRef } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * Returns a ref to attach to an element. Calls onSwipeLeft / onSwipeRight
 * when the user swipes horizontally with enough distance and more horizontal
 * than vertical movement (so normal scrolling isn't intercepted).
 */
export function useSwipe<T extends HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
}: SwipeHandlers) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      // Require at least 50px horizontal and more horizontal than vertical
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);

  return ref;
}
