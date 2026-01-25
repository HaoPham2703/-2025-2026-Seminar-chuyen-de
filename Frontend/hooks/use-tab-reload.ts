import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useSegments } from 'expo-router';

// Global store để lưu scroll to top functions cho mỗi route
const scrollToTopFunctions = new Map<string, () => void>();
let lastPressTime = 0;
let lastRoute: string | null = null;

export function useTabReload(reloadFn?: () => void | Promise<void>, routeName?: string) {
  const segments = useSegments();
  const currentRoute = routeName || (segments[segments.length - 1] || 'index');
  const isFocusedRef = useRef<boolean>(false);
  const scrollViewRef = useRef<any>(null);

  // Track focus state
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
      };
    }, [])
  );

  // Expose scroll to top function
  const scrollToTop = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  // Đăng ký scroll to top function
  useEffect(() => {
    scrollToTopFunctions.set(currentRoute, scrollToTop);
    return () => {
      scrollToTopFunctions.delete(currentRoute);
    };
  }, [currentRoute, scrollToTop]);

  // Expose function để custom-tab-button có thể gọi
  useEffect(() => {
    (global as any).__getCurrentRoute = () => currentRoute;
    (global as any).__isFocused = () => isFocusedRef.current;
    (global as any).__triggerTabScrollToTop = (route: string) => {
      const fn = scrollToTopFunctions.get(route);
      if (fn) {
        fn();
      }
    };

    return () => {
      delete (global as any).__getCurrentRoute;
      delete (global as any).__isFocused;
      delete (global as any).__triggerTabScrollToTop;
    };
  }, [currentRoute]);

  return {
    scrollViewRef,
    scrollToTop,
    triggerReload: useCallback(() => {
      if (reloadFn) {
        reloadFn();
      }
    }, [reloadFn]),
  };
}

// Export function để custom-tab-button sử dụng
export function triggerTabScrollToTopIfNeeded(isSelected: boolean) {
  if (!isSelected) return;
  
  const now = Date.now();
  const currentRoute = (global as any).__getCurrentRoute?.() || 'index';
  const isFocused = (global as any).__isFocused?.() || false;
  
  // Nếu bấm lại trong vòng 500ms và đang ở tab này, scroll to top
  if (isFocused && currentRoute === lastRoute && now - lastPressTime < 500) {
    const triggerScrollToTop = (global as any).__triggerTabScrollToTop;
    if (triggerScrollToTop) {
      triggerScrollToTop(currentRoute);
    }
  }
  
  lastPressTime = now;
  lastRoute = currentRoute;
}
