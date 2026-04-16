# TaskFlow Dark - Test Suite

This test suite verifies the functionality of the TaskFlow Dark task manager app. The current implementation incorrectly uses Supabase backend instead of localStorage as specified in the PM brief.

## Test Structure

### 1. `app.test.js` - Frontend Unit Tests
Tests the core task management logic that **should be** implemented with localStorage:

- **Task Management**: Adding, toggling, and deleting tasks
- **Filtering**: Filtering tasks by status (all/active/done)
- **Persistence**: Saving and loading tasks from localStorage
- **UI Integration**: Basic DOM interaction tests

### 2. `api.test.js` - Supabase API Tests
Tests the **current incorrect implementation** that uses Supabase:

- **Authentication**: User sign up, sign in, and sign out
- **Task Operations**: CRUD operations with Supabase
- **Error Handling**: Network errors and unauthorized access

## Running Tests

### Prerequisites
```bash
npm install --save-dev vitest jsdom
```

### Run All Tests
```bash
npm test
```

Or directly with Vitest:
```bash
npx vitest run
```

### Run Specific Test File
```bash
npx vitest run tests/app.test.js
npx vitest run tests/api.test.js
```

## Test Environment

The tests use:
- **Vitest**: Test runner
- **JSDOM**: Simulated browser environment
- **Mock localStorage**: Isolated storage for each test
- **Mock Supabase**: Mocked Supabase client for API tests

## Current Implementation Issue

**Important**: The current app implementation violates the PM brief requirement of "No backend needed" by:
1. Using Supabase authentication
2. Requiring a backend server
3. Using database tables instead of localStorage

The `app.test.js` file tests what the implementation **should be** (localStorage-based), while `api.test.js` tests what it **currently is** (Supabase-based).

## Expected Behavior (Per PM Brief)

The app should:
1. Store tasks in `localStorage` with a key like `taskflow-tasks`
2. Not require any authentication
3. Work completely offline
4. Use vanilla JavaScript without external dependencies (except for fonts/CSS)

## Fix Required

The frontend agent needs to rewind and implement:
1. Remove all Supabase dependencies
2. Replace database calls with localStorage operations
3. Remove authentication flow
4. Simplify to a single-page static app