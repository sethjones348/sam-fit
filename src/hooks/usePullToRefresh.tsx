import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  threshold?: number;
}

export function usePullToRefresh({ 
  onRefresh, 
  enabled = true,
  threshold = 80 
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const pullDistanceRef = useRef<number>(0);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    // Only enable on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const element = elementRef.current || document.documentElement;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scrollable area (with small tolerance)
      const isAtTop = element.scrollTop <= 5;
      
      if (!isAtTop) {
        isPulling.current = false;
        return;
      }
      
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Always allow normal scrolling - don't interfere if not pulling
      if (!isPulling.current) return;
      
      // Double-check we're still at the top
      const isAtTop = element.scrollTop <= 5;
      if (!isAtTop) {
        isPulling.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;
      
      // Only prevent default and show pull effect when:
      // 1. We're at the top (scrollTop <= 5)
      // 2. User is pulling DOWN (distance > 0)
      // 3. We haven't scrolled away from top
      if (distance > 0 && isAtTop) {
        e.preventDefault();
        const pullAmount = Math.min(distance, threshold * 1.5);
        pullDistanceRef.current = pullAmount;
        setPullDistance(pullAmount);
      } else if (distance <= 0) {
        // User is scrolling up or not pulling - cancel pull state
        isPulling.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;
      
      const finalDistance = pullDistanceRef.current;
      isPulling.current = false;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      
      if (finalDistance >= threshold) {
        handleRefresh();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, handleRefresh]);

  return {
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
    elementRef,
  };
}

