/**
 * ThợOS Premium Motion System Tokens & Variants
 * Consistent, natural, accessible animation tokens using Motion for React.
 * Respects prefers-reduced-motion automatically.
 */

// Timing tokens (ms converted to seconds for Motion)
export const MOTION_TIMINGS = {
  fast: 0.14,    // 140ms: micro-interactions, press, hover
  normal: 0.2,   // 200ms: panel transitions, tab switches
  slow: 0.28,    // 280ms: modal/sheet entrance
} as const;

// Easing curves
export const MOTION_EASINGS = {
  natural: [0.16, 1, 0.3, 1] as const,     // Fluid deceleration (ease-out)
  smooth: [0.4, 0, 0.2, 1] as const,       // Balanced standard transition
  anticipate: [0.05, 0.7, 0.1, 1] as const // Subtle responsive feel
};

// Springs
export const MOTION_SPRINGS = {
  gentle: { type: 'spring' as const, stiffness: 420, damping: 32 },
  sheet: { type: 'spring' as const, stiffness: 360, damping: 28 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 35 }
};

// Press feedback for interactive buttons
export const buttonPressProps = {
  whileTap: { scale: 0.97 },
  transition: { duration: MOTION_TIMINGS.fast, ease: MOTION_EASINGS.natural }
};

export const cardPressProps = {
  whileTap: { scale: 0.99 },
  transition: { duration: MOTION_TIMINGS.fast, ease: MOTION_EASINGS.natural }
};

// Modal Backdrop Variants
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: MOTION_TIMINGS.normal, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: MOTION_TIMINGS.fast, ease: 'easeIn' } }
};

// Centered Modal Dialog Variants
export const modalDialogVariants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRINGS.sheet
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: MOTION_TIMINGS.fast, ease: 'easeIn' }
  }
};

// Mobile Bottom Sheet Variants
export const bottomSheetVariants = {
  initial: { y: '100%', opacity: 0.5 },
  animate: {
    y: 0,
    opacity: 1,
    transition: MOTION_SPRINGS.sheet
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: MOTION_TIMINGS.normal, ease: [0.32, 0, 0.67, 0] }
  }
};

// Tab Page / Detail Panel Transitions
export const panelFadeSlideVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_TIMINGS.normal, ease: MOTION_EASINGS.natural }
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: MOTION_TIMINGS.fast, ease: 'easeIn' }
  }
};
