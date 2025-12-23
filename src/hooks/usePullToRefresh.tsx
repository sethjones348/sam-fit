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
    const startTime = Date.now();
    try {
      await onRefresh();
      // Ensure spinner is visible for at least 1 second for better UX
      const elapsed = Date.now() - startTime;
      const minDelay = 1000; // 1 second minimum
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    // Only enable on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // Helper to check if we're at the top of the page
    const isAtTop = (): boolean => {
      // Check window scroll (most common on mobile)
      const windowScroll = window.scrollY || window.pageYOffset || 0;
      // Check document element scroll
      const docScroll = document.documentElement.scrollTop || 0;
      // Check body scroll
      const bodyScroll = document.body.scrollTop || 0;
      // Check element scroll if ref is set
      const element = elementRef.current;
      const elementScroll = element ? element.scrollTop : 0;
      
      // We're at top if all scroll values are at or near 0
      const scrollTop = Math.max(windowScroll, docScroll, bodyScroll, elementScroll);
      return scrollTop <= 5;
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scrollable area
      if (!isAtTop()) {
        isPulling.current = false;
        return;
      }
      
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If not pulling, don't interfere at all
      if (!isPulling.current) {
        return; // Don't prevent default, allow normal scrolling
      }
      
      // Double-check we're still at the top - if not, cancel immediately
      if (!isAtTop()) {
        isPulling.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return; // Don't prevent default, allow normal scrolling
      }
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;
      
      // Only prevent default and show pull effect when:
      // 1. We're at the top (verified by isAtTop())
      // 2. User is pulling DOWN (distance > 10 to avoid accidental triggers)
      if (distance > 10) {
        e.preventDefault();
        // Allow more flexible pulling - up to 250px for smooth feel
        const pullAmount = Math.min(distance, 250);
        pullDistanceRef.current = pullAmount;
        setPullDistance(pullAmount);
      } else {
        // User is scrolling up or not pulling enough - cancel pull state
        // Don't prevent default here - allow normal scrolling
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

    // Attach to document for better coverage
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, handleRefresh]);

  return {
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
    elementRef,
  };
}

