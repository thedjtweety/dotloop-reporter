# Engineering Proposal: Dotloop Reporting Microservice
**To:** Engineering Management
**From:** Business Consulting Team
**Subject:** Technical Proposal for "Dotloop Reporter" Value-Add Service

## 1. Initiative Overview
We propose the development of a lightweight, standalone microservice designed to provide advanced financial analytics and agent performance reporting to our brokerage clients. This service will consume our existing public API, requiring **zero changes** to the core Dotloop monolith.

## 2. Architecture: The "Sidecar" Approach

**Philosophy:** Decoupled Innovation.
We avoid modifying the core codebase to minimize regression risk and deployment complexity. Instead, we build this as a "Sidecar" application that interacts with the core platform strictly via public interfaces.

### Stack Selection
*   **Frontend:** React 19 + TypeScript (Aligned with modern frontend standards).
*   **Backend:** Node.js (Lightweight, event-driven, ideal for I/O heavy API syncing).
*   **Database:** PostgreSQL (Relational data model for structured financial reporting).
*   **Queue:** Redis (For asynchronous data synchronization).

### Why this stack?
This stack allows for rapid iteration independent of the core platform's release cycle. It can be maintained by a small "Tiger Team" or handed off to the Integrations Squad without burdening the Core Product teams.

## 3. Integration Strategy (Internal API Consumption)

**The Challenge:** Rate Limits & Load.
**The Solution:** "Sync & Cache" Pattern.

Instead of proxying live requests (which would add latency and load to the core API), this service maintains a **Read-Only Replica** of relevant transaction data.

1.  **Asynchronous Sync:** A background worker syncs data during off-peak hours (e.g., 3:00 AM local time).
2.  **Rate Limit Respect:** The worker strictly adheres to the standard public rate limits (~50 req/min), ensuring this internal tool acts as a "good citizen" and does not degrade performance for other API consumers.
3.  **Data Freshness:** The dashboard serves data from its local PostgreSQL cache, providing instant load times for complex aggregations (e.g., "Year-to-Date GCI by Agent") that would be computationally expensive to query live from the core.

## 4. Future-Proofing & Extensibility

**JSONB "Raw Data" Storage:**
To ensure we can support future reporting requirements without constant schema migrations, we will store the full JSON response from the `GET /loops` endpoint in a `jsonb` column. This allows us to "replay" historical data to extract new fields (e.g., "Referral Source") as product requirements evolve.

## 5. Deployment Model

We recommend deploying this service as a containerized application within our existing Kubernetes cluster (or separate VPC), managed via our standard CI/CD pipeline. This ensures it benefits from our existing monitoring, logging, and security infrastructure while remaining logically distinct from the core application.

## 6. Summary
This proposal offers a low-risk, high-reward path to delivering requested reporting features. By treating our own API as the integration point, we decouple the reporting logic from the core transaction engine, allowing us to move fast without breaking things.
