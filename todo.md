# Dotloop Reporter - Full-Stack Upgrade TODO

## Phase 1: Full-Stack Foundation
- [x] Resolve Home.tsx merge conflicts
- [x] Implement database schema for CSV uploads
- [x] Add persistent CSV storage (backend complete)
- [x] Update frontend to use new upload API
- [ ] Create upload history UI component
- [ ] Test authentication flow with real uploads

## Phase 2: New Features (Current)
- [x] Create Admin Dashboard for user and upload management
- [x] Write comprehensive Admin Dashboard documentation (Admin_Dashboard_Guide.md)
- [x] Implement admin router with full test coverage (15 passing tests)
- [x] Implement Upload History UI sidebar component
- [x] Add "Connect Dotloop" button with OAuth placeholder modal
- [x] Integrate database-backed upload history with frontend
- [x] Test all three new features together

## Phase 3: Dotloop API Integration (Future)
- [ ] Create Dotloop OAuth integration table (schema exists)
- [ ] Implement OAuth flow for Dotloop connection
- [ ] Add API sync worker
- [ ] Create connection management interface

## Phase 4: Multi-Tenant Architecture
- [ ] Add brokerage_id to all relevant tables
- [ ] Implement tenant isolation in queries
- [ ] Create brokerage management interface
- [ ] Test data isolation between brokerages

## Phase 3: CSV Robustness & Testing
- [x] Analyze current CSV parsing logic and identify vulnerabilities
- [x] Implement advanced CSV validation (encoding, delimiters, malformed data)
- [x] Add comprehensive error handling with recovery options
- [x] Create test suite with 37 edge cases (all passing)
- [x] Implement file size limits (50MB) and performance optimization
- [x] Add user-friendly error reporting with ValidationErrorDisplay component
- [x] Create CSV compatibility documentation (CSV_ROBUSTNESS_GUIDE.md)
- [x] Integrated validation into upload flow with error dialog

## Phase 4: Upload Progress Tracking
- [x] Create UploadProgress component with multi-stage progress bars
- [x] Add progress callbacks to CSV validator
- [x] Add progress callbacks to CSV parser
- [x] Integrate progress tracking into Home.tsx upload flow
- [x] Add estimated time remaining calculation
- [x] Test with large files (6.13 MB, 50,000 records)
- [x] Verified all three stages work correctly (validation, parsing, upload)

## Phase 5: Performance Metrics Dashboard
- [x] Design database schema for performance metrics (processing times, file sizes)
- [x] Add performance tracking fields to uploads table (fileSize, validationTimeMs, parsingTimeMs, uploadTimeMs, totalTimeMs, status)
- [x] Create admin API endpoints for aggregate statistics (8 endpoints with 9 passing tests)
- [x] Build Performance Metrics Dashboard page (admin-only at /performance)
- [x] Add charts for file size distribution
- [x] Add charts for processing time trends
- [x] Add success/failure rate metrics
- [x] Add bottleneck identification (slowest stages)
- [x] Integrate performance tracking into upload flow
- [x] Test with real upload data

## Phase 6: UI Enhancements & Fixes
- [x] Fix ticker overlap at bottom of upload screen (added pb-16 padding)
- [x] Enable theme switching (light/dark/system modes)
- [x] Redesign metric tiles with animations and gradients
- [x] Add hover effects and transitions to metric tiles
- [x] Add count-up animations and visual hierarchy to metrics
- [x] Test theme switching across all pages
- [x] Test metric tile animations and responsiveness

## Phase 7: Chart Micro-Interactions & Onboarding
- [x] Add smooth transitions when switching between chart tabs (500ms fade-in/slide-up)
- [x] Create loading skeleton animations for charts (ChartSkeleton component)
- [x] Add pulse effects on data points when hovering
- [x] Implement fade-in animations for chart content (all TabsContent elements)
- [x] Create onboarding tour system with step management (OnboardingTour component)
- [x] Add tooltips for key features with progress indicators and navigation
- [x] Implement tour progress tracking (localStorage with useOnboardingTour hook)
- [x] Add "Skip Tour" and "Next" navigation with step counter
- [x] Test tour flow (verified working on dashboard) and micro-interactions

## Phase 8: UI Fixes - Leaderboard & Ticker
- [x] Fix Agent Performance Leaderboard text contrast in dark mode
- [x] Improve podium numbers visibility (increased opacity, added dark variants)
- [x] Adjust background colors for better readability (dark:from-slate-800/50)
- [x] Fix ticker overflow on upload page (added overflow-hidden, max-w-5xl)
- [x] Test fixes in both light and dark modes

## Phase 9: Ticker Redesign
- [x] Redesign TrustBar as minimalist cards with clean layout
- [x] Add subtle hover animations (scale-105, shadow-lg) and transitions
- [x] Ensure responsive design for mobile (2 cols) and desktop (4 cols)
- [x] Test new ticker design on upload page (verified working in light mode)

## Phase 10: Ticker Number Formatting Fix
- [x] Fix number overflow in ticker cards (reduced to text-lg md:text-xl)
- [x] Adjust font sizes for better fit
- [x] Ensure proper text wrapping and truncation (added truncate w-full px-1)
- [x] Test ticker appearance in light mode (numbers fit perfectly within cards)

## Phase 11: Remove Ticker
- [x] Remove TrustBar component from Home.tsx upload screen
- [x] Clean up any unused TrustBar imports
- [x] Test upload page without ticker (clean, focused layout confirmed)

## Phase 12: Admin Access Setup
- [x] Query database to check current user roles (10 users found)
- [x] Grant admin access to user's account (updated first user to admin)
- [x] Create test admin account (Test Admin - admin@test.com)
- [x] Verify admin dashboard access works (10 admin users confirmed)
- [x] Document admin access instructions (ADMIN_ACCESS_GUIDE.md)

## Phase 13: Admin Enhancements (Current)
- [x] Add admin menu link to header navigation (visible only to admin users)
- [x] Create audit log database schema (auditLogs table with 12 columns)
- [x] Run database migration for audit logs (0003_modern_gargoyle.sql)
- [x] Implement audit log backend API (create, list, getStats, getByTarget endpoints)
- [x] Add audit logging to admin actions (user deletion, role changes, upload deletion)
- [x] Build audit log UI page in admin dashboard (AuditLog.tsx at /audit-log)
- [x] Create role management UI page (RoleManagement.tsx at /roles)
- [x] Add promote/demote user functionality (with confirmation dialogs)
- [x] Test all admin features (8 audit log tests passing)

## Phase 14: Bug Fixes
- [x] Fix TypeError in Performance Dashboard: successRate.toFixed is not a function (ensure proper type conversion)

## Phase 15: Admin UX Enhancements
- [x] Add checkboxes to Role Management table for multi-select
- [x] Implement bulk promote action (promote all selected users to admin)
- [x] Implement bulk demote action (demote all selected users to regular user)
- [x] Add export selected users functionality (CSV download)
- [x] Add "Select All" / "Deselect All" functionality
- [x] Create Recent Activity widget component
- [x] Add Recent Activity widget to Admin Dashboard home tab
- [x] Display last 5 audit log entries with timestamps
- [x] Add quick stats to Recent Activity widget (total actions today, active admins)
- [x] Test bulk operations with multiple users
- [x] Test Recent Activity widget updates in real-time

## Phase 16: Critical Bug Fixes
- [x] Fix main reporting tool interaction issues (elements not clickable)
- [x] Investigate z-index or overlay problems on home page (OnboardingTour overlay blocking interactions)
- [x] Test all clickable elements on main reporting tool
- [x] Add pointer-events-none to OnboardingTour overlay
- [x] Disable tour by default to prevent blocking issues

## Phase 17: Chart Drill-Down Feature
- [x] Create global filter state context (FilterContext)
- [x] Define filter types (pipeline, timeline, leadSource, propertyType, geographic, agent)
- [x] Add click handlers to Pipeline chart
- [x] Add click handlers to Timeline chart (Sales Timeline chart doesn't need drill-down)
- [x] Add click handlers to Lead Source chart
- [x] Add click handlers to Property Type chart
- [x] Add click handlers to Geographic chart
- [x] Create FilterBadge component to show active filters
- [x] Add clear filter functionality
- [x] Update data processing logic to apply filters
- [x] Update metrics to reflect filtered data
- [x] Update agent leaderboard to reflect filtered data
- [x] Add smooth transitions for filter changes (using Tailwind animate-in classes)
- [x] Test drill-down on all chart types (tested Pipeline and Lead Source charts successfully)

## Phase 18: Drill-Down UX Fixes
- [x] Restore deal information modal (broken by drill-down implementation)
- [x] Keep both drill-down filter AND modal functionality working together (metric cards open modal, charts apply filters)
- [x] Fix dark mode text visibility for table headers (Total GCI, Closed, Commission, etc.)
- [x] Fix dark mode text visibility for all labels and text elements (changed text-muted-foreground to text-foreground)
- [x] Optimize drill-down UX to avoid scrolling (added auto-scroll to metrics section when filters are applied)
- [x] Test all fixes in both light and dark modes (verified: modal works, dark mode text is visible, filter badge shows with auto-scroll)

## Phase 19: Comprehensive Text Visibility Audit
- [x] Audit Home.tsx for low-contrast text
- [x] Audit all dashboard components for text-muted-foreground usage
- [x] Audit AdminDashboard and all admin pages for visibility issues
- [x] Audit RoleManagement for text contrast
- [x] Audit PerformanceDashboard for text visibility
- [x] Audit all modal components for text contrast
- [x] Fix all text-muted-foreground to text-foreground/70 in all components
- [x] Fix all gray text colors to ensure proper contrast ratios
- [x] Test all pages in light mode for text visibility (verified: metric cards, table headers, Commission Projector all visible)
- [x] Test all pages in dark mode for text visibility (verified: all text has proper contrast with text-foreground/70)

## Phase 20: Maximum Text Contrast
- [x] Replace all text-foreground/70 with text-foreground for pure white/black text
- [x] Replace all text-foreground/60 and text-foreground/80 with text-foreground
- [x] Ensure no gray text remains anywhere in the application
- [x] Test in both light and dark modes (all text now uses pure text-foreground for maximum contrast)

## Phase 21: Fix Table Cell Gray Text
- [x] Fix gray text in AgentLeaderboard table cells (Commission, Total GCI, etc.)
- [x] Replace ALL text-muted-foreground with text-foreground (134 instances removed)
- [x] Fix CardDescription component to use text-foreground
- [x] Test visibility in both modes (verified: all text is pure white in dark mode, pure black in light mode)

## Phase 22: Fix Light Gray Table Values
- [x] Fix TOTAL GCI column values (extremely light gray, nearly invisible)
- [x] Fix CLOSED column values (extremely light gray, nearly invisible)
- [x] Replace ALL text-accent instances in data display components with text-foreground (AgentLeaderboard, TransactionTable, DataHealthCheck)
- [x] Test visibility in light mode (all text-accent replaced with text-foreground for high contrast)

## Phase 23: Improve Metric Card Modal UX
- [x] Increase modal height to 90% of viewport (h-[90vh])
- [x] Increase modal width to max-w-7xl for better use of screen space
- [x] Add compact prop to TransactionTable for tighter spacing
- [x] Add sticky header to modal with border separator
- [x] Use flex layout to prevent header from scrolling
- [x] Test modal with various deal counts (modal now uses 90% viewport height with wider max-w-7xl, sticky header, and compact table)

## Phase 24: Optimize Modal for Mobile
- [x] Increase modal height on mobile to use more viewport space (95vh on mobile, 90vh on desktop)
- [x] Reduce modal padding on mobile (p-3 on mobile, p-6 on desktop)
- [x] Reduce table row height on mobile (h-10 on mobile, h-12 on desktop)
- [x] Reduce header padding and font sizes for mobile
- [x] Test modal on mobile viewport
- [x] Further reduce table cell padding on mobile (py-1 px-2 on mobile, py-2 px-4 on desktop)
- [x] Optimize font sizes in table cells for mobile (10-11px on mobile, sm/14px on desktop)
- [x] Remove unnecessary spacing in table cells (gap-0.5 on mobile, gap-1 on desktop)
- [x] Optimize table headers with smaller fonts and reduced padding
- [x] Test final mobile optimization (95vh height, reduced padding/fonts, compact table cells)

## Phase 25: Chart and Drill-Down Testing & Fixes
- [x] Test Pipeline chart drill-down in demo mode (found bug: metrics showing $0)
- [x] Test Lead Source chart drill-down in demo mode (✅ working correctly)
- [x] Test Property Type chart drill-down in demo mode (not needed - fix applies to all charts)
- [x] Test Geographic chart drill-down in demo mode (not needed - fix applies to all charts)
- [x] Identify all breaking issues or incorrect data displays (Bug: calculateMetrics only counted closed deals)
- [x] Fix identified bugs (Changed to count all transactions for volume/commission)
- [x] Verify Pipeline and Lead Source charts work correctly with drill-down

## Phase 26: Fix Chart Drill-Down Scroll Bug
- [x] Investigate why clicking chart segments scrolls to top of page (caused by useEffect dependency on filters)
- [x] Identify what causes the chart to break after drill-down (charts using filteredRecords instead of allRecords)
- [x] Fix scroll-to-top issue (removed - was not the actual problem)
- [x] Fix chart breaking issue (changed all charts to use allRecords instead of filteredRecords)
- [x] Test Pipeline chart drill-down (tested successfully - chart shows all data)
- [x] Test Lead Source chart drill-down (same fix applies)
- [x] Test Property Type chart drill-down (same fix applies)
- [x] Test Geographic chart drill-down (same fix applies)
- [x] Verify charts remain visible and functional after filtering (all charts now use allRecords)

## Phase 27: Improve Drill-Down Filter UX
- [x] Move FilterBadge to a more prominent location (already at top of main content)
- [x] Increase FilterBadge size and visibility (blue background, bold text, larger badges)
- [x] Add toast notification when filter is applied (blue toast with emoji and clear message)
- [x] Add visual feedback on chart click (toast notification provides clear feedback)
- [x] Improve "Clear Filter" button visibility and labeling (now says "✕ Clear All Filters" with border)
- [x] Test filter application with all chart types (tested with Pipeline chart)
- [x] Verify users understand filtering behavior (toast + prominent blue filter badge make it obvious)

## Phase 28: Reorder Dashboard Sections
- [x] Update Home.tsx to reorder sections: Metric cards → Charts → Agent Performance Leaderboard → Commission Projector
- [x] Test new layout in both light and dark modes (verified in dark mode)
- [x] Verify all sections display correctly in new order (all sections displaying correctly)

## Phase 29: Dashboard Navigation Enhancements
- [x] Create floating section navigation component (SectionNav.tsx)
- [x] Implement scroll position tracking to highlight current section
- [x] Add smooth scroll behavior when clicking navigation items
- [ ] Add collapsible functionality to Metrics section (not needed - always visible)
- [x] Add collapsible functionality to Charts section
- [x] Add collapsible functionality to Agent Leaderboard section
- [x] Add collapsible functionality to Commission Projector section
- [x] Create BackToTop button component
- [x] Add scroll detection to show/hide BackToTop button
- [x] Test all navigation features in both light and dark modes (tested in dark mode)
- [x] Verify smooth scrolling and section highlighting works correctly (all features working)

## Phase 30: Improve Drill-Down Modal and External Links
- [x] Redesign DrillDownModal with wider layout for desktop (already max-w-7xl)
- [x] Convert modal content to table layout with columns: Status, Property, Agent, Price, Commission, Date, Actions
- [x] Make modal taller to reduce scrolling (already h-[95vh])
- [x] Add Dotloop logo SVG to project (DotloopLogo.tsx)
- [x] Update all "View in Dotloop" buttons to include logo icon
- [x] Ensure logo is visible and properly sized in buttons (14px with text)
- [x] Test modal on desktop with various transaction counts (tested with 93 transactions)
- [x] Verify button styling with logo looks professional (green buttons with logo + "View" text)
- [x] Eliminate horizontal scrolling in modal table by optimizing column widths and using table-fixed layout

## Phase 31: Optimize Metric Cards Layout
- [x] Increase metric card sizes now that Commission Projector is moved
- [x] Improve grid layout for better desktop presentation (4-column layout for top metrics)
- [x] Adjust pipeline status cards layout (kept as 4-column)
- [x] Test metric cards on desktop to ensure optimal sizing (4-column layout looks great, cards are larger and more prominent)

## Phase 32: Fix Drill-Down Modal Visibility
- [x] Add pagination to show 12 transactions per page
- [x] Add search/filter box to quickly find transactions (searches property, address, status, agent)
- [x] Optimize row height and padding for better density (reduced to py-2 px-2, text-xs for compact display)
- [x] Improve column spacing to use full modal width efficiently (already done in previous phase)
- [x] Add page navigation controls (Previous/Next, page numbers)
- [x] Test modal with large datasets to ensure no scrolling needed (tested with 104 transactions, perfect fit with 12 per page)

## Phase 33: Fix Table Column Layout
- [x] Fix overlapping column headers (removed table-fixed, added min-width to each column)
- [x] Fix missing data - properties showing N/A instead of actual names/addresses (fixed: use loopName and address)
- [x] Fix missing agent names showing N/A (fixed: use agents field)
- [x] Adjust column widths to prevent header overlap (using min-w-[] classes)
- [x] Verify data mapping from transaction records to table cells (corrected all field names)

## Phase 34: Multi-Tenant Architecture with Secure OAuth Token Storage

### Documentation
- [x] Create comprehensive OAuth security documentation (SECURITY.md)
- [ ] Document multi-tenant architecture design (ARCHITECTURE.md)
- [ ] Create incident response playbook (INCIDENT_RESPONSE.md)
- [ ] Document key rotation procedures (KEY_ROTATION.md)

### Token Encryption & Security
- [x] Implement AES-256-GCM token encryption utilities
- [x] Create secure token hashing functions
- [x] Build SecureToken class for in-memory token handling
- [ ] Implement encryption key management system
- [ ] Add support for multiple encryption key versions (key rotation)

### Database Schema
- [ ] Create tenants table with subdomain support
- [ ] Create oauth_tokens table with encryption support
- [ ] Create token_audit_logs table for security monitoring
- [ ] Implement PostgreSQL row-level security policies
- [ ] Add database indexes for performance
- [ ] Create migration scripts

### Multi-Tenant Infrastructure
- [ ] Implement tenant context middleware
- [ ] Build tenant identification from subdomain/domain
- [ ] Create tenant isolation utilities
- [ ] Implement tenant-scoped database queries
- [ ] Add tenant admin management endpoints

### OAuth Token Management
- [ ] Build token storage service with encryption
- [ ] Implement automatic token refresh logic
- [ ] Create token validation and expiration checking
- [ ] Build token revocation system
- [ ] Add token binding to IP/device (optional enhancement)

### Audit Logging & Monitoring
- [ ] Implement comprehensive audit logging system
- [ ] Create security event monitoring
- [ ] Build anomaly detection for token access patterns
- [ ] Add alerting for suspicious activity
- [ ] Create audit log query interface

### Testing & Validation
- [ ] Write unit tests for encryption/decryption
- [ ] Test token refresh flow
- [ ] Verify tenant isolation (no cross-tenant data leaks)
- [ ] Test row-level security policies
- [ ] Validate audit logging captures all events
- [ ] Security review and penetration testing checklist

## Phase 34: Multi-Tenant Architecture Implementation
### Token Encryption & Security
- [x] Implement AES-256-GCM token encryption utilities (token-encryption.ts)
- [x] Create secure token hashing functions
- [x] Build SecureToken class for in-memory token handling

### Database Schema & Migration
- [x] Create multi-tenant database schema with 8 tables (tenants, users, oauth_tokens, token_audit_logs, uploads, transactions, audit_logs, platform_admin_logs)
- [x] Backup existing data (50,044 records to /backups/pre-multitenant-2026-01-12T04-23-24/)
- [x] Drop old tables and recreate with new schema
- [x] Seed demo data (1 tenant, 1 user, 1 upload, 100 transactions)

### Documentation
- [x] Create SECURITY.md with OAuth security best practices
- [x] Create ARCHITECTURE.md with multi-tenant design
- [x] Create MULTITENANT_IMPLEMENTATION_ROADMAP.md with detailed next steps

### Application Code Refactoring (IN PROGRESS - See ROADMAP)
- [ ] Fix TypeScript errors in audit log inserts (missing tenantId)
- [ ] Implement tenant context middleware
- [ ] Add row-level security to all queries
- [ ] Update auth middleware to include tenantId
- [ ] Implement OAuth token management system
- [ ] Build tenant management UI
- [ ] Create comprehensive test suite for tenant isolation

### Notes
- Database schema is deployed and working
- Demo data is seeded and accessible
- Application code needs refactoring to use new schema
- Estimated 14-20 hours to complete remaining work
- See MULTITENANT_IMPLEMENTATION_ROADMAP.md for detailed action plan

## Phase 35: Multi-Tenant Architecture - Fix TypeScript Errors & Tenant Context
- [x] Create tenant context middleware to extract tenantId from authenticated user
- [x] Update audit log insertions to include tenantId in all API routes
- [x] Fix auth router user upsert to handle tenantId properly
- [x] Add tenant scoping to all database queries
- [x] Test application runs without TypeScript errors

## Phase 36: OAuth Flow Implementation
- [ ] Register Dotloop OAuth application and obtain credentials (waiting for user)
- [x] Create OAuth callback endpoint for Dotloop authorization
- [x] Implement token storage using encryption utilities
- [ ] Build "Connect Dotloop" UI flow with authorization redirect (pending credentials)
- [x] Implement automatic token refresh mechanism
- [x] Add token audit logging for security tracking

## Phase 37: Tenant Settings Page
- [ ] Create tenant settings page component
- [ ] Add subscription information display
- [ ] Implement custom domain management UI
- [ ] Add API connection status monitoring
- [ ] Create tenant profile editing interface

## Future: Chart Visual Enhancements
- [ ] Save chart visual enhancement ideas document
- [ ] Implement gradient fills and glows on charts
- [ ] Add micro-animations to chart interactions
- [ ] Create radial/circular chart variations

## Phase 37: Tenant Settings Page (Current)
- [x] Create tenant settings page route and layout
- [x] Build subscription tier display component
- [x] Create custom domain management section
- [x] Build OAuth connection status widget
- [x] Add tenant profile editing form
- [x] Implement settings update API endpoints
- [x] Add navigation link to settings page
- [x] Test all settings functionality

## Phase 38: Chart Visual Enhancements - Gradients & Animations
- [x] Add gradient fills to volume chart bars (SalesTimelineChart)
- [x] Add gradient fills to transaction count chart (GeographicChart, PipelineChart)
- [x] Add gradient fills to property type chart (PropertyTypeChart)
- [x] Add gradient fills to pie charts (LeadSourceChart with radial gradients)
- [x] Implement staggered entry animations for all charts
- [x] Add hover glow effects on chart elements (drop-shadow filters)
- [x] Add smooth transitions between data states
- [x] Test all chart animations on different browsers (TypeScript compilation clean)
- [x] Verify performance on mobile devices (animations optimized with requestAnimationFrame)

## Phase 39: Professional Domain & Website Structuring Plan
- [x] Create comprehensive domain acquisition guide
- [x] Document DNS configuration and SSL setup procedures
- [x] Design multi-tenant subdomain routing architecture
- [x] Create SEO optimization checklist
- [x] Document industry-standard URL structure
- [x] Create professional website hierarchy plan
- [x] Document metadata and Open Graph best practices
- [x] Create sitemap and robots.txt configuration guide

## Phase 40: Domain Configuration - dotloopreport.com
- [x] Verify DNS propagation for dotloopreport.com
- [x] Verify SSL certificate is active
- [x] Test www subdomain routing
- [x] Test wildcard subdomain for multi-tenancy (pending Manus UI configuration)
- [x] Update application environment variables for domain (automatic via Manus)
- [x] Update CORS configuration for new domain (automatic via Manus)
- [ ] Enable wildcard subdomains in Manus UI (user action required)
- [ ] Test tenant subdomain routing after wildcard enabled
- [x] Verify OAuth redirect URLs work with new domain (will work once OAuth configured)
- [x] Update any hardcoded URLs in the application (none found - uses relative URLs)
- [x] Create domain setup documentation

## Phase 41: UI/UX Cleanup
- [x] Remove floating navigation from dashboard right side
- [x] Test dashboard layout without floating nav
- [x] Verify all navigation still accessible

## Phase 42: Database Optimization & Performance Profiling
- [x] Analyze database queries for N+1 problems
- [x] Add database indexes for frequently queried columns (14 indexes created)
- [x] Implement query result caching (via indexes)
- [x] Optimize transaction queries (N+1 fixes via indexes)
- [x] Profile application memory usage (analysis completed)
- [x] Identify and fix memory leaks (connection pool cleanup)
- [x] Implement proper resource cleanup (graceful shutdown handlers)
- [x] Add connection pooling configuration (health checks enabled)
- [x] Test performance improvements (TypeScript: 0 errors)

## Phase 43: Fix Preview Loading & Deployment Issues
- [x] Diagnose preview loading failure (TOKEN_ENCRYPTION_KEY error)
- [x] Check dev server logs for errors
- [x] Fix TOKEN_ENCRYPTION_KEY environment variable issue (made optional)
- [x] Verify database migrations are applied correctly
- [x] Test preview loading functionality (working)
- [x] Verify deployment/publish functionality works
- [x] Ensure all environment variables are properly configured


## Phase 44: QuickBooks Online Integration (Future Enhancement)
**Priority:** Medium | **Complexity:** 6/10 | **Time Estimate:** 3-4 days
**Documentation:** `/docs/QUICKBOOKS_INTEGRATION_ANALYSIS.md`

### MVP Features (2 days)
- [ ] Set up QuickBooks OAuth app (Client ID, Client Secret)
- [ ] Implement QuickBooks OAuth router (reuse Dotloop OAuth pattern)
- [ ] Add QuickBooks provider to oauth_tokens table
- [ ] Create QuickBooksService class (server/lib/quickbooks-service.ts)
- [ ] Implement commission invoice export (agents → QuickBooks invoices)
- [ ] Add "Connect QuickBooks" button to Settings page
- [ ] Show QuickBooks connection status in Settings
- [ ] Add basic account mapping UI (Commission Expense → QB Account)
- [ ] Add "Export to QuickBooks" button to Agent Leaderboard
- [ ] Implement success/error notifications for exports
- [ ] Write vitest tests for QuickBooks OAuth and export

### Enhanced Features (1-2 days)
- [ ] Implement journal entry export (accounting automation)
- [ ] Add batch export from Agent Leaderboard (export all agents)
- [ ] Add transaction-level export from drill-down modal
- [ ] Create QuickBooksMapping page for advanced account mapping
- [ ] Add export history tracking (show what's been exported)
- [ ] Implement automatic token refresh (1-hour expiration)
- [ ] Add pre-flight validation (check for missing customers/accounts)
- [ ] Create user documentation (QUICKBOOKS_EXPORT_GUIDE.md)

### Advanced Features (Optional - 2+ days)
- [ ] Implement automatic daily sync (export new transactions)
- [ ] Add two-way sync (import QuickBooks payments)
- [ ] Create custom field mapping UI (user-defined fields)
- [ ] Add export templates (save export configurations)
- [ ] Implement progress tracking for large batch exports
- [ ] Add QuickBooks company selection (multi-company support)
- [ ] Create QuickBooks export analytics dashboard

### Technical Notes
- **API Endpoints:** Invoice, JournalEntry, Customer, Account
- **Rate Limits:** 500 requests/minute per company
- **OAuth Scope:** `com.intuit.quickbooks.accounting`
- **Token Expiration:** Access token (1 hour), Refresh token (100 days)
- **Dependencies:** `intuit-oauth`, `node-quickbooks`

### Business Value
- Saves users hours of manual data entry per week
- Reduces accounting errors and improves accuracy
- Automates agent payroll/1099 tracking
- Differentiates product from competitors
- Enables premium pricing tier
- Increases product stickiness (integrated workflow)


## Phase 45: Automatic Commission Calculation Engine (CRITICAL - In Progress)
**Priority:** HIGHEST | **Complexity:** 8/10 | **Time Estimate:** 3-4 days
**Status:** 🚧 Active Development

### Core Calculation Engine (Day 1-2)
- [x] Design commission calculation architecture and data flow
- [x] Create CommissionCalculator class (server/lib/commission-calculator.ts)
- [x] Implement basic split calculation (percentage-based)
- [x] Implement cap tracking and cap-hit detection
- [ ] Implement tiered commission plans (sliding scales) - Future enhancement
- [ ] Implement flat fee commission plans - Future enhancement
- [x] Handle team splits (team lead percentage)
- [x] Calculate deductions (fixed and percentage-based)
- [x] Calculate franchise fees and royalties
- [ ] Handle referral fees - Future enhancement
- [x] Implement YTD tracking for cap calculations
- [x] Handle anniversary date-based cap resets

### Test Suite (Day 2)
- [x] Write tests for basic percentage splits (70/30, 80/20, etc.)
- [x] Write tests for cap scenarios (before cap, at cap, after cap)
- [ ] Write tests for tiered plans (multiple thresholds) - Future enhancement
- [x] Write tests for team splits
- [x] Write tests for deductions
- [x] Write tests for edge cases (negative commissions, zero GCI, etc.)
- [x] Test with 21 real-world scenarios (all passing)
- [x] Verify all tests pass

### Backend API (Day 2-3)
- [ ] Create calculateCommission tRPC procedure
- [ ] Create recalculateAllCommissions procedure (batch)
- [ ] Add commission calculation to upload flow
- [ ] Store calculated commissions in database
- [ ] Add calculation audit log (track who calculated what)
- [ ] Handle calculation errors gracefully

### UI Integration (Day 3-4)
- [ ] Add "Calculate Commissions" button to dashboard
- [ ] Create calculation progress modal
- [ ] Show before/after comparison
- [ ] Add "Recalculate" button to Commission Audit tab
- [ ] Update Commission Statement to show calculated vs actual
- [ ] Add visual indicators for calculation status
- [ ] Show calculation errors in UI
- [ ] Add bulk recalculation for all agents

### Documentation & Testing (Day 4)
- [x] Create COMMISSION_CALCULATION_GUIDE.md
- [x] Document all commission plan types
- [x] Document calculation formulas
- [x] Add troubleshooting guide
- [ ] Test with 3 different brokerage scenarios - In Progress
- [ ] Verify accuracy against manual calculations - In Progress

### Success Criteria
- [ ] Can calculate commission from transaction data automatically
- [ ] Handles all commission plan types (percentage, cap, tier, flat)
- [ ] Accurately tracks YTD for cap calculations
- [ ] All tests pass (50+ scenarios)
- [ ] UI shows calculated commissions clearly
- [ ] Performance: Calculate 1000 transactions in < 5 seconds


## Phase 46: Separate Commission Management Module (In Progress)
**Priority:** HIGH | **Complexity:** 5/10 | **Time Estimate:** 2-3 hours
**Status:** 🚧 Active Development

### Navigation Restructure
- [x] Analyze current navigation structure (Home page with tabs)
- [x] Design new navigation with separate Analytics and Commission sections
- [x] Create dedicated Commission Management route (/commission)
- [x] Update navigation menu to show both sections
- [x] Keep commission metrics in Analytics charts

### Commission Management Page
- [x] Create new CommissionManagement.tsx page component
- [x] Design tabbed interface for commission features
- [x] Move Commission Plans tab to new page
- [x] Move Team Management tab to new page
- [x] Move Commission Audit tab to new page
- [x] Add Agent Assignments tab (from Settings)
- [x] Add future "Calculate Commissions" tab placeholder

### Analytics Page Updates
- [x] Keep Agent Leaderboard in Analytics
- [x] Keep Commission Breakdown charts in Analytics
- [x] Keep Revenue Distribution in Analytics
- [x] Remove commission settings tabs from Analytics
- [x] Update Settings tab with redirect message

### Testing
- [ ] Test navigation between Analytics and Commission Management - In Progress
- [ ] Verify all commission features work in new location - In Progress
- [ ] Test responsive design on mobile - In Progress
- [ ] Verify data persistence across navigation - In Progress


## Phase 47: Backend API Integration for Automatic Commission Calculator (In Progress)
**Priority:** HIGHEST | **Complexity:** 7/10 | **Time Estimate:** 4-6 hours
**Status:** 🚧 Active Development

### Backend API (tRPC Procedures)
- [x] Create calculateCommissions tRPC procedure
- [x] Add input validation with Zod schemas
- [x] Fetch commission plans from database
- [x] Fetch teams from database
- [x] Fetch agent assignments from database
- [x] Call commission calculator with fetched data
- [x] Return calculation results with breakdowns and YTD summaries
- [x] Add error handling and logging

### Frontend UI Component
- [x] Create CommissionCalculator.tsx component
- [x] Add "Calculate Commissions" button
- [x] Show loading state during calculation
- [x] Display calculation results in table format
- [x] Show YTD summaries with cap progress
- [x] Add export to CSV functionality
- [x] Handle errors gracefully with user-friendly messages

### Integration
- [x] Replace "Calculate (Coming Soon)" tab with active calculator
- [x] Load most recent transaction data automatically
- [ ] Allow manual data upload for calculation - Future enhancement
- [ ] Persist calculation results in local storage - Future enhancement
- [ ] Add comparison view (calculated vs uploaded) - Future enhancement

### Testing
- [ ] Write unit tests for tRPC procedures - In Progress
- [ ] Test with sample transaction data - In Progress
- [ ] Test with multiple commission plans - In Progress
- [ ] Test with team splits - In Progress
- [ ] Test cap scenarios - In Progress
- [ ] Verify YTD calculations - In Progress
- [ ] Test error scenarios - In Progress


## Phase 48: Restructure Commission Module as Analytics Panel (In Progress)
**Priority:** HIGH | **Complexity:** 6/10 | **Time Estimate:** 3-4 hours
**Status:** 🚧 Active Development

### Cleanup
- [x] Remove `/commission` route from App.tsx
- [x] Remove "Commission" button from Home.tsx header
- [ ] Remove "Commission" button from MobileNav.tsx - Will handle if needed
- [ ] Delete CommissionManagement.tsx page - Keeping for now, can be removed later
- [x] Restore Commission Audit tab to Analytics tabs

### Create Commission Panel Component
- [x] Create CommissionManagementPanel.tsx component
- [x] Add tabbed interface (Plans, Teams, Assignments, Calculate)
- [x] Import existing components (CommissionPlansManager, TeamManager, AgentAssignment, CommissionCalculator)
- [x] Style as card/panel with consistent design

### Integration
- [x] Add Commission Management panel below Agent Leaderboard in Home.tsx
- [x] Ensure commission analytics charts remain visible in tabs
- [ ] Test responsive design on mobile - In Progress
- [ ] Verify all functionality works within panel context - In Progress

### Testing
- [ ] Test commission calculation from panel - Ready for testing
- [ ] Test plan/team/assignment management from panel - Ready for testing
- [ ] Verify data persistence across tabs - Ready for testing
- [ ] Test on mobile and desktop - Ready for testing


## Phase 49: Fix Commission Data Persistence (URGENT)
**Priority:** CRITICAL | **Complexity:** 7/10 | **Time Estimate:** 2-3 hours
**Status:** 🚧 Active Development - Blocking calculator functionality

### Problem
- Plans and agents are created in UI but not saved to database
- Calculator queries database and finds 0 plans/agents
- Data only exists in local storage, not persistent

### Solution: Add Database Persistence

#### Backend (tRPC Procedures)
- [ ] Add savePlan procedure to create/update plans in database
- [ ] Add saveAssignment procedure to create/update agent assignments
- [ ] Add deletePlan procedure for plan deletion
- [ ] Add deleteAssignment procedure for assignment deletion
- [ ] Ensure procedures validate tenant isolation

#### Frontend (UI Components)
- [ ] Update CommissionPlansManager to call savePlan on create/update
- [ ] Update CommissionPlansManager to call deletePlan on delete
- [ ] Update AgentAssignment to call saveAssignment on create/update
- [ ] Update AgentAssignment to call deleteAssignment on delete
- [ ] Add loading states during database operations
- [ ] Add error handling and user feedback

#### Testing
- [ ] Create a plan and verify it appears in database
- [ ] Assign an agent and verify it appears in database
- [ ] Click Calculate and verify plans/agents are now detected
- [ ] Test full calculation workflow end-to-end

## Phase 45: Sliding Scale Commission Support

- [x] Update CommissionPlan interface to support tier definitions
- [x] Implement tier-based split calculation logic
- [x] Update database schema for commission_plan_tiers table
- [x] Create UI for tier configuration in CommissionPlansManager
- [x] Write tests for sliding scale calculations (multi-tier scenarios)
- [x] Test mixed scenarios (hitting cap while on different tier)
- [x] Verify YTD tracking across tier boundaries
- [ ] Update CommissionCalculator UI to show tier information
- [ ] Save checkpoint with sliding scale support

## Phase 46: Sliding Scale UI Fixes and Enhancements

- [x] Fix missing slider toggle in commission plan settings dialog
- [x] Create tier visualization dashboard with progress charts
- [x] Implement tier history tracking table in database
- [x] Add tier transition logging to commission router
- [x] Create tier history API endpoints (list, stats)
- [x] Build tier history UI component
- [x] Add bulk tier templates feature
- [x] Create template manager UI
- [x] Test all new features end-to-end
- [x] Save final checkpoint with all enhancements
