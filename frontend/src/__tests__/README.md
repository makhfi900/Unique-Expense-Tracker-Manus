# Comprehensive TDD Test Suite

This directory contains a comprehensive Test-Driven Development (TDD) test suite designed to ensure the reliability, performance, and user experience of the Unique Expense Tracker application.

## 🎯 Test Categories

### 1. Smoke Tests (`smoke/`)
**Purpose**: Validate critical user journeys and basic functionality
- **File**: `SmokeTests.test.js`
- **Coverage**: Authentication, basic navigation, core functionality
- **Trigger**: Every commit, before any other tests
- **Timeout**: 30 seconds max

**Key Tests**:
- Application bootstrap and loading
- Authentication flow (login/logout)
- Basic expense management operations
- Mobile responsiveness check
- Performance baseline validation
- Error handling gracefully

### 2. Regression Tests (`regression/`)
**Purpose**: Prevent regression of recent critical fixes
- **File**: `SortingPaginationRegression.test.js`
- **Coverage**: Sorting by amount/date/description, pagination limits, mobile UI duplicates
- **Trigger**: Every pull request
- **Critical**: Must pass for deployment

**Key Tests**:
- Sort by amount (ascending/descending)
- Sort by date (chronological order)
- Sort by description (alphabetical)
- Pagination limit enforcement (prevent 1000+ bug)
- Mobile sort control duplicates prevention
- Data integrity during operations

### 3. Mobile Tests (`mobile/`)
**Purpose**: Comprehensive mobile device testing and viewport simulation
- **File**: `MobileViewportTests.test.js`
- **Coverage**: Multiple device sizes, touch interactions, accessibility
- **Devices**: iPhone SE (320px) to iPad (768px)

**Key Tests**:
- Cross-device compatibility (6 device configurations)
- Touch target accessibility (44px minimum)
- Swipe gesture handling
- Virtual keyboard accommodation
- Orientation change handling
- Mobile-specific UI behaviors

### 4. Performance Tests (`performance/`)
**Purpose**: Ensure application meets performance standards
- **File**: `PerformanceBenchmarks.test.js`
- **Coverage**: Loading times, interaction responsiveness, memory usage
- **Budgets**: 2s initial load, 300ms interactions, 50MB memory

**Key Tests**:
- Initial application load (< 2s)
- Large dataset rendering (< 1s)
- User interaction response (< 300ms)
- Memory stability testing
- Animation performance (GPU acceleration)
- Network optimization

### 5. Integration Tests (`integration/`)
**Purpose**: End-to-end workflows and component integration
- **File**: `TestRunner.test.js`
- **Coverage**: Complete user workflows, error scenarios, CI/CD validation
- **Timeout**: 15 seconds per test

**Key Tests**:
- Complete expense management workflow
- Mobile-to-desktop responsive transitions
- Authentication state changes
- Network failure recovery
- Invalid data handling
- CI/CD critical path validation

## 🛠 Test Utilities (`utils/`)

### `testUtils.js`
Comprehensive testing utilities and helpers:
- **`renderWithProviders()`**: Render components with all required contexts
- **`generateMockExpenses()`**: Create realistic test data
- **`mockSupabase`**: Mock Supabase client for testing
- **`viewportUtils`**: Viewport simulation for responsive testing
- **`performanceUtils`**: Performance measurement helpers
- **`touchUtils`**: Touch event simulation
- **Custom matchers**: Performance budgets, layout shift detection

### Setup Files
- **`setup.js`**: Global test environment configuration
- **`jest.polyfills.js`**: Browser API polyfills for Node.js environment

## 📊 Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom (browser simulation)
- **Coverage**: 80% threshold (branches, functions, lines, statements)
- **Timeout**: 10 seconds default
- **Workers**: 50% CPU utilization
- **Projects**: Organized by test category

### Package Scripts
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Mobile-specific tests
npm run test:mobile

# Performance benchmarks
npm run test:performance

# Regression tests only
npm run test:regression
```

## 🚀 CI/CD Integration

### GitHub Actions (`.github/workflows/test-automation.yml`)
Automated test execution with multiple stages:

1. **🚨 Critical Smoke Tests** (10 min timeout)
   - Must pass for any deployment
   - Runs on every push/PR

2. **🔄 Regression Prevention Tests** (15 min timeout)
   - Validates recent fixes remain working
   - Blocks deployment if failing

3. **📱 Mobile Compatibility Tests** (20 min timeout)
   - Cross-device testing
   - Touch interaction validation

4. **⚡ Performance Benchmarks** (25 min timeout)
   - Performance budget enforcement
   - Memory usage monitoring

5. **🧪 Full Test Suite with Coverage** (30 min timeout)
   - Comprehensive coverage report
   - Codecov integration

6. **🌐 Cross-Platform Tests**
   - Ubuntu, Windows, macOS
   - Node.js 18, 20

7. **🔒 Security & Dependency Checks**
   - npm audit
   - Vulnerable package detection

### Deployment Gate
- **Requires**: Smoke + Regression + Mobile tests passing
- **Triggers**: Automatic deployment marker
- **Protection**: Main branch only

## 🎨 Best Practices

### Test Structure
```javascript
describe('Feature Category', () => {
  describe('Specific Functionality', () => {
    test('CATEGORY: Should do specific thing', async () => {
      // Test implementation
    });
  });
});
```

### Test Naming Convention
- **SMOKE**: Critical functionality tests
- **REGRESSION**: Prevent bug recurrence
- **MOBILE**: Mobile-specific tests
- **PERFORMANCE**: Performance validation
- **INTEGRATION**: End-to-end workflows
- **CI**: Continuous integration validation

### Data Generation
```javascript
// Use utility functions for consistent test data
const mockExpenses = generateMockExpenses(count, overrides);
const mockAuth = createMobileAuth(expenses);
```

### Performance Testing
```javascript
// Use custom matchers for performance validation
expect(renderTime).toBeWithinPerformanceBudget(2000);
expect(element).toHaveMinimumTouchTarget(44);
expect(container).toRenderWithoutLayoutShift();
```

## 📈 Coverage Goals

### Current Targets
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Priority Areas
1. **Authentication flow**: 95% coverage
2. **Expense CRUD operations**: 90% coverage
3. **Mobile responsiveness**: 85% coverage
4. **Error handling**: 80% coverage

## 🐛 Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` and `act` appropriately
2. **Mock cleanup**: Clear mocks in `beforeEach`
3. **DOM cleanup**: Reset document state between tests
4. **Memory leaks**: Unmount components and clear timers

### Debug Commands
```bash
# Run specific test file
npm test -- SmokeTests.test.js

# Run with debug output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="specific test name"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 🔄 Maintenance

### Regular Tasks
- **Weekly**: Review test performance and execution times
- **Monthly**: Update mock data to reflect real usage patterns  
- **Quarterly**: Review and update performance budgets
- **Release**: Analyze coverage reports and identify gaps

### Test Data Management
- Keep mock data realistic and representative
- Update test scenarios based on user feedback
- Maintain consistency across test files
- Regular cleanup of obsolete test cases

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mobile Testing Guidelines](https://web.dev/mobile-ux/)
- [Performance Testing](https://web.dev/performance-scoring/)

---

This test suite ensures the Unique Expense Tracker maintains high quality, performance, and user experience standards across all devices and use cases.