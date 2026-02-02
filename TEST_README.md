# Running Tests

This project now includes unit tests for the `connectDB` function in `lib/mongodb.ts`.

## Installation

First, install the testing dependencies:

```powershell
npm install
```

## Running Tests

### Run all tests once
```powershell
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```powershell
npm run test:watch
```

### Run tests with coverage report
```powershell
npm run test:coverage
```

## Test Coverage

The test suite for `lib/mongodb.test.ts` covers the following scenarios:

### 1. Global Cache Usage
- ✅ Verifies that `connectDB` correctly uses `global.mongooseCache` for caching connections
- ✅ Ensures `global.mongooseCache` is initialized if it doesn't exist

### 2. Connection Caching (Subsequent Calls)
- ✅ Confirms that subsequent calls to `connectDB` return the same cached connection
- ✅ Verifies that `mongoose.connect()` is only called once, not on repeated calls
- ✅ Tests that pre-existing cached connections are reused

### 3. Initial Connection
- ✅ Validates that the initial call to `connectDB` establishes a new database connection
- ✅ Ensures correct parameters are passed to `mongoose.connect()`
- ✅ Tests error handling and promise reset on connection failure
- ✅ Verifies retry capability after failed connections

### 4. Additional Coverage
- ✅ Concurrent connection handling (multiple simultaneous calls)
- ✅ Environment variable validation (MONGODB_URI requirement)

## Test Structure

```
lib/
  ├── mongodb.ts           # Source file
  └── mongodb.test.ts      # Test file
```

## Notes

- Tests use Jest with TypeScript support
- Mongoose is mocked to avoid actual database connections during testing
- Global cache is reset between tests to ensure isolation
- Console methods are mocked to keep test output clean
