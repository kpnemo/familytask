# Testing Guide

This document explains how to run automated tests for the FamilyTasks application before deployment.

## Quick Start

The easiest way to run tests is using the interactive CLI:

```bash
npm run test
```

This will launch an interactive menu where you can choose different test suites.

## Test Suites Available

### 1. Quick Smoke Test (5 minutes) ⚡
Perfect for quick validation before deployment:
- Build verification
- Core unit tests  
- Basic authentication E2E tests

```bash
npm run test:smoke
```

### 2. Unit Tests 🧪
Test individual functions and API endpoints:

```bash
# Run all unit tests
npm run test:unit

# Run with coverage report
npm run test:unit:coverage

# Watch mode for development
npm run test:unit:watch
```

### 3. E2E Tests 🎭
Test complete user workflows in a real browser:

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui
```

## Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── api/             # API endpoint tests
│   │   ├── tasks.test.ts
│   │   └── points.test.ts
│   └── utils.test.ts    # Utility function tests
├── e2e/                 # End-to-end tests
│   ├── auth.spec.ts     # Authentication flows
│   ├── task-workflow.spec.ts  # Task management
│   └── reward-shop.spec.ts    # Points & rewards
└── helpers/             # Test utilities
    ├── test-db.ts       # Database helpers
    └── test-auth.ts     # Authentication helpers
```

## Interactive Test Runner

Run `npm run test` to launch the interactive CLI with these options:

- **Quick Smoke Test**: Fast validation (5 min)
- **Full Unit Test Suite**: All unit tests with coverage (3 min)  
- **E2E Test Suite**: Complete browser testing (15 min)
- **Complete Test Suite**: Everything together (20 min)
- **Custom Test Selection**: Pick specific test categories
- **Setup Test Environment**: Install dependencies and browsers

## Test Database Setup

The test suite uses a separate SQLite database for testing:

```bash
# Setup test database
npm run test:setup

# Clean and recreate test database  
npm run test:clean
```

Test data is automatically created and cleaned up between tests.

## Pre-Deployment Checklist

Before deploying to production, run this checklist:

### ✅ Required Tests
- [ ] `npm run test:smoke` - Must pass ✅
- [ ] `npm run lint` - Must pass ✅  
- [ ] `npm run build` - Must succeed ✅

### ✅ Recommended Tests (if time permits)
- [ ] `npm run test:unit:coverage` - Review coverage report
- [ ] `npm run test:e2e` - Verify critical user journeys

### ✅ Manual Verification
- [ ] Check that no sensitive data is committed
- [ ] Verify environment variables are configured
- [ ] Test one complete user journey manually

## Troubleshooting

### Test Database Issues
```bash
# Reset test database
npm run test:clean
npm run test:setup
```

### Playwright Issues  
```bash
# Reinstall Playwright browsers
npx playwright install
```

### Dependencies Issues
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts
If tests fail due to port conflicts, ensure no other apps are running on port 3000.

## Test Coverage

Unit tests aim for:
- **API Routes**: 80%+ coverage
- **Utility Functions**: 90%+ coverage  
- **Critical Business Logic**: 95%+ coverage

E2E tests cover:
- **Authentication**: Login, register, logout
- **Task Workflow**: Create → assign → complete → verify
- **Points System**: Earning and spending points
- **Role Permissions**: Parent vs child capabilities
- **Error Handling**: Invalid inputs and edge cases

## CI/CD Integration

Tests can be integrated into GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:smoke
      - run: npm run test:unit:coverage
```

## Best Practices

1. **Always run smoke test** before deploying
2. **Run full test suite** for major changes
3. **Use watch mode** during development
4. **Check coverage reports** regularly
5. **Keep tests fast** - optimize slow tests
6. **Test edge cases** - error conditions matter
7. **Mock external services** - tests should be reliable

## Getting Help

- 📋 See `TEST_CASES.md` for detailed test scenarios
- 🔧 Check console output for specific error messages  
- 🎭 Use `npm run test:e2e:ui` to debug E2E tests visually
- 📊 Review coverage reports in `coverage/` directory
- 🐛 Check Playwright reports in `playwright-report/` directory

## Performance Benchmarks

Expected test execution times:
- **Smoke Test**: ~5 minutes
- **Unit Tests**: ~3 minutes  
- **E2E Tests**: ~15 minutes
- **Complete Suite**: ~20 minutes

If tests are significantly slower, check for:
- Database connection issues
- Port conflicts  
- Resource constraints
- Network timeouts