import { type ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Breakpoints, Palette } from '@/constants/theme';

type RightDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function RightDrawer({ open, onClose, children }: RightDrawerProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;
  const panelWidth = isDesktop ? 420 : Math.max(width - 18, 280);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, progress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.46,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * panelWidth }],
  }));

  return (
    <View
      pointerEvents={open ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, styles.layer]}
      accessibilityViewIsModal={open}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.overlay, overlayStyle]} />
      </Pressable>
      <Animated.View style={[styles.panel, { width: panelWidth }, panelStyle]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 30,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.ink,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.white,
    overflow: 'hidden',
    shadowColor: Palette.ink,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: -6, height: 0 },
    elevation: 16,
  },
});
