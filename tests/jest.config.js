/**
 * Jest Configuration for TDD Test Suite
 * 
 * Optimized for testing React components with:
 * - Supabase authentication mocking
 * - Mobile viewport simulation  
 * - Performance benchmarking
 * - Regression test isolation
 * - Coverage reporting
 */

export default {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.js'
  ],
  
  // Module transformation
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  
  // Module name mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.(js|jsx)',
    '<rootDir>/src/**/__tests__/**/*.(js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx)'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverage: false, // Enable via CLI flag
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx}',
    'src/context/**/*.{js,jsx}',  
    'src/hooks/**/*.{js,jsx}',
    'src/utils/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/__tests__/**',
    '!src/**/index.{js,jsx}',
    '!src/main.jsx',
    '!src/vite-env.d.ts'
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    // Critical components need higher coverage
    'src/components/EnhancedMobileExpenseList.jsx': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/components/ExpenseViewer.jsx': {
      branches: 85,
      functions: 90, 
      lines: 90,
      statements: 90
    }
  },
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Performance and timeout
  testTimeout: 10000, // 10 second timeout for async tests
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Test result processors
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-reports',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],
  
  // Global test variables
  globals: {
    'process.env': {
      NODE_ENV: 'test'
    }
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: false, // Enable via CLI flag
  
  // Watch mode configuration
  watchman: false,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Error handling
  errorOnDeprecated: true,
  bail: false, // Set via CLI flag for fail-fast behavior
  
  // Test categorization via projects (enables parallel test runs)
  projects: [
    // Regression tests - highest priority
    {
      displayName: '🚨 Regression',
      testMatch: ['<rootDir>/src/__tests__/regression/**/*.test.(js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
      testEnvironment: 'jest-environment-jsdom',
      maxWorkers: 2 // Run with more workers for critical tests
    },
    
    // Smoke tests - critical user journeys  
    {
      displayName: '🔥 Smoke Tests',
      testMatch: ['<rootDir>/src/__tests__/smoke/**/*.test.(js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
      testEnvironment: 'jest-environment-jsdom'
    },
    
    // Mobile UI tests
    {
      displayName: '📱 Mobile UI',
      testMatch: ['<rootDir>/src/__tests__/mobile/**/*.test.(js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
      testEnvironment: 'jest-environment-jsdom',
      testEnvironmentOptions: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    },
    
    // Performance tests
    {
      displayName: '⚡ Performance',  
      testMatch: ['<rootDir>/src/__tests__/performance/**/*.test.(js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
      testEnvironment: 'jest-environment-jsdom',
      testTimeout: 15000 // Longer timeout for performance tests
    },
    
    // Cross-platform tests
    {
      displayName: '🌐 Cross-Platform',
      testMatch: ['<rootDir>/src/__tests__/crossPlatform/**/*.test.(js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
      testEnvironment: 'jest-environment-jsdom'
    }
  ]
};