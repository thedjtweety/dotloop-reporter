# Product Requirement Document (PRD): Dotloop Reporting Module
**Status:** Draft Proposal
**Owner:** Business Consulting Team
**Target Audience:** Brokerage Admins & Team Leads

## 1. Problem Statement
Our current brokerage clients struggle to extract aggregated financial insights from Dotloop. While we excel at transaction management, our native reporting capabilities often require users to export CSVs and manipulate data in Excel manually. This friction leads to:
1.  **Churn Risk:** Clients seeking "all-in-one" platforms that offer better analytics.
2.  **Support Burden:** Increased tickets asking for custom reports.
3.  **Missed Value:** Clients underutilizing the data they already store with us.

## 2. Proposed Solution
Develop a "Dotloop Reporting Module" – a specialized, value-add dashboard that visualizes agent performance, commission splits, and pipeline health. This module will be offered as a premium feature or retention tool for high-value brokerage accounts.

## 3. Key Features (MVP)

### A. The "Broker Dashboard"
*   **Visual Pipeline:** Kanban-style view of active deals (Active -> Under Contract -> Closed).
*   **Financial Health:** Real-time GCI (Gross Commission Income) tracking vs. Goals.
*   **Agent Leaderboard:** Gamified ranking of top performers based on Volume and Units.

### B. The "Admin Control Center"
*   **Commission Plan Manager:** Ability to define split templates (e.g., "80/20 Split") and assign them to agents.
*   **Sync Management:** Visibility into the data synchronization status (e.g., "Last synced: 2 hours ago").
*   **User Access Control:** Simple role-based access (Admin vs. Viewer) managed via our existing SSO.

## 4. Technical Requirements (Internal)

### A. Integration Points
*   **SSO:** Must utilize "Sign in with Dotloop" to ensure a seamless, single-click entry from the main product.
*   **API Usage:** Must strictly use the public V2 API endpoints. No direct database access to the core monolith is permitted.

### B. Security & Compliance
*   **Scope:** `READ-ONLY` access by default.
*   **Data Residency:** All cached reporting data must be stored within our approved cloud regions (US-East-1).

## 5. Success Metrics (KPIs)
*   **Adoption:** % of eligible brokerages activating the module within 90 days.
*   **Retention:** Reduction in churn rate among brokerages using the module vs. control group.
*   **Engagement:** Average Weekly Active Users (WAU) per brokerage.

## 6. Go-to-Market Strategy
*   **Phase 1 (Alpha):** Roll out to 5 friendly "Design Partner" brokerages for feedback.
*   **Phase 2 (Beta):** Enable for all "Business Consultant" managed accounts.
*   **Phase 3 (GA):** General availability in the App Directory.

## 7. Resource Request
We are requesting approval to proceed with the "Sidecar" architecture (see Engineering Proposal), utilizing a small cross-functional team (1 Backend, 1 Frontend) to bring this MVP to market in Q3.
