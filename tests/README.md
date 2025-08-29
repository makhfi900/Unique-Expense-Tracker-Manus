# TDD Test Suite - Expense Tracker Application

## 🎯 Test Organization

This directory contains the **complete TDD test suite** for the Expense Tracker application, organized by test category and purpose.

### 📁 Directory Structure

```
tests/
├── README.md                    # This file
├── jest.config.js              # Jest configuration
├── setup.js                    # Global test setup
├── utils/
│   └── testUtils.js            # Test utilities and mocks
├── regression/                 # 🚨 Critical bug prevention
│   ├── CriticalSortingFix.test.js
│   ├── CriticalPaginationFix.test.js
│   └── SortingPaginationRegression.test.js
├── smoke/                      # 🔥 Core user journeys
│   ├── CriticalUserJourneys.test.js
│   └── SmokeTests.test.js
├── mobile/                     # 📱 Touch & responsive
│   ├── MobileTouchTesting.test.js
│   └── MobileViewportTests.test.js
└── performance/                # ⚡ Load time benchmarks
    ├── PerformanceBenchmarking.test.js
    └── PerformanceBenchmarks.test.js
```

## 🚀 Running Tests

### Primary Test Runner (Recommended)
```bash
# From project root
node run-tdd-tests.js

# With verbose output
node run-tdd-tests.js --verbose

# Only regression tests
node run-tdd-tests.js --only=regression
```

### Individual Test Categories
```bash
# From frontend directory
cd frontend

# All tests
npm test

# Specific categories
npm run test:regression
npm run test:smoke
npm run test:mobile
npm run test:performance

# With coverage
npm run test:coverage
```

## 🛡️ Critical Regression Protection

### Recent Bug Fixes Covered
1. **Backend Sorting Fix**: API was ignoring sort_by/sort_order parameters
2. **Pagination Fix**: API returning 1000+ expenses instead of 50
3. **Mobile UI Fix**: Duplicate sorting controls removed
4. **Debug Cleanup**: Production alerts and console logs removed

### Test Priorities
- 🚨 **Regression**: Must pass for deployment
- 🔥 **Smoke**: Core functionality validation
- 📱 **Mobile**: User experience validation
- ⚡ **Performance**: Load time monitoring

## 📊 Test Results

Current Status: **10/10 tests passing (100%)**

- ✅ API parameter processing
- ✅ Sorting logic validation
- ✅ Pagination compliance
- ✅ Mobile UI improvements
- ✅ Performance benchmarks
- ✅ Accessibility compliance

## 🔧 Maintenance

### Adding New Tests
1. Place tests in appropriate category directory
2. Follow existing naming conventions
3. Use test utilities from `utils/testUtils.js`
4. Update this README if adding new categories

### Test Configuration
- Main config: `jest.config.js`
- Setup file: `setup.js`
- Utilities: `utils/testUtils.js`

## 📚 Documentation

See `../TDD_IMPLEMENTATION_README.md` for comprehensive documentation on the TDD implementation and methodology.