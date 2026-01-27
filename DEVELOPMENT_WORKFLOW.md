# Development Workflow Guide

**A step-by-step guide for working with the Dotloop Reporting Tool codebase, including common tasks, debugging strategies, and best practices.**

---

## Table of Contents
1. [Local Setup](#local-setup)
2. [Development Server](#development-server)
3. [Common Development Tasks](#common-development-tasks)
4. [Testing Workflow](#testing-workflow)
5. [Debugging Guide](#debugging-guide)
6. [Git Workflow](#git-workflow)
7. [Database Management](#database-management)
8. [Deployment Workflow](#deployment-workflow)

---

## Local Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.0+ (check with `node --version`)
- **pnpm** 10.0+ (install with `npm install -g pnpm`)
- **MySQL** 8.0+ or **TiDB** database
- **Git** for version control

### Initial Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/dotloop-reporter.git
cd dotloop-reporter

# 2. Install dependencies
pnpm install

# 3. Create environment file
cp .env.example .env.local

# 4. Edit .env.local with your configuration
# Required variables:
# - DATABASE_URL
# - JWT_SECRET
# - VITE_APP_ID
# - OAUTH_SERVER_URL
# - VITE_OAUTH_PORTAL_URL

# 5. Set up database
pnpm db:push

# 6. Seed sample data (optional)
pnpm seed

# 7. Start development server
pnpm dev
```

### Verifying Setup

```bash
# Check Node.js version
node --version  # Should be 18.0+

# Check pnpm version
pnpm --version  # Should be 10.0+

# Check dependencies installed
pnpm list --depth=0

# Run type check
pnpm check

# Run tests
pnpm test
```

---

## Development Server

### Starting the Server

```bash
# Start development server with hot reload
pnpm dev

# Output should show:
# VITE v7.1.9  ready in 780 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://169.254.0.21:5173/
```

### Server Features

- **Hot Module Replacement (HMR):** Changes to files automatically reload in browser
- **TypeScript Checking:** Errors displayed in terminal and browser
- **Source Maps:** Debug original TypeScript code in browser DevTools
- **Fast Refresh:** Component state preserved during edits

### Common Server Issues

**Issue: Port 5173 already in use**
```bash
# Kill process using port
lsof -i :5173
kill -9 <PID>

# Or use different port
pnpm dev -- --port 3001
```

**Issue: Module not found errors**
```bash
# Clear cache and reinstall
rm -rf node_modules .pnpm-store
pnpm install
pnpm dev
```

**Issue: Database connection error**
```bash
# Check DATABASE_URL in .env.local
# Verify database is running
# Test connection with MySQL client
mysql -h localhost -u user -p -D dotloop_reporter
```

---

## Common Development Tasks

### Adding a New Feature

**Step 1: Plan the feature**
- Define what data is needed
- Sketch the UI layout
- Identify affected components

**Step 2: Update database schema (if needed)**
```bash
# Edit drizzle/schema.ts
# Add new table or columns

# Generate and apply migration
pnpm db:push
```

**Step 3: Create backend procedures**
```typescript
// server/routers.ts or server/featureRouter.ts
export const featureRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return db.getFeatureData(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({ /* validation */ }))
    .mutation(({ input, ctx }) => {
      return db.createFeature(input, ctx.user.id);
    }),
});
```

**Step 4: Add database helpers**
```typescript
// server/db.ts
export async function getFeatureData(userId: string) {
  return db.select().from(featureTable).where(eq(featureTable.userId, userId));
}
```

**Step 5: Create frontend components**
```typescript
// client/src/components/FeatureName.tsx
export function FeatureName() {
  const { data, isLoading } = trpc.feature.list.useQuery();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {/* Component UI */}
    </div>
  );
}
```

**Step 6: Add tests**
```typescript
// server/featureRouter.test.ts
describe('Feature Router', () => {
  it('should fetch feature data', async () => {
    const result = await caller.feature.list();
    expect(result).toBeDefined();
  });
});
```

**Step 7: Update documentation**
- Add feature to README.md
- Document new API procedures
- Update ARCHITECTURE.md if needed

### Fixing a Bug

**Step 1: Reproduce the bug**
- Identify exact steps to reproduce
- Check if bug is in frontend or backend
- Note any error messages

**Step 2: Add a test case**
```typescript
// Create test that fails with current code
it('should handle edge case X', () => {
  const result = processData(edgeCaseInput);
  expect(result).toEqual(expectedOutput);
});
```

**Step 3: Debug the issue**
- Use browser DevTools for frontend bugs
- Use console.log() or debugger for backend
- Check database state if data-related

**Step 4: Implement fix**
- Make minimal changes to fix the bug
- Ensure test passes
- Check for side effects

**Step 5: Add regression test**
- Ensure bug doesn't reoccur
- Test related functionality

### Updating Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update specific package
pnpm update package-name@latest

# Update all packages
pnpm update --latest

# After updating, test thoroughly
pnpm test
pnpm build
```

### Code Formatting

```bash
# Format all code
pnpm format

# Format specific file
prettier --write path/to/file.ts

# Check formatting without changing
prettier --check path/to/file.ts
```

### Type Checking

```bash
# Check for TypeScript errors
pnpm check

# Watch mode for continuous checking
pnpm check -- --watch
```

---

## Testing Workflow

### Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test -- csvValidator.test.ts

# Run tests matching pattern
pnpm test -- --grep "CSV"

# Run with coverage report
pnpm test -- --coverage
```

### Writing Tests

**Unit Test Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { validateCSV } from '@/utils/csvValidation';

describe('CSV Validation', () => {
  it('should reject files larger than 10MB', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv');
    expect(() => validateCSV(largeFile)).toThrow('File too large');
  });

  it('should accept valid CSV files', () => {
    const validFile = new File(['name,email\nJohn,john@example.com'], 'valid.csv');
    expect(() => validateCSV(validFile)).not.toThrow();
  });
});
```

**Integration Test Example:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createCaller } from '@/server/routers';

describe('Upload Flow', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    caller = createCaller({ user: { id: 'test-user' } });
  });

  it('should upload and parse CSV successfully', async () => {
    const result = await caller.uploads.create({
      fileName: 'test.csv',
      fileSize: 1024,
      recordCount: 10,
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe('success');
  });
});
```

### Test Coverage Goals

- **Critical paths:** 80%+ coverage (upload, commission, auth)
- **Utilities:** 90%+ coverage (formatters, validators)
- **Components:** 50%+ coverage (UI components are harder to test)
- **Overall:** 75%+ coverage target

---

## Debugging Guide

### Frontend Debugging

**Using Browser DevTools:**
```javascript
// In browser console
// Check component state
console.log(document.querySelector('[data-testid="metric-card"]'));

// Check API calls
// Open Network tab and filter by XHR
// Look for /api/trpc requests

// Debug React components
// Install React DevTools extension
// Use Profiler to find slow components
```

**Using VS Code Debugger:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/client/src"
    }
  ]
}
```

**Common Frontend Issues:**

| Issue | Solution |
|-------|----------|
| Component not rendering | Check console for errors, verify props, check conditional rendering |
| Chart not displaying | Check data shape, verify Recharts props, check responsive height classes |
| API call failing | Check Network tab, verify endpoint exists, check authentication |
| Styling not applied | Check Tailwind classes, verify dark mode, check CSS specificity |
| State not updating | Check useState hook, verify event handlers, check dependency arrays |

### Backend Debugging

**Using Console Logging:**
```typescript
// server/routers.ts
export const appRouter = router({
  uploads: {
    list: protectedProcedure.query(({ ctx }) => {
      console.log('Fetching uploads for user:', ctx.user.id);
      const uploads = db.getUploads(ctx.user.id);
      console.log('Found uploads:', uploads.length);
      return uploads;
    }),
  },
});
```

**Using Node Debugger:**
```bash
# Start with debugger
node --inspect-brk dist/index.js

# Or with tsx
tsx --inspect-brk server/index.ts
```

**Common Backend Issues:**

| Issue | Solution |
|-------|----------|
| Database query slow | Check indexes, use EXPLAIN, consider pagination |
| Authentication failing | Check JWT secret, verify cookie settings, check OAuth flow |
| API returning wrong data | Check database query, verify filtering, check aggregation logic |
| Memory leak | Check for unresolved promises, verify cleanup in middleware |
| High CPU usage | Profile with Node profiler, check for infinite loops |

### Database Debugging

**Connecting to Database:**
```bash
# MySQL
mysql -h localhost -u user -p -D dotloop_reporter

# TiDB
mysql -h tidb-host -P 4000 -u user -p -D dotloop_reporter
```

**Common Queries:**
```sql
-- Check table structure
DESCRIBE uploads;

-- Check indexes
SHOW INDEXES FROM uploads;

-- Check data
SELECT * FROM uploads LIMIT 10;

-- Check row count
SELECT COUNT(*) FROM uploads;

-- Check slow queries
SELECT * FROM mysql.slow_log;

-- Analyze query performance
EXPLAIN SELECT * FROM uploads WHERE userId = 'user-123';
```

---

## Git Workflow

### Branch Naming

```
feature/description          # New feature
bugfix/description           # Bug fix
docs/description             # Documentation
refactor/description         # Code refactoring
test/description             # Test improvements
chore/description            # Maintenance tasks
```

### Commit Messages

```
# Format: <type>: <description>

feat: add deals closed metric to podium
fix: resolve agent column showing N/A in drill-down
docs: update README with new features
test: add 5 new CSV validation tests
refactor: simplify chart component props
chore: update dependencies
```

### Creating a Pull Request

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to GitHub
git push origin feature/my-feature

# 4. Create PR on GitHub
# - Write clear description
# - Link related issues
# - Request reviewers

# 5. Address review comments
git add .
git commit -m "fix: address review comments"
git push origin feature/my-feature

# 6. Merge when approved
# - Squash commits if desired
# - Delete branch after merge
```

### Keeping Branch Updated

```bash
# Fetch latest changes
git fetch origin

# Rebase on main
git rebase origin/main

# Or merge if conflicts exist
git merge origin/main
# Resolve conflicts, then commit
```

---

## Database Management

### Creating Migrations

```bash
# 1. Edit drizzle/schema.ts
# Add new table or modify existing table

# 2. Generate migration
pnpm db:push

# This will:
# - Generate SQL migration file
# - Apply migration to database
# - Update drizzle metadata

# 3. Verify migration
# Check drizzle/migrations/ for new file
# Verify database schema changed
```

### Seeding Data

```bash
# Seed sample data
pnpm seed

# Or manually seed
# Edit scripts/seed-sample-data.mjs
# Run: node scripts/seed-sample-data.mjs
```

### Backing Up Database

```bash
# Backup MySQL database
mysqldump -h localhost -u user -p dotloop_reporter > backup.sql

# Restore from backup
mysql -h localhost -u user -p dotloop_reporter < backup.sql
```

### Resetting Database

```bash
# Drop all tables (WARNING: destructive!)
# Connect to database and run:
DROP DATABASE dotloop_reporter;
CREATE DATABASE dotloop_reporter;

# Then reapply migrations
pnpm db:push

# Seed sample data
pnpm seed
```

---

## Deployment Workflow

### Pre-Deployment Checklist

```bash
# 1. Run all tests
pnpm test

# 2. Type check
pnpm check

# 3. Format code
pnpm format

# 4. Build project
pnpm build

# 5. Verify build output
ls -la dist/

# 6. Test production build locally
pnpm start
```

### Deployment Steps

**Using Manus Management UI:**

1. Create checkpoint via `webdev_save_checkpoint`
2. View checkpoint in Management UI
3. Click "Publish" button
4. Configure domain in Settings → Domains
5. Monitor via Dashboard panel

**Manual Deployment:**

```bash
# 1. Build project
pnpm build

# 2. Deploy to hosting
# Upload dist/ folder to hosting provider
# Or use CI/CD pipeline

# 3. Set environment variables
# Configure DATABASE_URL, JWT_SECRET, etc.

# 4. Run migrations
pnpm db:push

# 5. Start server
pnpm start

# 6. Verify deployment
# Check logs for errors
# Test application in browser
```

### Post-Deployment Verification

```bash
# Check application health
curl https://yourdomain.com/api/health

# Monitor error logs
# Check Sentry for errors
# Monitor performance metrics
# Test critical workflows
```

### Rollback Procedure

```bash
# If deployment fails, rollback to previous version
# Using Manus Management UI:
# 1. Go to Checkpoints panel
# 2. Find previous working checkpoint
# 3. Click "Rollback" button
# 4. Verify application is restored

# Or manually:
git revert <commit-hash>
git push origin main
pnpm build && pnpm start
```

---

## Performance Optimization

### Frontend Performance

```bash
# Analyze bundle size
pnpm build -- --analyze

# Check for unused dependencies
pnpm audit

# Monitor performance metrics
# Open DevTools → Lighthouse
# Run audit for performance
```

**Optimization Techniques:**
- Code splitting for routes
- Lazy loading images
- Memoizing expensive computations
- Debouncing search/filter inputs
- Using virtual lists for long tables

### Backend Performance

```bash
# Profile application
node --prof dist/index.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt

# Check memory usage
# Monitor with: top, htop, or Node.js memory profiler
```

**Optimization Techniques:**
- Add database indexes
- Use query pagination
- Cache computed results
- Optimize database queries
- Use connection pooling

---

## Troubleshooting Guide

### Application Won't Start

```bash
# Check Node.js version
node --version

# Check dependencies
pnpm install

# Check environment variables
cat .env.local

# Check database connection
mysql -h localhost -u user -p -D dotloop_reporter

# Check for port conflicts
lsof -i :5173

# Clear cache and rebuild
rm -rf node_modules dist .vite
pnpm install
pnpm build
```

### Tests Failing

```bash
# Run specific failing test
pnpm test -- failing-test.test.ts

# Run with verbose output
pnpm test -- --reporter=verbose

# Check test file for issues
# Look for missing setup/teardown
# Check for async/await issues
# Verify mocks are correct
```

### Database Issues

```bash
# Check connection
mysql -h localhost -u user -p -D dotloop_reporter -e "SELECT 1"

# Check migrations applied
# Look at drizzle/migrations/
# Check database schema: SHOW TABLES;

# Reset database if corrupted
# Backup first: mysqldump ...
# Drop and recreate: DROP DATABASE ...; CREATE DATABASE ...;
# Reapply migrations: pnpm db:push
```

### Build Errors

```bash
# Clear build cache
rm -rf dist .vite

# Check TypeScript errors
pnpm check

# Check for circular dependencies
# Look at import statements
# Reorganize if needed

# Check for missing dependencies
pnpm install

# Rebuild
pnpm build
```

---

## Best Practices

### Code Quality

- **Always run tests before committing:** `pnpm test`
- **Format code before pushing:** `pnpm format`
- **Type check regularly:** `pnpm check`
- **Keep components under 300 lines**
- **Use meaningful variable names**
- **Add comments for complex logic**
- **Follow existing code patterns**

### Git Practices

- **Commit frequently with clear messages**
- **Create small, focused pull requests**
- **Review code before merging**
- **Delete branches after merging**
- **Keep main branch deployable**

### Testing Practices

- **Write tests for new features**
- **Test edge cases and error conditions**
- **Keep tests focused and readable**
- **Use descriptive test names**
- **Aim for 80%+ coverage on critical paths**

### Documentation Practices

- **Update README for user-facing changes**
- **Add JSDoc comments to functions**
- **Document complex algorithms**
- **Keep docs in sync with code**
- **Update ARCHITECTURE.md for major changes**

---

## Resources

- **React Documentation:** https://react.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Vite Guide:** https://vitejs.dev/guide/
- **Drizzle ORM:** https://orm.drizzle.team
- **tRPC Documentation:** https://trpc.io
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Recharts:** https://recharts.org

---

**Last Updated:** January 27, 2026  
**For:** Claude AI Collaboration
