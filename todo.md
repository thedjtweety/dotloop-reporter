# Dotloop Reporter - Full-Stack Upgrade TODO

## Phase 1: Full-Stack Foundation
- [x] Resolve Home.tsx merge conflicts
- [x] Implement database schema for CSV uploads
- [x] Add persistent CSV storage (backend complete)
- [x] Update frontend to use new upload API
- [ ] Create upload history UI component
- [ ] Test authentication flow with real uploads

## Phase 2: Dotloop API Integration (Future)
- [ ] Create Dotloop OAuth integration table (schema exists)
- [ ] Add "Connect Dotloop" button
- [ ] Implement mock API for testing
- [ ] Add API sync worker
- [ ] Create admin dashboard for connection management

## Phase 3: Multi-Tenant Architecture
- [ ] Add brokerage_id to all relevant tables
- [ ] Implement tenant isolation in queries
- [ ] Create brokerage management interface
- [ ] Test data isolation between brokerages
