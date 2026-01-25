import React, { ReactNode, useImperativeHandle, forwardRef } from 'react';
import { RefreshControl, ScrollView, ScrollViewProps } from 'react-native';

interface RefreshableScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshing?: boolean;
  refreshColor?: string;
}

export interface RefreshableScrollViewRef {
  scrollToTop: () => void;
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
}

export const RefreshableScrollView = forwardRef<RefreshableScrollViewRef, RefreshableScrollViewProps>(
  ({ children, onRefresh, refreshing = false, refreshColor = 'hsl(30, 55%, 55%)', ...scrollViewProps }, ref) => {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const scrollViewRef = React.useRef<ScrollView>(null);

    const handleRefresh = React.useCallback(async () => {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, [onRefresh]);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      },
      scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => {
        scrollViewRef.current?.scrollTo(options);
      },
    }));

    return (
      <ScrollView
        ref={scrollViewRef}
        {...scrollViewProps}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefreshing}
            onRefresh={handleRefresh}
            colors={[refreshColor]}
            tintColor={refreshColor}
          />
        }
      >
        {children}
      </ScrollView>
    );
  }
);

RefreshableScrollView.displayName = 'RefreshableScrollView';
