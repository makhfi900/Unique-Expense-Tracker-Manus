/**
 * Professional Mobile-First Design System
 * Cohesive design tokens and utilities for modern expense tracking
 */

// Enhanced Color System with professional palette and proper contrast
export const colors = {
  // Primary brand colors - Modern blue gradient system
  brand: {
    primary: 'hsl(220, 90%, 56%)',          // #2563EB - Professional blue
    primaryHover: 'hsl(220, 90%, 52%)',     // #1E40AF - Darker on hover
    primaryLight: 'hsl(220, 90%, 97%)',     // #EFF6FF - Light background
    primaryForeground: 'hsl(0, 0%, 100%)',  // #FFFFFF - White text
    primaryMuted: 'hsl(220, 40%, 88%)',     // Muted variant
  },
  
  // Success states - Refined emerald palette
  success: {
    DEFAULT: 'hsl(160, 84%, 39%)',          // #059669 - Professional emerald
    hover: 'hsl(160, 84%, 35%)',            // #047857 - Darker on hover
    light: 'hsl(160, 84%, 96%)',            // #ECFDF5 - Light background
    foreground: 'hsl(0, 0%, 100%)',         // White text
    muted: 'hsl(160, 40%, 85%)',            // Muted variant
  },
  
  // Warning states - Warm amber system
  warning: {
    DEFAULT: 'hsl(43, 96%, 56%)',           // #F59E0B - Professional amber
    hover: 'hsl(43, 96%, 52%)',             // #D97706 - Darker on hover
    light: 'hsl(43, 96%, 95%)',             // #FEF3C7 - Light background
    foreground: 'hsl(43, 30%, 15%)',        // Dark text for contrast
    muted: 'hsl(43, 50%, 85%)',             // Muted variant
  },
  
  // Error states - Professional red system
  error: {
    DEFAULT: 'hsl(0, 72%, 51%)',            // #DC2626 - Professional red
    hover: 'hsl(0, 72%, 47%)',              // #B91C1C - Darker on hover
    light: 'hsl(0, 72%, 96%)',              // #FEF2F2 - Light background
    foreground: 'hsl(0, 0%, 100%)',         // White text
    muted: 'hsl(0, 40%, 85%)',              // Muted variant
  },
  
  // Professional neutral system with proper contrast ratios
  neutral: {
    0: 'hsl(0, 0%, 100%)',        // Pure white
    50: 'hsl(210, 20%, 98%)',     // #FAFAFA - Very light gray
    100: 'hsl(210, 20%, 96%)',    // #F4F4F5 - Light gray
    200: 'hsl(210, 16%, 93%)',    // #E4E4E7 - Light gray
    300: 'hsl(210, 14%, 89%)',    // #D4D4D8 - Medium light gray
    400: 'hsl(210, 14%, 83%)',    // #A1A1AA - Medium gray
    500: 'hsl(210, 11%, 71%)',    // #71717A - Medium gray
    600: 'hsl(210, 7%, 56%)',     // #52525B - Dark medium gray
    700: 'hsl(210, 9%, 31%)',     // #3F3F46 - Dark gray
    800: 'hsl(210, 10%, 23%)',    // #27272A - Very dark gray
    900: 'hsl(210, 11%, 15%)',    // #18181B - Almost black
    950: 'hsl(210, 24%, 6%)',     // #09090B - Near black
  },
  
  // Enhanced expense category colors with better semantics
  categories: {
    // Food & Dining - Warm orange
    food: {
      color: 'hsl(24, 95%, 53%)',         // #FF6B35
      light: 'hsl(24, 95%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    // Transportation - Professional blue
    transport: {
      color: 'hsl(220, 90%, 56%)',        // #2563EB
      light: 'hsl(220, 90%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    // Shopping - Vibrant purple
    shopping: {
      color: 'hsl(271, 91%, 65%)',        // #A855F7
      light: 'hsl(271, 91%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    // Bills & Utilities - Professional red
    bills: {
      color: 'hsl(0, 72%, 51%)',          // #DC2626
      light: 'hsl(0, 72%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    // Entertainment - Fresh green
    entertainment: {
      color: 'hsl(160, 84%, 39%)',        // #059669
      light: 'hsl(160, 84%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    // Health & Medical - Calming teal
    health: {
      color: 'hsl(172, 66%, 50%)',        // #14B8A6
      light: 'hsl(172, 66%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    // Education - Warm yellow
    education: {
      color: 'hsl(43, 96%, 56%)',         // #F59E0B
      light: 'hsl(43, 96%, 95%)',
      foreground: 'hsl(43, 30%, 15%)',
    },
    // Other/Miscellaneous - Neutral gray
    other: {
      color: 'hsl(210, 7%, 56%)',         // #52525B
      light: 'hsl(210, 7%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    // Income - Bright green
    income: {
      color: 'hsl(142, 71%, 45%)',        // #16A34A
      light: 'hsl(142, 71%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
  }
};

// Enhanced Typography System - Mobile-First with Perfect Readability
export const typography = {
  // Font families with system font stack optimization
  fontFamily: {
    sans: [
      'Inter', 
      '-apple-system', 
      'BlinkMacSystemFont', 
      'Segoe UI', 
      'Roboto', 
      'Helvetica Neue', 
      'Arial', 
      'sans-serif'
    ],
    mono: [
      'SF Mono', 
      'Monaco', 
      'Inconsolata', 
      'Roboto Mono', 
      'ui-monospace', 
      'SFMono-Regular', 
      'Menlo', 
      'Consolas', 
      'monospace'
    ],
    display: [
      'Inter', 
      'ui-sans-serif', 
      'system-ui', 
      '-apple-system', 
      'sans-serif'
    ],
  },
  
  // Mobile-optimized font sizes with perfect line heights and letter spacing
  fontSize: {
    // Micro text for labels and metadata
    xs: { 
      size: '0.75rem',        // 12px
      lineHeight: '1.25',     // 15px - Improved readability
      letterSpacing: '0.025em',
      fontWeight: '400',
    },
    // Small text for secondary content
    sm: { 
      size: '0.875rem',       // 14px
      lineHeight: '1.43',     // 20px - Golden ratio
      letterSpacing: '0.01em',
      fontWeight: '400',
    },
    // Base text - Mobile optimized
    base: { 
      size: '1rem',           // 16px - Minimum for mobile readability
      lineHeight: '1.5',      // 24px - Perfect for body text
      letterSpacing: '0em',
      fontWeight: '400',
    },
    // Large text for emphasis
    lg: { 
      size: '1.125rem',       // 18px
      lineHeight: '1.56',     // 28px
      letterSpacing: '-0.01em',
      fontWeight: '500',
    },
    // Extra large for card amounts
    xl: { 
      size: '1.25rem',        // 20px
      lineHeight: '1.4',      // 28px
      letterSpacing: '-0.015em',
      fontWeight: '600',
    },
    // 2xl for primary amounts
    '2xl': { 
      size: '1.5rem',         // 24px
      lineHeight: '1.33',     // 32px
      letterSpacing: '-0.02em',
      fontWeight: '700',
    },
    // 3xl for prominent displays
    '3xl': { 
      size: '1.875rem',       // 30px
      lineHeight: '1.27',     // 38px
      letterSpacing: '-0.025em',
      fontWeight: '700',
    },
    // 4xl for headers
    '4xl': { 
      size: '2.25rem',        // 36px
      lineHeight: '1.22',     // 44px
      letterSpacing: '-0.03em',
      fontWeight: '800',
    },
    // 5xl for hero text
    '5xl': { 
      size: '3rem',           // 48px
      lineHeight: '1.17',     // 56px
      letterSpacing: '-0.035em',
      fontWeight: '800',
    },
  },
  
  // Professional font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Refined letter spacing for different contexts
  letterSpacing: {
    tighter: '-0.05em',     // Dense display text
    tight: '-0.025em',      // Headlines
    normal: '0em',          // Body text
    wide: '0.025em',        // Labels and buttons
    wider: '0.05em',        // All caps text
    widest: '0.1em',        // Tracking for small caps
  }
};

// Professional Spacing System (8px base grid with mobile-first approach)
export const spacing = {
  // Micro spacing (0-4px)
  0: '0px',
  px: '1px',       // Border widths
  0.5: '0.125rem', // 2px - Fine adjustments
  
  // Base spacing (4px increments)
  1: '0.25rem',    // 4px  - Minimal spacing
  2: '0.5rem',     // 8px  - Base unit
  3: '0.75rem',    // 12px - Small spacing
  4: '1rem',       // 16px - Medium spacing
  5: '1.25rem',    // 20px - Large spacing
  6: '1.5rem',     // 24px - Extra large spacing
  
  // Layout spacing (8px multiples for better rhythm)
  7: '1.75rem',    // 28px - Section spacing
  8: '2rem',       // 32px - Component spacing
  10: '2.5rem',    // 40px - Large component spacing
  12: '3rem',      // 48px - Section dividers
  14: '3.5rem',    // 56px - Card spacing
  16: '4rem',      // 64px - Large sections
  
  // Layout containers
  20: '5rem',      // 80px  - Container spacing
  24: '6rem',      // 96px  - Page sections
  28: '7rem',      // 112px - Hero sections
  32: '8rem',      // 128px - Large layouts
  36: '9rem',      // 144px - Extra large layouts
  40: '10rem',     // 160px - Page dividers
  
  // Mobile-specific touch targets and safe areas
  touch: {
    minimum: '44px',     // Minimum touch target (iOS HIG)
    comfortable: '48px', // Comfortable touch target
    large: '56px',       // Large touch target
    safe: '16px',        // Safe area around touch targets
  },
  
  // Container widths for responsive design
  container: {
    xs: '20rem',     // 320px - Extra small devices
    sm: '24rem',     // 384px - Small devices
    md: '28rem',     // 448px - Medium devices
    lg: '32rem',     // 512px - Large devices
    xl: '36rem',     // 576px - Extra large devices
    '2xl': '42rem',  // 672px - Double extra large
    '3xl': '48rem',  // 768px - Triple extra large
  }
};

// Modern Border Radius System - Sleek and consistent
export const borderRadius = {
  none: '0px',
  xs: '0.125rem',   // 2px  - Minimal rounding
  sm: '0.25rem',    // 4px  - Small components
  DEFAULT: '0.5rem',    // 8px  - Standard cards and buttons
  md: '0.75rem',    // 12px - Medium components
  lg: '1rem',       // 16px - Large cards
  xl: '1.25rem',    // 20px - Extra large components
  '2xl': '1.5rem',  // 24px - Hero elements
  '3xl': '2rem',    // 32px - Special emphasis
  full: '9999px',   // Perfect circles
  
  // Component-specific radius
  button: '0.5rem',     // 8px  - Button radius
  card: '1rem',         // 16px - Card radius
  input: '0.5rem',      // 8px  - Input field radius
  badge: '9999px',      // Full - Pill shape
  modal: '1.25rem',     // 20px - Modal radius
};

// Professional Shadow System with Layered Depth
export const shadows = {
  // Base shadows - Subtle and elegant
  none: '0 0 #0000',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 2px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px 0 rgb(0 0 0 / 0.04)',
  DEFAULT: '0 4px 8px 0 rgb(0 0 0 / 0.08), 0 2px 4px 0 rgb(0 0 0 / 0.04)',
  md: '0 8px 16px 0 rgb(0 0 0 / 0.08), 0 4px 8px 0 rgb(0 0 0 / 0.04)',
  lg: '0 16px 32px 0 rgb(0 0 0 / 0.10), 0 8px 16px 0 rgb(0 0 0 / 0.06)',
  xl: '0 24px 48px 0 rgb(0 0 0 / 0.12), 0 12px 24px 0 rgb(0 0 0 / 0.08)',
  '2xl': '0 32px 64px 0 rgb(0 0 0 / 0.15), 0 16px 32px 0 rgb(0 0 0 / 0.10)',
  
  // Inner shadows for depth
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  innerLg: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.08)',
  
  // Mobile-specific shadows (optimized for smaller screens)
  mobile: {
    card: '0 2px 8px 0 rgb(0 0 0 / 0.06), 0 1px 4px 0 rgb(0 0 0 / 0.04)',
    cardHover: '0 8px 24px 0 rgb(0 0 0 / 0.12), 0 4px 12px 0 rgb(0 0 0 / 0.08)',
    fab: '0 6px 20px 0 rgb(0 0 0 / 0.15), 0 2px 8px 0 rgb(0 0 0 / 0.08)',
    modal: '0 20px 40px 0 rgb(0 0 0 / 0.20), 0 8px 16px 0 rgb(0 0 0 / 0.12)',
  },
  
  // Colored glows for brand elements (reduced opacity for sophistication)
  glow: {
    primary: '0 0 20px 0 hsl(220, 90%, 56% / 0.15)',
    success: '0 0 20px 0 hsl(160, 84%, 39% / 0.15)',
    warning: '0 0 20px 0 hsl(43, 96%, 56% / 0.15)',
    error: '0 0 20px 0 hsl(0, 72%, 51% / 0.15)',
  },
  
  // Neumorphic shadows for modern UI elements
  neumorphic: {
    raised: '6px 6px 12px rgb(0 0 0 / 0.08), -6px -6px 12px rgb(255 255 255 / 0.8)',
    pressed: 'inset 4px 4px 8px rgb(0 0 0 / 0.08), inset -4px -4px 8px rgb(255 255 255 / 0.8)',
    flat: '2px 2px 4px rgb(0 0 0 / 0.06), -2px -2px 4px rgb(255 255 255 / 0.7)',
  }
};

// Professional Animation System with Mobile-Optimized Timing
export const animation = {
  // Duration scales optimized for mobile performance
  duration: {
    instant: '0ms',         // Immediate feedback
    fast: '150ms',         // Quick interactions
    DEFAULT: '200ms',      // Standard transitions
    medium: '300ms',       // Moderate animations
    slow: '500ms',         // Deliberate animations
    slower: '700ms',       // Emphasis animations
    slowest: '1000ms',     // Hero animations
  },
  
  // Professional easing curves
  easing: {
    // Standard easings
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Ease out
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',             // Ease in
    out: 'cubic-bezier(0, 0, 0.2, 1)',            // Ease out
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',        // Ease in-out
    
    // Branded easings for specific interactions
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // Spring bounce
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',    // Smooth transition
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',              // Sharp transition
    
    // Mobile-optimized easings
    mobile: {
      tap: 'cubic-bezier(0.4, 0, 1, 1)',           // Quick tap response
      swipe: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth swipe
      elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Elastic feedback
    }
  },
  
  // Pre-defined animation variants for common patterns
  variants: {
    // Micro-interactions
    tap: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      scale: '0.95',
    },
    hover: {
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      transform: 'translateY(-2px)',
    },
    focus: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // Page transitions
    fadeIn: {
      duration: '300ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      opacity: '0 to 1',
    },
    slideUp: {
      duration: '300ms',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      transform: 'translateY(20px) to translateY(0)',
    },
    slideDown: {
      duration: '300ms',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      transform: 'translateY(-20px) to translateY(0)',
    },
    
    // Loading states
    pulse: {
      duration: '2000ms',
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      iterationCount: 'infinite',
    },
    spin: {
      duration: '1000ms',
      easing: 'linear',
      iterationCount: 'infinite',
    },
  }
};

// Breakpoint System
export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Touch Target Sizes (accessibility)
export const touchTargets = {
  minimum: '44px',    // Minimum touch target size
  comfortable: '48px', // Comfortable touch target
  large: '56px',      // Large touch target
};

// Professional Component Specifications - Mobile-First Design
export const components = {
  // Enhanced Card System
  card: {
    // Mobile-optimized padding
    padding: {
      xs: spacing[3],          // 12px - Compact cards
      sm: spacing[4],          // 16px - Small cards
      DEFAULT: spacing[5],     // 20px - Standard cards
      lg: spacing[6],          // 24px - Large cards
      xl: spacing[8],          // 32px - Hero cards
    },
    // Consistent border radius
    borderRadius: {
      DEFAULT: borderRadius.card,    // 16px - Standard
      sm: borderRadius.DEFAULT,      // 8px  - Compact
      lg: borderRadius.xl,           // 20px - Large
    },
    // Layered shadow system
    shadow: {
      DEFAULT: shadows.mobile.card,       // Subtle mobile shadow
      hover: shadows.mobile.cardHover,    // Elevated hover state
      active: shadows.sm,                 // Pressed state
      selected: shadows.glow.primary,     // Selection glow
    }
  },
  
  // Professional Button System
  button: {
    // Touch-optimized heights
    height: {
      sm: spacing.touch.minimum,       // 44px - Minimum touch target
      DEFAULT: spacing.touch.comfortable, // 48px - Comfortable
      lg: spacing.touch.large,         // 56px - Large touch target
      xl: '64px',                      // 64px - Extra large
    },
    // Balanced padding
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`,      // 8px 16px
      DEFAULT: `${spacing[3]} ${spacing[5]}`, // 12px 20px
      lg: `${spacing[4]} ${spacing[6]}`,      // 16px 24px
      xl: `${spacing[5]} ${spacing[8]}`,      // 20px 32px
    },
    // Consistent radius
    borderRadius: {
      DEFAULT: borderRadius.button,    // 8px - Standard
      sm: borderRadius.sm,             // 4px - Compact
      lg: borderRadius.lg,             // 16px - Large
      full: borderRadius.full,         // Pill shape
    }
  },
  
  // Enhanced Input System
  input: {
    // Touch-friendly heights
    height: {
      sm: '40px',                      // 40px - Compact
      DEFAULT: spacing.touch.minimum,   // 44px - Standard
      lg: spacing.touch.comfortable,    // 48px - Comfortable
      xl: spacing.touch.large,         // 56px - Large
    },
    // Appropriate padding
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,      // 8px 12px
      DEFAULT: `${spacing[3]} ${spacing[4]}`, // 12px 16px
      lg: `${spacing[4]} ${spacing[5]}`,      // 16px 20px
    },
    // Consistent radius
    borderRadius: {
      DEFAULT: borderRadius.input,     // 8px - Standard
      sm: borderRadius.sm,             // 4px - Compact
      lg: borderRadius.md,             // 12px - Large
    }
  },
  
  // Floating Action Button
  fab: {
    size: {
      sm: spacing.touch.comfortable,   // 48px - Small FAB
      DEFAULT: spacing.touch.large,    // 56px - Standard FAB
      lg: '64px',                      // 64px - Large FAB
    },
    shadow: {
      DEFAULT: shadows.mobile.fab,     // Prominent shadow
      hover: shadows.lg,               // Elevated hover
      active: shadows.md,              // Pressed state
    },
    borderRadius: {
      DEFAULT: borderRadius.full,      // Perfect circle
    }
  },
  
  // Badge System
  badge: {
    padding: {
      DEFAULT: `${spacing[1]} ${spacing[2]}`,  // 4px 8px
      sm: `${spacing[0.5]} ${spacing[2]}`,     // 2px 8px
      lg: `${spacing[2]} ${spacing[3]}`,       // 8px 12px
    },
    borderRadius: {
      DEFAULT: borderRadius.badge,     // Pill shape
      square: borderRadius.sm,         // 4px for square badges
    },
    fontSize: {
      sm: typography.fontSize.xs,      // 12px
      DEFAULT: typography.fontSize.sm,  // 14px
      lg: typography.fontSize.base,    // 16px
    }
  },
  
  // Modal System
  modal: {
    borderRadius: {
      DEFAULT: borderRadius.modal,     // 20px
      sm: borderRadius.lg,             // 16px
      lg: borderRadius['2xl'],         // 24px
    },
    shadow: {
      DEFAULT: shadows.mobile.modal,   // Strong modal shadow
    },
    padding: {
      DEFAULT: spacing[6],             // 24px
      sm: spacing[4],                  // 16px
      lg: spacing[8],                  // 32px
    }
  }
};

// Professional Utility Functions for Mobile-First Design
export const utils = {
  // Enhanced focus ring with better accessibility
  focusRing: (color = colors.brand.primary, size = '3px') => ({
    outline: 'none',
    boxShadow: `0 0 0 ${size} ${color}30`, // 30% opacity for subtlety
    transition: `box-shadow ${animation.duration.fast} ${animation.easing.DEFAULT}`,
  }),
  
  // Mobile-optimized hover states
  hoverState: (scale = 1.02, translateY = '-2px') => ({
    transform: `scale(${scale}) translateY(${translateY})`,
    transition: `transform ${animation.duration.DEFAULT} ${animation.easing.smooth}`,
  }),
  
  // Touch-optimized active states
  activeState: (scale = 0.96) => ({
    transform: `scale(${scale})`,
    transition: `transform ${animation.duration.fast} ${animation.easing.mobile.tap}`,
  }),
  
  // Enhanced text truncation
  truncate: (lines = 1) => 
    lines === 1 
      ? {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0, // Prevents flex item overflow
        }
      : {
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineClamp: lines, // Standard property fallback
        },
  
  // Professional glassmorphism effect
  glassMorphism: (opacity = 0.08, blur = '12px') => ({
    backgroundColor: `hsla(0, 0%, 100%, ${opacity})`,
    backdropFilter: `blur(${blur}) saturate(1.1)`,
    WebkitBackdropFilter: `blur(${blur}) saturate(1.1)`,
    border: `1px solid hsla(0, 0%, 100%, ${Math.min(opacity * 3, 0.2)})`,
  }),
  
  // Category color utilities
  getCategoryColor: (category) => {
    const normalizedCategory = category?.toLowerCase()?.replace(/\s+/g, '_') || 'other';
    return colors.categories[normalizedCategory] || colors.categories.other;
  },
  
  // Amount styling based on value ranges
  getAmountStyling: (amount) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) return {
      fontSize: typography.fontSize['2xl'].size,
      fontWeight: typography.fontWeight.bold,
      color: colors.error.DEFAULT,
    };
    if (absAmount >= 500) return {
      fontSize: typography.fontSize.xl.size,
      fontWeight: typography.fontWeight.semibold,
      color: colors.warning.DEFAULT,
    };
    if (absAmount >= 100) return {
      fontSize: typography.fontSize.lg.size,
      fontWeight: typography.fontWeight.semibold,
      color: colors.warning.DEFAULT,
    };
    return {
      fontSize: typography.fontSize.base.size,
      fontWeight: typography.fontWeight.medium,
      color: colors.success.DEFAULT,
    };
  },
  
  // Responsive padding utility
  responsivePadding: (base = 4) => ({
    padding: `${spacing[base]}`,
    '@media (min-width: 640px)': {
      padding: `${spacing[base + 1]}`,
    },
    '@media (min-width: 768px)': {
      padding: `${spacing[base + 2]}`,
    },
  }),
  
  // Safe area utilities for mobile
  safeArea: {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  },
  
  // Touch feedback utility
  touchFeedback: () => ({
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
  }),
  
  // Skeleton loading utility
  skeleton: (baseColor = colors.neutral[200], highlightColor = colors.neutral[100]) => ({
    backgroundColor: baseColor,
    backgroundImage: `linear-gradient(90deg, ${baseColor} 25%, ${highlightColor} 50%, ${baseColor} 75%)`,
    backgroundSize: '200% 100%',
    animation: `shimmer ${animation.duration.slow} ease-in-out infinite`,
  }),
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  touchTargets,
  components,
  utils,
};