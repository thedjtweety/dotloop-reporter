# Dotloop Reporting Tool - Developer Presentation Guide

**Last Updated:** February 5, 2026  
**Project Status:** Production-Ready  
**Live URL:** https://dotlooproport.com

---

## Executive Summary

The Dotloop Reporting Tool is a full-stack web application that transforms Dotloop CSV exports into actionable business intelligence for real estate brokerages. Built with React 19, TypeScript, Express, and tRPC, the platform provides interactive dashboards, commission calculations, agent performance tracking, and comprehensive data analytics.

**Key Metrics:**
- 50+ React components
- 10+ interactive chart visualizations
- 900+ unit tests with comprehensive coverage
- Mobile-responsive with landscape optimization
- Multi-tenant architecture with role-based access control

---

## Recent Developments (Latest Checkpoint: 18f80fa0)

### Chart Formula Audit & Validation
- **Audited 4 remaining charts:** Lead Source, Property Type, Geographic, Financial
- **Result:** All charts use correct formulas (transaction counting by category)
- **Documentation:** Created `REMAINING_CHARTS_AUDIT.md` with detailed findings
- **Previous fixes:** Sales Volume Over Time and Buy vs Sell Trends (checkpoint 4059a782)

### Bulk Selection & Export Features
- **Checkbox Selection:** Added multi-select capability to all transaction tables
- **Select All/Deselect All:** Header checkbox for batch operations
- **Bulk Actions Toolbar:** Integrated with existing export functionality
  - Export CSV for selected transactions
  - Export Excel for selected transactions
  - Open Multiple in Dotloop
  - Bulk Tag functionality
- **Test Coverage:** 15 comprehensive tests in `bulkSelection.test.tsx`

### Analytics Enhancements
- **Drill-Down Modals:** All charts now support click-to-drill-down functionality
- **Data Point Interactions:** Click any chart element to view underlying transactions
- **Filter Integration:** Drill-down views respect date range and filter selections

---

## Architecture Overview

### Frontend Stack
```
React 19 + TypeScript + Tailwind CSS 4
├── State Management: React hooks (useState, useEffect, useMemo)
├── Data Fetching: tRPC client with React Query
├── UI Components: shadcn/ui + custom components
├── Charts: Recharts library
└── Routing: Wouter (lightweight React router)
```

### Backend Stack
```
Express 4 + tRPC 11 + Drizzle ORM
├── API Layer: tRPC procedures (type-safe RPC)
├── Database: MySQL/TiDB with Drizzle ORM
├── Authentication: Manus OAuth integration
└── File Storage: AWS S3 via Manus storage helpers
```

### Key Design Patterns
1. **Type Safety:** End-to-end TypeScript with tRPC for API contracts
2. **Component Composition:** Reusable UI components with prop-based configuration
3. **Data Transformation:** CSV parsing → normalization → aggregation → visualization
4. **Responsive Design:** Mobile-first with breakpoint-based layouts

---

## Core Features & Implementation

### 1. CSV Upload & Processing
**Files:** `client/src/components/UploadZone.tsx`, `client/src/lib/csvParser.ts`

- **Field Mapping:** Intelligent detection of Dotloop export formats
- **Data Normalization:** Standardizes field names and data types
- **Validation:** File size limits (10MB), structure validation, error recovery
- **Storage:** Recent uploads persisted to localStorage for quick access

**Key Functions:**
- `parseCSV()` - PapaParse-based CSV parsing with error handling
- `normalizeRecord()` - Converts raw CSV rows to typed `DotloopRecord` objects
- `findMatchingTemplate()` - Detects known Dotloop export formats

### 2. Dashboard & Metrics
**Files:** `client/src/pages/Home.tsx`, `client/src/lib/csvParser.ts`

- **Real-Time Calculations:** Metrics update instantly on date range changes
- **Trend Analysis:** Period-over-period comparisons with percentage changes
- **Pipeline Visualization:** Active, Contract, Closed, Archived status tracking

**Key Metrics:**
- Total Transactions
- Sales Volume
- Average Days to Close
- Commission Totals
- Agent Performance Rankings

**Key Functions:**
- `calculateMetrics()` - Computes dashboard metrics with trend analysis
- `calculateAgentMetrics()` - Per-agent performance aggregation
- `filterRecordsByDate()` - Date range filtering with timezone handling

### 3. Interactive Charts (10+ Visualizations)
**Files:** `client/src/components/charts/*`

All charts support:
- Click-to-drill-down functionality
- Responsive sizing (mobile, tablet, desktop)
- Dark mode theming
- Export to PNG/SVG

**Chart Types:**
1. **Pipeline Chart** - Transaction status distribution (Bar)
2. **Financial Chart** - Revenue metrics with sparklines (Cards + Line)
3. **Sales Timeline** - Monthly sales volume with moving average (Area + Line)
4. **Buy vs Sell Trends** - Deal value comparison by side (Area)
5. **Lead Source Chart** - Lead attribution analysis (Pie)
6. **Property Type Chart** - Property category breakdown (Pie)
7. **Geographic Chart** - State-level transaction distribution (Bar)
8. **Agent Leaderboard** - Top performers with metrics (Table + Podium)
9. **Commission Breakdown** - Buy-side vs Sell-side split (Pie)
10. **Revenue Distribution** - Deal value ranges (Bar)
11. **Compliance Chart** - Document completion tracking (Donut)
12. **Tags Chart** - Custom tag usage (Bar)

**Recent Formula Fixes:**
- `getSalesOverTime()` - Now includes ALL deals (Active, Contract, Closed), grouped by listing date
- `getBuySellTrends()` - Calculates deal values by side instead of commission amounts

### 4. Drill-Down Analysis
**Files:** `client/src/components/DrillDownModal.tsx`, `client/src/components/TransactionTable.tsx`

- **Full-Screen Modal:** Maximizes display area for detailed analysis
- **Transaction Table:** Sortable, searchable, with column visibility controls
- **Bulk Selection:** Checkbox-based multi-select with "Select All"
- **Bulk Actions:** Export CSV/Excel, Open in Dotloop, Tag multiple transactions
- **Expandable Rows:** Click to view full transaction metadata

**Key Features:**
- **Search:** Filter by property, address, status, or agent
- **Sort:** Click column headers to sort ascending/descending
- **Pagination:** 20 transactions per page with navigation
- **Column Customization:** Show/hide columns via dropdown menu

### 5. Commission Management
**Files:** `client/src/components/CommissionPlansManager.tsx`, `client/src/components/CommissionProjector.tsx`

- **Tiered Plans:** Support for progressive commission structures
- **Agent Assignment:** Link agents to specific commission plans
- **Projections:** "What-if" analysis for future earnings
- **Audit Reports:** Variance detection and commission validation

**Commission Plan Structure:**
```typescript
{
  name: string;
  tiers: [
    { threshold: number; rate: number; cap?: number }
  ];
  appliesTo: 'buy' | 'sell' | 'both';
}
```

### 6. Data Quality Monitoring
**Files:** `client/src/components/DataHealthCheck.tsx`, `client/src/lib/dataCleaning.ts`

- **Missing Field Detection:** Identifies incomplete records
- **Data Quality Score:** Overall health percentage
- **Field-Level Analysis:** Per-field completeness metrics
- **Cleaning Functions:** `cleanDate()`, `cleanNumber()`, `cleanPercentage()`, `cleanText()`

---

## Testing Strategy

### Unit Tests (900+ tests)
**Framework:** Vitest with React Testing Library

**Test Coverage Areas:**
1. **CSV Parsing** - `client/src/lib/__tests__/csvParser.test.ts`
2. **Data Cleaning** - `client/src/lib/__tests__/dataCleaning.test.ts`
3. **Analytics Charts** - `client/src/lib/__tests__/analyticsCharts.test.ts`
4. **Bulk Selection** - `client/src/components/__tests__/bulkSelection.test.tsx`
5. **Commission Calculations** - `client/src/lib/__tests__/commissionCalculations.test.ts`
6. **Date Utilities** - `client/src/lib/__tests__/dateUtils.test.ts`
7. **Authentication** - `server/auth.logout.test.ts`

**Run Tests:**
```bash
pnpm test                    # Run all tests
pnpm test -- csvParser       # Run specific test file
pnpm test -- --coverage      # Generate coverage report
```

### Integration Tests
- **OAuth Flow** - `server/oauth-token-helper.test.ts`
- **tRPC Procedures** - `server/integration.test.ts`

---

## Database Schema

### Tables
1. **users** - User accounts with OAuth integration
   - `id`, `openId`, `name`, `email`, `role`, `createdAt`, `updatedAt`

2. **oauth_tokens** - Encrypted Dotloop OAuth tokens
   - `id`, `userId`, `encryptedToken`, `createdAt`, `updatedAt`

3. **commission_plans** - Tiered commission structures
   - `id`, `userId`, `name`, `tiers`, `appliesTo`, `createdAt`

4. **agent_assignments** - Links agents to commission plans
   - `id`, `userId`, `agentName`, `commissionPlanId`, `createdAt`

**Schema File:** `drizzle/schema.ts`  
**Migrations:** `drizzle/migrations/`

**Database Commands:**
```bash
pnpm db:push    # Push schema changes to database
```

---

## API Layer (tRPC)

### Public Procedures
- `auth.me` - Get current user session
- `auth.logout` - Clear session and logout

### Protected Procedures (require authentication)
- `commissionPlans.list` - Get user's commission plans
- `commissionPlans.create` - Create new commission plan
- `commissionPlans.update` - Update existing plan
- `commissionPlans.delete` - Delete commission plan
- `agentAssignments.list` - Get agent-plan assignments
- `agentAssignments.create` - Assign agent to plan
- `agentAssignments.delete` - Remove assignment

### System Procedures
- `system.notifyOwner` - Send notification to project owner

**Router File:** `server/routers.ts`

---

## Deployment & DevOps

### Development
```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server (port 5173)
pnpm build      # Build for production
pnpm test       # Run test suite
```

### Production Hosting
- **Platform:** Manus Hosting (built-in)
- **Domain:** dotlooproport.com (custom domain)
- **SSL:** Automatic HTTPS
- **CDN:** Global edge network

### GitHub Integration
- **Repository:** Synced via Manus GitHub integration
- **Branch:** `main` (auto-sync on checkpoint save)
- **Conflict Resolution:** Manual merge required if conflicts detected

**Setup Guide:** `GITHUB_SETUP_GUIDE.md`

---

## Security & Compliance

### Authentication
- **OAuth Provider:** Manus OAuth (OpenID Connect)
- **Session Management:** HTTP-only cookies with JWT
- **Token Encryption:** AES-256 encryption for stored OAuth tokens

### Data Protection
- **Tenant Isolation:** Complete data separation between users
- **Role-Based Access:** Admin vs User permissions
- **Input Validation:** Server-side validation for all inputs
- **SQL Injection Prevention:** Parameterized queries via Drizzle ORM

### File Upload Security
- **Size Limits:** 10MB max file size
- **Type Validation:** CSV/text files only
- **Content Scanning:** Structure validation before processing

**Security Docs:** `Internal_Security_Compliance_Memo.md`

---

## Performance Optimizations

### Frontend
1. **Code Splitting:** Lazy loading for large components
2. **Memoization:** `useMemo` for expensive calculations
3. **Debouncing:** Search input with 300ms delay
4. **Virtual Scrolling:** Large transaction lists (future enhancement)

### Backend
1. **Database Indexing:** Indexed on `userId`, `openId`, `agentName`
2. **Query Optimization:** Drizzle ORM with prepared statements
3. **Caching:** localStorage for recent uploads and user preferences

### Charts
1. **Responsive Sizing:** Dynamic width/height based on container
2. **Data Aggregation:** Pre-computed metrics to reduce render time
3. **Conditional Rendering:** Only render visible charts

---

## Known Issues & Future Enhancements

### Known Issues
1. **Analytics Charts Tests:** Date handling in `getSalesOverTime()` tests needs adjustment
   - Tests expect Date objects but implementation uses string dates
   - Fix scheduled for next development cycle

### Planned Enhancements
1. **Saved Filter Presets** - Bookmark frequently-used filter combinations
2. **Bulk Edit Commission Plans** - Apply plans to multiple transactions at once
3. **Export Templates** - Customizable column selection for CSV/Excel exports
4. **Real-Time Collaboration** - Multi-user editing with WebSocket sync
5. **Advanced Analytics** - Predictive modeling and forecasting

**Tracking:** See `todo.md` for complete task list

---

## Documentation Index

### For Developers
- **README.md** - Project overview and quick start
- **START_HERE.md** - Onboarding guide for new developers
- **DEVELOPMENT_WORKFLOW.md** - Git workflow and contribution guidelines
- **FullStack_Architecture_Guide.md** - Detailed architecture documentation
- **CLAUDE_CODE_GUIDE.md** - AI-assisted development guidelines

### For Product/Business
- **EXECUTIVE_SUMMARY.md** - High-level project summary
- **Product_Requirement_Document.md** - Feature specifications
- **FEATURE_COMPLETION_SUMMARY.md** - Completed features checklist

### For Operations
- **GITHUB_SETUP_GUIDE.md** - GitHub integration setup
- **ADMIN_ACCESS_GUIDE.md** - Admin dashboard usage
- **Security_Briefing_For_Leadership.md** - Security overview

### For Testing
- **SAMPLE_DATA_AND_VALIDATION_GUIDE.md** - Test data generation
- **TRANSACTION_CLICKABILITY_TESTING.md** - UI interaction testing
- **COMMISSION_PROJECTOR_TESTING_SUMMARY.md** - Commission feature testing

### Technical References
- **ANALYTICS_CHARTS_AUDIT.md** - Chart formula validation (previous checkpoint)
- **REMAINING_CHARTS_AUDIT.md** - Latest chart audit findings
- **CSV_ROBUSTNESS_GUIDE.md** - CSV parsing edge cases
- **TIER_ANALYTICS_GUIDE.md** - Commission tier calculations

---

## Quick Reference Commands

### Development
```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Format code
pnpm format

# Database migration
pnpm db:push
```

### Git Operations
```bash
# View current branch
git branch

# View recent commits
git log --oneline -10

# Check for uncommitted changes
git status
```

### Project Status
```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Check for outdated dependencies
pnpm outdated

# View project structure
tree -L 2 -I 'node_modules|dist'
```

---

## Contact & Support

**Project Owner:** [Owner Name]  
**Development Team:** [Team Names]  
**Support:** https://help.manus.im  
**Live Site:** https://dotlooproport.com

---

## Appendix: Component Inventory

### Page Components (1)
- `Home.tsx` - Main dashboard with upload and analytics

### Chart Components (12)
- `PipelineChart.tsx`
- `FinancialChart.tsx`
- `SalesTimelineChart.tsx`
- `BuySellTrendChart.tsx`
- `LeadSourceChart.tsx`
- `PropertyTypeChart.tsx`
- `GeographicChart.tsx`
- `AgentLeaderboardWithExport.tsx`
- `CommissionBreakdownChart.tsx`
- `RevenueDistributionChart.tsx`
- `ComplianceChart.tsx`
- `TagsChart.tsx`

### Feature Components (15)
- `UploadZone.tsx` - CSV file upload
- `DrillDownModal.tsx` - Transaction detail view
- `TransactionTable.tsx` - Sortable transaction list
- `ExpandableTransactionRow.tsx` - Row with expandable details
- `BulkActionsToolbar.tsx` - Bulk export/tag actions
- `DataHealthCheck.tsx` - Data quality monitoring
- `CommissionPlansManager.tsx` - Commission plan CRUD
- `CommissionProjector.tsx` - "What-if" analysis
- `TeamManager.tsx` - Agent management
- `AgentAssignment.tsx` - Link agents to plans
- `CommissionAuditReport.tsx` - Variance detection
- `DataValidationReport.tsx` - Data quality report
- `ColumnMapping.tsx` - CSV field mapping wizard
- `FieldMapper.tsx` - Manual field mapping
- `RecentUploads.tsx` - Upload history

### UI Components (20+)
- `MetricCard.tsx` - Dashboard metric display
- `TrustBar.tsx` - Social proof indicators
- `WinnersPodium.tsx` - Top 3 agents visualization
- `MobileNav.tsx` - Mobile navigation menu
- `ModeToggle.tsx` - Dark/light theme switcher
- `DotloopLogo.tsx` - Branded logo component
- `ResizableTableHeader.tsx` - Draggable column widths
- `DatePickerWithRange.tsx` - Date range selector
- Plus shadcn/ui components (Button, Card, Dialog, etc.)

---

**End of Presentation Guide**
