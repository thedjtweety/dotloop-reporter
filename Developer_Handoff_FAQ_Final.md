# Developer Handoff & Technical FAQ (Final)
**Prepared for Technical Review Meeting**

## 1. Technology Stack & Architecture (Current State)

**Q: What is this built with?**
**A:** The application is a modern Single Page Application (SPA) built on the React ecosystem.
*   **Frontend:** React 19 (TypeScript) + Vite (Build Tool)
*   **Styling:** Tailwind CSS v4 (Utility-first CSS) + shadcn/ui (Component Library)
*   **State Management:** React Context API (for global state like Theme and Data)
*   **Charts:** Recharts (D3-based wrapper for React)
*   **PDF Generation:** jsPDF + html2canvas (Client-side generation)

**Q: Why client-side PDF generation?**
**A:** To reduce server load and complexity. By rendering the PDF in the browser, we avoid the need for a dedicated PDF microservice or headless browser (like Puppeteer) on the backend, keeping the infrastructure lightweight and cost-effective.

---

## 2. Phase 2: Full-Stack Technical Specifications (Future State)

This section details the architecture required to support the Dotloop API integration.

### A. Database Schema (PostgreSQL)

We propose a relational schema to handle multi-tenant data securely.

**Table: `users`**
*   `id` (UUID, PK)
*   `email` (VARCHAR, Unique)
*   `role` (ENUM: 'admin', 'agent')
*   `brokerage_id` (UUID, FK)

**Table: `integrations`**
*   `id` (UUID, PK)
*   `user_id` (UUID, FK)
*   `provider` (VARCHAR: 'dotloop')
*   `access_token` (TEXT, Encrypted)
*   `refresh_token` (TEXT, Encrypted)
*   `expires_at` (TIMESTAMP)

**Table: `transactions`**
*   `id` (UUID, PK)
*   `brokerage_id` (UUID, FK) - *Critical for Tenant Isolation*
*   `external_id` (VARCHAR) - *Dotloop Loop ID*
*   `status` (VARCHAR)
*   `price` (DECIMAL)
*   `commission_total` (DECIMAL)
*   `closing_date` (DATE)
*   `raw_data` (JSONB) - *Stores the full API response for future-proofing*

### B. Background Job Architecture (The "Sync Engine")

To handle Dotloop's rate limits (~50 req/min), we cannot fetch data synchronously when the user loads the page. We must use an asynchronous queue.

**Recommended Stack:**
*   **Queue:** Redis (BullMQ or similar)
*   **Worker:** Node.js dedicated worker process

**The Sync Workflow:**
1.  **Trigger:** Cron job runs at 3:00 AM (local time).
2.  **Job Creation:** System queries `integrations` table and pushes a `sync_brokerage_data` job to the Redis queue for each active token.
3.  **Execution:**
    *   Worker picks up the job.
    *   Checks if `access_token` is expired. If yes, uses `refresh_token` to get a new one.
    *   Calls Dotloop API (`GET /loops`) with pagination.
    *   **Rate Limiting:** The worker enforces a strict 500ms delay between calls to respect the API limit.
    *   **Upsert:** Saves/Updates records in the `transactions` table.
4.  **Completion:** Updates the `last_synced_at` timestamp for the user.

---

## 3. Phase 3: Dotloop Partner Integration (The "App Store" Path)

**Q: Can we host this on Dotloop's site?**
**A:** Not directly. Dotloop uses an **App Directory** model. We host the application, and Dotloop "frames" it or links to it.

### A. The "SSO" Requirement (Single Sign-On)
To be a premier partner, we must support **"Sign in with Dotloop"**.
*   **Flow:** User clicks "Open Reporting Tool" inside Dotloop.
*   **Mechanism:** Dotloop sends a `code` to our callback URL.
*   **Action:** We exchange that code for an access token AND automatically create/log in the user in our system. This removes the need for a separate registration step.

### B. UI/UX Requirements for Partners
Dotloop requires partner apps to look and feel consistent.
*   **Branding:** We must use their official color palette (Dodger Blue #1E90FF) - *Already Implemented*.
*   **Navigation:** We should provide a "Back to Dotloop" button in the header.
*   **Deep Linking:** Our "View in Dotloop" links (already built) are a key requirement. They want seamless navigation between the report and the source loop.

### C. Security Review
Before listing us, Dotloop will audit our app. They will check:
*   **Token Storage:** Are we encrypting tokens? (Yes, see Section 2A).
*   **Scope Minimization:** Are we asking for `loop:write` permission if we only need `loop:read`? (We must strictly request only `READ` scopes).

---

## 4. Data Handling & Security

**Q: How are we handling PII (Personally Identifiable Information)?**
**A:**
*   **Current State (CSV):** Data is processed entirely in the browser's memory. No data is uploaded to any server. It persists only in the user's local IndexedDB for "Recent Uploads" functionality, which stays on their device.
*   **Future State (API):** We will use OAuth 2.0. We will store `access_tokens` and `refresh_tokens` in an encrypted database table. We will NOT store user passwords.

**Q: How do we handle Dotloop API Rate Limits?**
**A:** This is a critical consideration. Dotloop's API has strict rate limits.
*   **Strategy:** We implement a "Sync & Cache" architecture (detailed in Section 2B above). The dashboard reads from *our* database (fast, no limits), not Dotloop's API directly.

---

## 5. The "Gotchas" (Anticipating Problems)

**Q: What happens when the Dotloop API changes?**
**A:** This is a valid risk. We mitigate this by using a **Adapter Pattern** in our code.
*   We have a `DotloopRecord` interface (TypeScript) that defines the shape of data *our app needs*.
*   We have a `Mapper` function that translates external data (CSV or API) into this internal format.
*   If Dotloop changes their API response, we only need to update the `Mapper` function in one place, and the rest of the app (Charts, Tables) remains untouched.

**Q: How do we handle "Dirty Data" from agents?**
**A:** Agents are notorious for entering data incorrectly (e.g., typing "$1,000" instead of "1000" or leaving dates blank).
*   **Solution:** We have built a robust `DataCleaningService` (currently in `csvParser.ts`). It uses heuristic logic to:
    *   Strip currency symbols and commas.
    *   Parse various date formats (MM/DD/YYYY, YYYY-MM-DD).
    *   Flag "Unhealthy" records (missing Price or Status) and display them in a dedicated "Data Health Check" tab for the admin to fix.

---

## 6. Deployment & DevOps

**Q: How do we deploy this?**
**A:**
*   **Frontend:** It's a static site. It can be deployed to Vercel, Netlify, AWS S3+CloudFront, or any standard web host.
*   **Backend (Future):** When we add the API, we will need a Node.js server (Express or NestJS) and a PostgreSQL database. This can be hosted on Heroku, Railway, or AWS ECS.

**Q: Is it testable?**
**A:** Yes.
*   **Unit Tests:** We can use Vitest (compatible with Vite) to test the data parsing logic.
*   **Type Safety:** The entire codebase is strictly typed with TypeScript, preventing an entire class of "undefined is not a function" runtime errors.

---

## 7. Summary for the Dev Team

"This is not a 'black box' low-code tool. It is a standard, clean React codebase written in TypeScript. It follows best practices like Component Composition and Separation of Concerns. The full-stack transition plan includes a robust queuing system to handle API limits, a secure database schema for token management, and is architected to meet Dotloop's Partner Integration standards for SSO and UI consistency."
