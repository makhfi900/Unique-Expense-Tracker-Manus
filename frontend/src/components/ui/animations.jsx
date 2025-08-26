import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Animation Utilities & Micro-interaction Components
 * Features:
 * - Pre-configured animation variants
 * - Micro-interaction components
 * - Transition utilities
 * - Performance-optimized animations
 * - Accessible motion preferences
 */

// Animation Variants Library
export const animationVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  scaleUp: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    exit: { scale: 0 }
  },

  // Slide animations
  slideInUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  },
  
  slideInDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  },
  
  slideInLeft: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  
  slideInRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },

  // Rotation animations
  rotateIn: {
    initial: { opacity: 0, rotate: -180 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 180 }
  },

  // Bounce animations
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { opacity: 0, scale: 0.3 }
  },

  // Stagger animations for lists
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },

  // Hover and interaction states
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },

  // Floating animations
  float: {
    animate: {
      y: [-4, 4, -4],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Pulse animations
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Shimmer effect
  shimmer: {
    animate: {
      x: ['-100%', '100%'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

// Transition presets
export const transitions = {
  smooth: { duration: 0.3, ease: "easeInOut" },
  quick: { duration: 0.15, ease: "easeOut" },
  slow: { duration: 0.5, ease: "easeInOut" },
  spring: { type: "spring", stiffness: 300, damping: 30 },
  bouncy: { type: "spring", stiffness: 400, damping: 15 },
  gentle: { type: "spring", stiffness: 100, damping: 25 }
};

// Animated wrapper component
export const AnimatedContainer = ({
  children,
  variant = 'fadeIn',
  transition = transitions.smooth,
  delay = 0,
  className,
  ...props
}) => {
  const selectedVariant = typeof variant === 'string' 
    ? animationVariants[variant] 
    : variant;

  return (
    <motion.div
      variants={selectedVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ ...transition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Stagger container for lists
export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated list item
export const StaggerItem = ({
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={animationVariants.staggerItem}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Hover scale effect
export const HoverScale = ({
  children,
  scale = 1.05,
  className,
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      transition={transitions.quick}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Magnetic button effect
export const MagneticButton = ({
  children,
  strength = 20,
  className,
  ...props
}) => {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / rect.width;
    const deltaY = (e.clientY - centerY) / rect.height;
    
    e.currentTarget.style.transform = 
      `translate(${deltaX * strength}px, ${deltaY * strength}px)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translate(0px, 0px)';
  };

  return (
    <motion.div
      className={cn("transition-transform duration-200 ease-out", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Parallax scroll effect
export const ParallaxScroll = ({
  children,
  speed = 0.5,
  className,
  ...props
}) => {
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => setOffsetY(window.pageYOffset);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      style={{ y: offsetY * speed }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Reveal on scroll
export const RevealOnScroll = ({
  children,
  variant = 'fadeInUp',
  threshold = 0.1,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const selectedVariant = typeof variant === 'string' 
    ? animationVariants[variant] 
    : variant;

  return (
    <motion.div
      ref={ref}
      variants={selectedVariant}
      initial="initial"
      animate={isVisible ? "animate" : "initial"}
      transition={transitions.smooth}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Typewriter effect
export const TypewriterText = ({
  text,
  speed = 50,
  delay = 0,
  className,
  ...props
}) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, currentIndex === 0 ? delay : speed);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed, delay]);

  return (
    <motion.span
      className={className}
      {...props}
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-0.5 h-1em bg-current ml-1"
      />
    </motion.span>
  );
};

// Number counter animation
export const AnimatedCounter = ({
  from = 0,
  to,
  duration = 2,
  format = (value) => Math.round(value).toLocaleString(),
  className,
  ...props
}) => {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = from + (to - from) * easeOut;
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return (
    <motion.span
      className={className}
      key={to} // Re-trigger animation when target changes
      {...props}
    >
      {format(count)}
    </motion.span>
  );
};

// Page transition wrapper
export const PageTransition = ({
  children,
  variant = 'fadeInUp',
  className,
  ...props
}) => {
  return (
    <AnimatedContainer
      variant={variant}
      transition={transitions.smooth}
      className={cn("w-full h-full", className)}
      {...props}
    >
      {children}
    </AnimatedContainer>
  );
};

// Loading shimmer effect
export const ShimmerEffect = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-200 rounded",
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        variants={animationVariants.shimmer}
        animate="animate"
      />
    </div>
  );
};

// Floating action animation
export const FloatingAction = ({
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={animationVariants.float}
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Button ripple effect
export const RippleButton = ({
  children,
  onClick,
  className,
  ...props
}) => {
  const [ripples, setRipples] = React.useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <motion.button
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </motion.button>
  );
};

export default {
  animationVariants,
  transitions,
  AnimatedContainer,
  StaggerContainer,
  StaggerItem,
  HoverScale,
  MagneticButton,
  ParallaxScroll,
  RevealOnScroll,
  TypewriterText,
  AnimatedCounter,
  PageTransition,
  ShimmerEffect,
  FloatingAction,
  RippleButton
};