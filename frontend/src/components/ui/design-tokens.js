/**
 * Professional Design Tokens Export
 * Centralized design system tokens for consistent theming
 */

import { colors, typography, spacing, borderRadius, shadows, animation, components, utils } from './design-system';

// CSS Custom Properties for easier theme switching
export const cssVariables = {
  // Color tokens
  '--color-brand-primary': colors.brand.primary,
  '--color-brand-primary-hover': colors.brand.primaryHover,
  '--color-brand-primary-light': colors.brand.primaryLight,
  '--color-brand-primary-foreground': colors.brand.primaryForeground,
  
  '--color-success': colors.success.DEFAULT,
  '--color-success-hover': colors.success.hover,
  '--color-success-light': colors.success.light,
  '--color-success-foreground': colors.success.foreground,
  
  '--color-warning': colors.warning.DEFAULT,
  '--color-warning-hover': colors.warning.hover,
  '--color-warning-light': colors.warning.light,
  '--color-warning-foreground': colors.warning.foreground,
  
  '--color-error': colors.error.DEFAULT,
  '--color-error-hover': colors.error.hover,
  '--color-error-light': colors.error.light,
  '--color-error-foreground': colors.error.foreground,
  
  // Neutral scale
  '--color-neutral-50': colors.neutral[50],
  '--color-neutral-100': colors.neutral[100],
  '--color-neutral-200': colors.neutral[200],
  '--color-neutral-300': colors.neutral[300],
  '--color-neutral-400': colors.neutral[400],
  '--color-neutral-500': colors.neutral[500],
  '--color-neutral-600': colors.neutral[600],
  '--color-neutral-700': colors.neutral[700],
  '--color-neutral-800': colors.neutral[800],
  '--color-neutral-900': colors.neutral[900],
  
  // Typography tokens
  '--font-family-sans': typography.fontFamily.sans.join(', '),
  '--font-family-mono': typography.fontFamily.mono.join(', '),
  
  // Spacing tokens
  '--spacing-1': spacing[1],
  '--spacing-2': spacing[2],
  '--spacing-3': spacing[3],
  '--spacing-4': spacing[4],
  '--spacing-5': spacing[5],
  '--spacing-6': spacing[6],
  '--spacing-8': spacing[8],
  '--spacing-10': spacing[10],
  '--spacing-12': spacing[12],
  
  // Touch targets
  '--touch-minimum': spacing.touch.minimum,
  '--touch-comfortable': spacing.touch.comfortable,
  '--touch-large': spacing.touch.large,
  
  // Border radius
  '--radius-sm': borderRadius.sm,
  '--radius-default': borderRadius.DEFAULT,
  '--radius-md': borderRadius.md,
  '--radius-lg': borderRadius.lg,
  '--radius-xl': borderRadius.xl,
  '--radius-full': borderRadius.full,
  
  // Animation
  '--animation-fast': animation.duration.fast,
  '--animation-default': animation.duration.DEFAULT,
  '--animation-slow': animation.duration.slow,
  '--animation-easing': animation.easing.DEFAULT,
  '--animation-easing-bounce': animation.easing.bounce,
  '--animation-easing-smooth': animation.easing.smooth,
};

// Category color mappings for dynamic theming
export const categoryTokens = {
  food: {
    '--category-color': colors.categories.food.color,
    '--category-light': colors.categories.food.light,
    '--category-foreground': colors.categories.food.foreground,
  },
  transport: {
    '--category-color': colors.categories.transport.color,
    '--category-light': colors.categories.transport.light,
    '--category-foreground': colors.categories.transport.foreground,
  },
  shopping: {
    '--category-color': colors.categories.shopping.color,
    '--category-light': colors.categories.shopping.light,
    '--category-foreground': colors.categories.shopping.foreground,
  },
  bills: {
    '--category-color': colors.categories.bills.color,
    '--category-light': colors.categories.bills.light,
    '--category-foreground': colors.categories.bills.foreground,
  },
  entertainment: {
    '--category-color': colors.categories.entertainment.color,
    '--category-light': colors.categories.entertainment.light,
    '--category-foreground': colors.categories.entertainment.foreground,
  },
  health: {
    '--category-color': colors.categories.health.color,
    '--category-light': colors.categories.health.light,
    '--category-foreground': colors.categories.health.foreground,
  },
  education: {
    '--category-color': colors.categories.education.color,
    '--category-light': colors.categories.education.light,
    '--category-foreground': colors.categories.education.foreground,
  },
  other: {
    '--category-color': colors.categories.other.color,
    '--category-light': colors.categories.other.light,
    '--category-foreground': colors.categories.other.foreground,
  },
};

// Component-specific token sets
export const componentTokens = {
  card: {
    padding: components.card.padding,
    borderRadius: components.card.borderRadius,
    shadow: components.card.shadow,
  },
  button: {
    height: components.button.height,
    padding: components.button.padding,
    borderRadius: components.button.borderRadius,
  },
  input: {
    height: components.input.height,
    padding: components.input.padding,
    borderRadius: components.input.borderRadius,
  },
  fab: {
    size: components.fab.size,
    shadow: components.fab.shadow,
    borderRadius: components.fab.borderRadius,
  },
  badge: {
    padding: components.badge.padding,
    borderRadius: components.badge.borderRadius,
    fontSize: components.badge.fontSize,
  },
  modal: {
    borderRadius: components.modal.borderRadius,
    shadow: components.modal.shadow,
    padding: components.modal.padding,
  },
};

// Utility functions for runtime token access
export const getToken = (path) => {
  const tokens = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
    components,
    utils,
  };
  
  return path.split('.').reduce((obj, key) => obj?.[key], tokens);
};

// Apply CSS variables to document root
export const applyCSSVariables = () => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }
};

// Theme switching utilities
export const applyTheme = (theme = 'light') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Apply theme-specific variables
    if (theme === 'dark') {
      // Dark theme overrides
      root.style.setProperty('--color-neutral-50', colors.neutral[900]);
      root.style.setProperty('--color-neutral-100', colors.neutral[800]);
      root.style.setProperty('--color-neutral-900', colors.neutral[50]);
    } else {
      // Reset to light theme
      applyCSSVariables();
    }
  }
};

export default {
  cssVariables,
  categoryTokens,
  componentTokens,
  getToken,
  applyCSSVariables,
  applyTheme,
};