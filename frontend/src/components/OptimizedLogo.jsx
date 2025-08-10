import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';

/**
 * OptimizedLogo Component
 * 
 * A highly optimized logo component with:
 * - Perfect responsive behavior across all screen sizes
 * - Enhanced accessibility features
 * - Dark/Light theme optimizations
 * - Performance optimizations for smooth animations
 * - Progressive loading with fallback states
 */
const OptimizedLogo = memo(({ 
  size = 'medium', 
  showGlow = true, 
  className = '',
  priority = false,
  animated = true,
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Size variants with mobile-first responsive design
  const sizeVariants = {
    small: 'h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8',
    medium: 'h-8 w-8 xs:h-9 xs:w-9 sm:h-11 sm:w-11 md:h-12 md:w-12',
    large: 'h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 md:h-20 md:w-20',
    hero: 'h-16 w-16 xs:h-18 xs:w-18 sm:h-24 sm:w-24 md:h-32 md:w-32'
  };

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Fallback logo using CSS when image fails
  const FallbackLogo = () => (
    <div className={`
      ${sizeVariants[size]} 
      bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 
      rounded-lg flex items-center justify-center text-white font-bold
      shadow-lg ring-2 ring-white/30 dark:ring-slate-700/40
    `}>
      <span className={`
        ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-xl' : size === 'hero' ? 'text-2xl' : 'text-sm'}
        font-extrabold tracking-tight
      `}>
        UPC
      </span>
    </div>
  );

  return (
    <div className={`relative group ${className}`} {...props}>
      {/* Enhanced gradient backdrop with performance optimizations */}
      {showGlow && (
        <motion.div 
          className={`
            absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 
            rounded-lg blur-sm sm:blur-md opacity-20 group-hover:opacity-30 
            transition-opacity duration-300 will-change-transform
          `}
          initial={animated ? { opacity: 0 } : {}}
          animate={animated ? { opacity: 0.2 } : {}}
          whileHover={animated ? { opacity: 0.3 } : {}}
        />
      )}

      {/* Main logo container with improved accessibility */}
      <motion.div 
        className={`
          relative z-10 rounded-lg ring-1 ring-white/20 sm:ring-2 sm:ring-white/30 
          dark:ring-slate-700/40 shadow-md sm:shadow-lg overflow-hidden 
          bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm
        `}
        initial={animated ? { scale: 0.9, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 1 } : {}}
        transition={animated ? { duration: 0.5, ease: "easeOut" } : {}}
        whileHover={animated ? { scale: 1.05 } : {}}
      >
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div className={`
            ${sizeVariants[size]} 
            bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600
            animate-pulse rounded-lg
          `} />
        )}

        {/* Main logo image with optimizations */}
        {!imageError && (
          <img 
            src="/new_logo_capital1.PNG" 
            alt="Unique Public Graduate College Chichawatni - Academic Excellence Financial Hub Logo" 
            className={`
              ${sizeVariants[size]} 
              object-contain object-center transition-all duration-300 
              dark:brightness-110 dark:contrast-110
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            role="img"
            aria-label="College logo representing academic excellence and financial management"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ 
              imageRendering: 'crisp-edges',
              WebkitImageSmoothing: false,
              imageSmoothing: false
            }}
          />
        )}

        {/* Fallback logo */}
        {imageError && <FallbackLogo />}
      </motion.div>

      {/* Subtle hover indicator with performance optimization */}
      {showGlow && (
        <div className={`
          absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/0 via-blue-500/20 
          to-purple-600/0 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm
          will-change-transform pointer-events-none
        `} />
      )}

      {/* Accessibility improvements */}
      <div className="sr-only">
        Unique Public Graduate College Chichawatni institutional logo - 
        representing academic excellence and comprehensive financial management system
      </div>
    </div>
  );
});

OptimizedLogo.displayName = 'OptimizedLogo';

export default OptimizedLogo;