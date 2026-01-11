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
