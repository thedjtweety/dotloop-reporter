# Code Organization Guide for Claude

**A detailed reference for understanding the codebase structure, key files, and how to navigate the project.**

---

## Frontend Structure (`client/src/`)

### Pages (`client/src/pages/`)
**Entry points for different application screens.**

- **`Home.tsx`** (847 lines)
  - Main dashboard and upload interface
  - Handles CSV upload, file parsing, and data visualization
  - Contains state management for all dashboard data
  - Integrates all major components (charts, metrics, drill-down)
  - Key functions: `handleFileUpload()`, `handleMetricClick()`, `handleChartClick()`

### Components (`client/src/components/`)
**Reusable UI components organized by feature.**

#### Core Dashboard Components
- **`WinnersPodium.tsx`** – Agent leaderboard with medal badges and metrics
- **`MetricCard.tsx`** – Individual metric display with animations
- **`DataHealthCheck.tsx`** – Data quality monitoring with field completeness
- **`DrillDownModal.tsx`** – Transaction detail view with expandable rows
- **`ExpandableTransactionRow.tsx`** – Row expansion for full transaction metadata

#### Chart Components (`client/src/components/charts/`)
**10+ interactive chart types for data visualization.**

- **`PipelineChart.tsx`** – Transaction status breakdown (Active, Closed, Pending, etc.)
- **`FinancialChart.tsx`** – Revenue trends over time
- **`CommissionBreakdownChart.tsx`** – Commission distribution by agent
- **`RevenueDistributionChart.tsx`** – Revenue by agent/property type
- **`BuySellTrendChart.tsx`** – Buy vs. sell transaction trends
- **`AgentMixChart.tsx`** – Agent contribution to total volume
- **`PropertyTypeChart.tsx`** – Transactions by property type
- **`GeographicChart.tsx`** – Geographic distribution by state/county
- **`LeadSourceChart.tsx`** – Lead source analysis
- **`SalesTimelineChart.tsx`** – Sales over time with trends
- **`InteractivePipelineChart.tsx`** – Advanced pipeline with date filtering
- **`ComplianceChart.tsx`** – Compliance metrics and indicators
- **`TagsChart.tsx`** – Transaction tags analysis
- **`PropertyInsightsChart.tsx`** – Property-specific metrics
- **`PriceReductionChart.tsx`** – Price reduction analysis

#### Upload & CSV Components
- **`UploadZone.tsx`** – Drag-and-drop CSV upload interface
- **`FieldMapper.tsx`** – Column mapping wizard for CSV fields
- **`ColumnMapping.tsx`** – Manual column mapping interface
- **`CSVPreview.tsx`** – Preview of parsed CSV data
- **`CSVUploadWidget.tsx`** – Simplified upload widget
- **`CSVDiagnosticReport.tsx`** – CSV parsing diagnostics

#### Commission & Financial Components
- **`CommissionProjector.tsx`** – Commission calculation and projection
- **`CommissionPlansManager.tsx`** – Tier structure management
- **`CommissionCalculator.tsx`** – Individual commission calculator
- **`CommissionBreakdownChart.tsx`** – Visual commission breakdown
- **`CommissionAuditReport.tsx`** – Commission audit and variance analysis
- **`CommissionStatement.tsx`** – Formatted commission statement
- **`CommissionComparisonReport.tsx`** – Compare commissions across agents
- **`CommissionVarianceReport.tsx`** – Variance from expected commissions
- **`CommissionRatioChart.tsx`** – Commission ratio analysis
- **`CommissionManagementPanel.tsx`** – Commission settings panel

#### Admin & Management Components
- **`DashboardLayout.tsx`** – Main layout with sidebar navigation
- **`DashboardLayoutSkeleton.tsx`** – Loading skeleton for dashboard
- **`AgentLeaderboardWithExport.tsx`** – Leaderboard with export functionality
- **`AgentDetailsPanel.tsx`** – Detailed agent information
- **`AgentAssignment.tsx`** – Assign transactions to agents
- **`TeamManager.tsx`** – Team management interface
- **`AgentOnePager.tsx`** – Single-page agent summary

#### Data & Reporting Components
- **`DataValidationReport.tsx`** – Data quality validation report
- **`ExportPDFButton.tsx`** – PDF export functionality
- **`RecentUploads.tsx`** – Recent upload history
- **`TrustBar.tsx`** – Trust metrics display

#### UI Components
- **`ErrorBoundary.tsx`** – Error handling and recovery
- **`ModeToggle.tsx`** – Light/dark theme switcher
- **`MobileNav.tsx`** – Mobile navigation menu
- **`DateRangePicker.tsx`** – Date range selection
- **`Dialog.tsx`** – Modal dialog component (from shadcn/ui)
- **`Card.tsx`** – Card container component (from shadcn/ui)
- **`Button.tsx`** – Button component (from shadcn/ui)
- **`Tabs.tsx`** – Tab navigation component (from shadcn/ui)
- **`Alert.tsx`** – Alert/notification component (from shadcn/ui)

### Utilities & Helpers (`client/src/lib/` and `client/src/utils/`)

#### CSV Processing
- **`csvParser.ts`** – Main CSV parsing logic with field detection
- **`csvValidation.ts`** – File validation (size, type, structure)
- **`normalizeRecord.ts`** – Record normalization with 12+ field name fallbacks
- **`fieldCompletenessAnalysis.ts`** – Data quality analysis across 10 key fields

#### Data Formatting & Utilities
- **`formatUtils.ts`** – Currency, percentage, and number formatting
- **`dataCleaning.ts`** – Data sanitization and type conversion
- **`dateUtils.ts`** – Date range filtering and period calculations
- **`sampleData.ts`** – Demo data generation

#### Storage & Persistence
- **`storage.ts`** – LocalStorage management for recent files
- **`importTemplates.ts`** – CSV template matching and saving

#### Hooks (`client/src/_core/hooks/`)
- **`useAuth.ts`** – Authentication state and logout functionality

### Styling (`client/src/`)
- **`index.css`** – Global styles, CSS variables, and Tailwind customizations
- **`components.json`** – shadcn/ui component configuration

### Configuration
- **`App.tsx`** – Route definitions and main layout
- **`main.tsx`** – React entry point with tRPC and query client setup
- **`const.ts`** – Application constants and configuration

---

## Backend Structure (`server/`)

### Main Router (`server/routers.ts`)
**Central tRPC router definition.**
- Combines all feature routers (uploads, admin, commission, etc.)
- Defines public and protected procedures
- Entry point for all API calls from frontend

### Feature Routers
**Specialized routers for different features.**

- **`uploadDb.ts`** – Upload management and history
- **`adminRouter.ts`** – Admin-only operations (user management, monitoring)
- **`commissionRouter.ts`** – Commission calculations and tier management
- **`dotloopOAuthRouter.ts`** – Dotloop OAuth integration
- **`tenantSettingsRouter.ts`** – Tenant configuration
- **`auditLogRouter.ts`** – Audit trail management
- **`performanceRouter.ts`** – Performance metrics and monitoring
- **`healthRouter.ts`** – System health checks
- **`seedRouter.ts`** – Database seeding utilities

### Database Layer (`server/db.ts`)
**Query helpers for database operations.**
- `getUploads()` – Retrieve upload history
- `getTransactions()` – Query transaction data
- `getAgentMetrics()` – Calculate agent performance metrics
- `createUpload()` – Store new upload record
- `updateUploadStatus()` – Update upload processing status
- Similar helpers for all major entities

### Storage (`server/storage.ts`)
**S3 file storage integration.**
- `storagePut()` – Upload files to S3
- `storageGet()` – Retrieve presigned URLs
- Handles file metadata and access control

### Validators
- **`csvValidator.test.ts`** – CSV validation logic with 19 passing tests
- **`transactionValidator.ts`** – Transaction data validation
- **`uploadDb.ts`** – Upload data validation

### Testing (`server/__tests__/` and `server/*.test.ts`)
**Comprehensive test coverage.**
- `adminRouter.test.ts` – 15 passing tests
- `auth.logout.test.ts` – Authentication tests
- `auditLogRouter.test.ts` – Audit log tests
- `csvValidator.test.ts` – 19 CSV validation tests
- `performanceRouter.test.ts` – Performance metrics tests
- `tenantSettingsRouter.test.ts` – Tenant settings tests
- `tierHistoryRouter.test.ts` – Commission tier tests
- `transactionValidator.test.ts` – Transaction validation tests
- `uploads.test.ts` – Upload flow tests

### Framework Core (`server/_core/`)
**Internal framework infrastructure (avoid editing unless extending framework).**
- `context.ts` – Request context setup with tenant isolation
- `auth.ts` – Authentication logic
- `oauth.ts` – OAuth flow handling
- `trpc.ts` – tRPC server setup
- `cookies.ts` – Session cookie management
- `llm.ts` – LLM integration helpers
- `imageGeneration.ts` – Image generation API
- `voiceTranscription.ts` – Speech-to-text integration
- `notification.ts` – Owner notification system
- `map.ts` – Google Maps integration
- `dataApi.ts` – Manus data API access
- `env.ts` – Environment variable definitions
- `index.ts` – Server entry point
- `vite.ts` – Vite integration

---

## Database Schema (`drizzle/`)

### Main Schema (`drizzle/schema.ts`)
**Table definitions for core entities.**

#### User & Authentication
- **`users`** table – User accounts with roles (admin/user)
- **`sessions`** table – Active user sessions

#### Data Management
- **`uploads`** table – CSV upload records with metadata
  - Fields: `id`, `userId`, `fileName`, `fileSize`, `recordCount`, `status`, `uploadedAt`
  - Performance tracking: `validationTimeMs`, `parsingTimeMs`, `uploadTimeMs`, `totalTimeMs`
- **`transactions`** table – Parsed transaction data
  - Fields: Agent, status, price, dates, property info, etc.
  - Indexed for fast queries

#### Multi-Tenant
- **`tenants`** table – Brokerage information
- **`tenantUsers`** table – User-tenant associations
- **`tenantSettings`** table – Tenant configuration

#### Commission Management
- **`commissionPlans`** table – Tier structures
- **`commissionTiers`** table – Individual tier definitions
- **`tierHistory`** table – Commission tier change tracking

#### Audit & Monitoring
- **`auditLogs`** table – System activity tracking
- **`performanceMetrics`** table – Processing performance data

### Relations (`drizzle/relations.ts`)
**Relationship definitions between tables.**
- User → Sessions (one-to-many)
- User → Uploads (one-to-many)
- Upload → Transactions (one-to-many)
- Tenant → Users (one-to-many)
- CommissionPlan → Tiers (one-to-many)

### Migrations (`drizzle/migrations/`)
**SQL migration files for schema changes.**
- Each migration numbered (0000, 0001, etc.)
- Generated automatically by `drizzle-kit generate`
- Applied with `pnpm db:push`

---

## Shared Code (`shared/`)

### Types (`shared/types.ts`)
**Shared TypeScript types used across frontend and backend.**
- `DotloopRecord` – Parsed transaction record
- `DashboardMetrics` – Aggregated dashboard metrics
- `AgentMetrics` – Agent performance metrics
- `UploadRecord` – Upload metadata
- `CommissionPlan` – Commission tier structure

### Constants (`shared/const.ts`)
**Shared constants and configuration values.**
- `AXIOS_TIMEOUT_MS` – HTTP timeout
- `UNAUTHED_ERR_MSG` – Authentication error message
- `NOT_ADMIN_ERR_MSG` – Authorization error message

---

## Configuration Files

### `package.json`
**Project metadata and scripts.**
- **Scripts:**
  - `dev` – Start development server
  - `build` – Build for production
  - `start` – Run production server
  - `test` – Run tests
  - `db:push` – Apply database migrations
  - `format` – Format code with Prettier
  - `check` – TypeScript type checking

### `tsconfig.json`
**TypeScript compiler options.**
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Path aliases: `@/*` → `client/src/*`

### `vite.config.ts`
**Vite build configuration.**
- React plugin enabled
- Path aliases configured
- Dev server settings
- Build optimization

### `drizzle.config.ts`
**Drizzle ORM configuration.**
- Database connection
- Schema location
- Migration directory

### `vitest.config.ts`
**Vitest testing configuration.**
- Test environment: node
- Coverage configuration
- Test patterns

---

## Key Files by Feature

### CSV Upload & Parsing
1. **Frontend:** `client/src/components/UploadZone.tsx`
2. **Validation:** `client/src/utils/csvValidation.ts`
3. **Parsing:** `client/src/lib/csvParser.ts`
4. **Normalization:** `client/src/utils/normalizeRecord.ts`
5. **Backend:** `server/uploadDb.ts`
6. **Tests:** `server/csvValidator.test.ts`

### Data Visualization
1. **Dashboard:** `client/src/pages/Home.tsx`
2. **Charts:** `client/src/components/charts/` (10+ files)
3. **Drill-Down:** `client/src/components/DrillDownModal.tsx`
4. **Metrics:** `client/src/components/MetricCard.tsx`

### Agent Performance
1. **Leaderboard:** `client/src/components/WinnersPodium.tsx`
2. **Backend:** `server/db.ts` (`getAgentMetrics()`)
3. **API:** `server/routers.ts` (agent procedures)

### Commission Management
1. **UI:** `client/src/components/CommissionPlansManager.tsx`
2. **Calculator:** `client/src/components/CommissionCalculator.tsx`
3. **Backend:** `server/commissionRouter.ts`
4. **Database:** `drizzle/schema.ts` (commission tables)

### Admin Dashboard
1. **Layout:** `client/src/components/DashboardLayout.tsx`
2. **Router:** `server/adminRouter.ts`
3. **Tests:** `server/adminRouter.test.ts`

### Authentication
1. **Hook:** `client/src/_core/hooks/useAuth.ts`
2. **Backend:** `server/_core/auth.ts`
3. **OAuth:** `server/_core/oauth.ts`
4. **Tests:** `server/auth.logout.test.ts`

### Data Quality
1. **Component:** `client/src/components/DataHealthCheck.tsx`
2. **Analysis:** `client/src/utils/fieldCompletenessAnalysis.ts`
3. **Validation:** `server/transactionValidator.ts`

---

## Data Flow Examples

### CSV Upload Flow
```
1. User selects file in UploadZone.tsx
2. Frontend validates file (csvValidation.ts)
3. Frontend parses CSV (csvParser.ts)
4. Frontend normalizes records (normalizeRecord.ts)
5. Frontend calls tRPC mutation (routers.ts)
6. Backend validates records (transactionValidator.ts)
7. Backend stores in database (uploadDb.ts)
8. Frontend updates dashboard with new data
```

### Chart Drill-Down Flow
```
1. User clicks on chart segment (e.g., "Closed" in PipelineChart)
2. Home.tsx calls handleChartClick() with filter criteria
3. Filters transactions array (filteredRecords)
4. Opens DrillDownModal with filtered transactions
5. User can expand rows to see full details (ExpandableTransactionRow)
6. User can export or perform other actions
```

### Agent Metrics Calculation
```
1. Home.tsx loads transactions (from CSV or database)
2. Calls calculateAgentMetrics() from csvParser.ts
3. Groups transactions by agent
4. Calculates revenue, deals closed, average price, etc.
5. Sorts by revenue to create leaderboard
6. Renders WinnersPodium with top 3 agents
```

---

## Common Patterns

### Adding a New Chart
1. Create `client/src/components/charts/NewChart.tsx`
2. Import Recharts components
3. Add responsive height classes: `h-64 sm:h-72 md:h-80`
4. Implement `onClick` handler for drill-down
5. Import in `Home.tsx` and add to dashboard
6. Add test coverage

### Adding a New API Endpoint
1. Define procedure in `server/routers.ts`
2. Add database helper in `server/db.ts` if needed
3. Add input validation with Zod
4. Add tests in `server/__tests__/`
5. Call from frontend: `trpc.feature.useQuery()`
6. Handle loading/error states

### Adding a Database Table
1. Define table in `drizzle/schema.ts`
2. Run `pnpm db:push` to generate migration
3. Add relations in `drizzle/relations.ts`
4. Create query helpers in `server/db.ts`
5. Add tRPC procedures in `server/routers.ts`
6. Add tests for new procedures

### Styling Components
1. Use Tailwind utility classes
2. Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
3. Dark mode: `dark:` prefix
4. Landscape: `landscape:` prefix
5. Extract repeated patterns to CSS classes in `index.css`
6. Use CSS variables for theming

---

## Testing Patterns

### Unit Test Example (CSV Validation)
```typescript
import { describe, it, expect } from 'vitest';
import { validateCSV } from '@/utils/csvValidation';

describe('CSV Validation', () => {
  it('should reject files larger than 10MB', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv');
    expect(() => validateCSV(largeFile)).toThrow('File too large');
  });
});
```

### Integration Test Example (Upload Flow)
```typescript
it('should upload and parse CSV successfully', async () => {
  const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
  const result = await uploadCSV(file);
  expect(result.recordCount).toBeGreaterThan(0);
  expect(result.status).toBe('success');
});
```

---

## Performance Tips

### Frontend
- Use `useMemo()` for expensive calculations
- Lazy load charts with React.lazy()
- Virtualize long lists with react-window
- Debounce search/filter inputs
- Use responsive images with srcset

### Backend
- Index frequently queried columns
- Use database query pagination
- Cache computed metrics
- Stream large file uploads
- Use connection pooling

### Database
- Analyze slow queries with EXPLAIN
- Add indexes for WHERE/JOIN columns
- Partition large tables by date
- Archive old data periodically
- Monitor query performance

---

## Debugging Tips

### Frontend Debugging
```bash
# Check browser console for errors
# Use React DevTools extension
# Use Recharts debug mode
# Log component state: console.log(state)
# Check network tab for API calls
```

### Backend Debugging
```bash
# Add console.log() statements
# Use TypeScript strict mode
# Check server logs: pnpm dev output
# Test procedures with Postman/curl
# Use database client to inspect data
```

### Database Debugging
```bash
# Connect with MySQL client
# Run EXPLAIN on slow queries
# Check table indexes: SHOW INDEXES FROM table_name
# Monitor active connections
# Check slow query log
```

---

## File Size & Complexity

### Large Files (>300 lines)
- `client/src/pages/Home.tsx` (847 lines) – Main dashboard
- `client/src/components/DrillDownModal.tsx` – Complex modal
- `server/routers.ts` – Main router definition
- `server/adminRouter.ts` – Admin procedures

### Medium Files (100-300 lines)
- Most chart components
- Commission components
- Utility functions

### Small Files (<100 lines)
- UI components from shadcn/ui
- Simple utility functions
- Constants and types

---

## Next Steps for Claude

When working with this codebase:

1. **Start with README.md** – Get project overview
2. **Review ARCHITECTURE.md** – Understand system design
3. **Check docs/SECURITY.md** – Understand security model
4. **Read key files** – Start with Home.tsx, routers.ts, schema.ts
5. **Review tests** – Understand testing patterns
6. **Follow code patterns** – Use existing patterns as templates
7. **Run tests** – Verify changes don't break existing functionality

---

**Last Updated:** January 27, 2026  
**For:** Claude AI Collaboration
