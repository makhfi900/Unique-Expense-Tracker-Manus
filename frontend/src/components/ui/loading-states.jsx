import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { colors, components, animation } from './design-system';
import { Loader2, Zap, TrendingUp, DollarSign } from 'lucide-react';

/**
 * Modern Loading States & Skeleton Components
 * Features:
 * - Skeleton screens for different layouts
 * - Animated loading indicators
 * - Shimmer effects
 * - Content-specific skeletons
 * - Progressive loading patterns
 * - Smooth transitions
 */

// Base Skeleton Component
export const Skeleton = ({
  className,
  animate = true,
  variant = 'default', // 'default', 'shimmer', 'pulse', 'wave'
  ...props
}) => {
  const variants = {
    default: "bg-neutral-200",
    shimmer: "bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer",
    pulse: "bg-neutral-200 animate-pulse",
    wave: "bg-neutral-200 animate-wave"
  };

  return (
    <div
      className={cn(
        "rounded-md",
        animate && variants[variant],
        className
      )}
      {...props}
    />
  );
};

// Expense Card Skeleton
export const ExpenseCardSkeleton = ({ 
  variant = 'default', 
  count = 1,
  className 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      className={cn(
        "p-4 bg-white rounded-lg border shadow-sm",
        className
      )}
    >
      {variant === 'compact' ? (
        // Compact skeleton for list views
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="w-4 h-4 rounded" variant="shimmer" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" variant="shimmer" />
              <Skeleton className="h-3 w-1/2" variant="shimmer" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-5 w-20 mb-1" variant="shimmer" />
            <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          </div>
        </div>
      ) : (
        // Full card skeleton
        <>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <Skeleton className="w-4 h-4 rounded mt-1" variant="shimmer" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" variant="shimmer" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-3 w-24" variant="shimmer" />
                  <Skeleton className="h-3 w-16" variant="shimmer" />
                </div>
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-24 mb-1" variant="shimmer" />
              <Skeleton className="h-3 w-16" variant="shimmer" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
              <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
            </div>
            <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          </div>
        </>
      )}
    </motion.div>
  ));

  return <div className="space-y-3">{skeletons}</div>;
};

// Chart Skeleton
export const ChartSkeleton = ({ 
  type = 'bar', // 'bar', 'line', 'pie', 'area'
  className 
}) => {
  const chartElements = {
    bar: (
      <div className="flex items-end justify-between h-48 px-4 pb-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton
            key={i}
            className={`w-8 bg-blue-200`}
            style={{ height: `${Math.random() * 80 + 20}%` }}
            variant="shimmer"
          />
        ))}
      </div>
    ),
    line: (
      <div className="relative h-48 p-4">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e5e5e5" />
              <stop offset="50%" stopColor="#f5f5f5" />
              <stop offset="100%" stopColor="#e5e5e5" />
            </linearGradient>
          </defs>
          <motion.path
            d="M20,150 Q80,50 140,100 T260,80 Q320,60 380,120"
            stroke="url(#shimmer)"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </div>
    ),
    pie: (
      <div className="flex items-center justify-center h-48">
        <div className="relative w-32 h-32">
          <Skeleton className="w-full h-full rounded-full" variant="shimmer" />
          <div className="absolute inset-4 bg-white rounded-full" />
        </div>
      </div>
    ),
    area: (
      <div className="relative h-48 p-4">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <motion.path
            d="M20,150 Q80,50 140,100 T260,80 Q320,60 380,120 L380,180 L20,180 Z"
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </div>
    )
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "bg-white rounded-lg border p-4",
        className
      )}
    >
      <div className="mb-4">
        <Skeleton className="h-6 w-48 mb-2" variant="shimmer" />
        <Skeleton className="h-4 w-32" variant="shimmer" />
      </div>
      {chartElements[type]}
    </motion.div>
  );
};

// Statistics Grid Skeleton
export const StatsGridSkeleton = ({ 
  count = 4,
  className 
}) => {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
      className
    )}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white p-4 rounded-lg border shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-20" variant="shimmer" />
            <Skeleton className="h-5 w-5 rounded" variant="shimmer" />
          </div>
          <Skeleton className="h-8 w-24 mb-1" variant="shimmer" />
          <Skeleton className="h-3 w-16" variant="shimmer" />
        </motion.div>
      ))}
    </div>
  );
};

// Loading Indicators
export const LoadingSpinner = ({ 
  size = 'default', // 'sm', 'default', 'lg'
  color = 'primary',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
};

export const LoadingDots = ({ 
  className,
  color = 'primary' 
}) => {
  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div className={cn("flex space-x-1", className)}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("w-2 h-2 rounded-full", colorClasses[color])}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Progress Indicators
export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  className,
  color = 'primary',
  animated = true
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <motion.div
        className={cn("h-2 rounded-full", colorClasses[color])}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: animated ? 0.5 : 0 }}
      />
    </div>
  );
};

export const CircularProgress = ({ 
  value = 0, 
  max = 100, 
  size = 60,
  strokeWidth = 4,
  color = 'primary',
  className
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorClasses[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-700">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

// Full Page Loading
export const FullPageLoader = ({ 
  message = 'Loading...',
  icon: Icon = Zap,
  className 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm",
        "flex items-center justify-center z-50",
        className
      )}
    >
      <div className="text-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-4 inline-block p-3 bg-blue-100 rounded-full"
        >
          <Icon className="w-8 h-8 text-blue-600" />
        </motion.div>
        <p className="text-gray-600 font-medium">{message}</p>
        <LoadingDots className="mt-2 justify-center" />
      </div>
    </motion.div>
  );
};

// Content Placeholder
export const EmptyState = ({
  icon: Icon = TrendingUp,
  title = "No data available",
  description = "There's nothing to show here yet.",
  action,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "text-center py-12 px-4",
        className
      )}
    >
      <div className="mb-4 inline-block p-3 bg-gray-100 rounded-full">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};

export default {
  Skeleton,
  ExpenseCardSkeleton,
  ChartSkeleton,
  StatsGridSkeleton,
  LoadingSpinner,
  LoadingDots,
  ProgressBar,
  CircularProgress,
  FullPageLoader,
  EmptyState
};