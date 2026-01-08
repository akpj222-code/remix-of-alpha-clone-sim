import { useCallback } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptic() {
  const trigger = useCallback((style: HapticStyle = 'light') => {
    // Check if vibration API is available (mobile devices)
    if (!('vibrate' in navigator)) return;

    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [20, 30, 20],
      error: [30, 50, 30, 50, 30],
    };

    try {
      navigator.vibrate(patterns[style]);
    } catch {
      // Silently fail if vibration not supported
    }
  }, []);

  return { trigger };
}

// Standalone function for use outside React components
export function triggerHaptic(style: HapticStyle = 'light') {
  if (!('vibrate' in navigator)) return;

  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    warning: [20, 30, 20],
    error: [30, 50, 30, 50, 30],
  };

  try {
    navigator.vibrate(patterns[style]);
  } catch {
    // Silently fail
  }
}
