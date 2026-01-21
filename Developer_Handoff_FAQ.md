# Developer Handoff & Technical FAQ
**Prepared for Technical Review Meeting**

## 1. Technology Stack & Architecture

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

## 2. Data Handling & Security

**Q: How are we handling PII (Personally Identifiable Information)?**
**A:**
*   **Current State (CSV):** Data is processed entirely in the browser's memory. No data is uploaded to any server. It persists only in the user's local IndexedDB for "Recent Uploads" functionality, which stays on their device.
*   **Future State (API):** We will use OAuth 2.0. We will store `access_tokens` and `refresh_tokens` in an encrypted database table. We will NOT store user passwords.

**Q: How do we handle Dotloop API Rate Limits?**
**A:** This is a critical consideration. Dotloop's API has strict rate limits (typically ~50 requests/minute).
*   **Strategy:** We implement a "Sync & Cache" architecture.
    *   We do **not** hit the Dotloop API every time a user loads a dashboard.
    *   Instead, a background worker (Cron Job) runs nightly to fetch new transactions and update our local SQL database.
    *   The dashboard reads from *our* database (fast, no limits), not Dotloop's API directly.

---

## 3. The "Gotchas" (Anticipating Problems)

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

## 4. Deployment & DevOps

**Q: How do we deploy this?**
**A:**
*   **Frontend:** It's a static site. It can be deployed to Vercel, Netlify, AWS S3+CloudFront, or any standard web host.
*   **Backend (Future):** When we add the API, we will need a Node.js server (Express or NestJS) and a PostgreSQL database. This can be hosted on Heroku, Railway, or AWS ECS.

**Q: Is it testable?**
**A:** Yes.
*   **Unit Tests:** We can use Vitest (compatible with Vite) to test the data parsing logic.
*   **Type Safety:** The entire codebase is strictly typed with TypeScript, preventing an entire class of "undefined is not a function" runtime errors.

---

## 5. Summary for the Dev Team

"This is not a 'black box' low-code tool. It is a standard, clean React codebase written in TypeScript. It follows best practices like Component Composition and Separation of Concerns. You will find it familiar and easy to extend."
