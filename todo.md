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
