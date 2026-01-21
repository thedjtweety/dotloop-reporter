# Full-Stack Implementation & Admin Dashboard Guide
**Technical Specification & Operational Manual**

## Part 1: Prerequisites for Dotloop API Integration

Before writing a single line of backend code, the following assets must be secured from Dotloop. This is the "Key Chain" your developers need to unlock the integration.

### 1. The Developer Account
*   **Requirement:** You must apply for a Dotloop Developer Account at `developer.dotloop.com`.
*   **Deliverable:** A sandbox environment where we can test without affecting real financial data.

### 2. The Application Registration
Once the developer account is active, you must register a new "App" in their portal.
*   **App Name:** "Dotloop Reporting Tool" (or your brokerage's branded name).
*   **Redirect URI:** This is critical. It tells Dotloop where to send the user after they log in.
    *   *Dev:* `http://localhost:3000/api/auth/callback/dotloop`
    *   *Prod:* `https://your-app-domain.com/api/auth/callback/dotloop`
*   **Scopes (Permissions):** We must request the *minimum* necessary scopes to pass security review:
    *   `account:read` (To identify the agent)
    *   `loop:read` (To fetch transaction details)
    *   `contact:read` (To see client names)
    *   **CRITICAL:** Do NOT request `loop:write` or `document:write` unless absolutely necessary. Requesting "Write" access triggers a much stricter security audit.

### 3. The Client Credentials
Dotloop will generate two keys for you. **These must be stored in a password manager immediately.**
*   `Client ID`: Public identifier (safe to share in emails).
*   `Client Secret`: The master key (NEVER share in email/Slack).

---

## Part 2: The Admin Dashboard Architecture

The "Admin Dashboard" is the control center for your brokerage's operations team. It is a secure, role-protected section of the application.

### 1. Core Functionality (The "What")

| Feature | Description | Technical Implementation |
| :--- | :--- | :--- |
| **User Management** | View all registered agents. Disable access for terminated agents. | `UPDATE users SET is_active = false WHERE id = ?` |
| **Sync Status** | See when the last data sync occurred. Manually trigger a sync. | Displays `last_synced_at` timestamp. Button triggers Redis job. |
| **Commission Plans** | Assign commission splits (e.g., "80/20") to specific agents. | CRUD interface for `commission_plans` table. |
| **Audit Logs** | See who exported reports and when. | Read-only view of `audit_logs` table. |

### 2. The "Super Admin" vs. "Broker Admin" (The "Who")

We recommend a two-tier permission system:
*   **Super Admin (Dev Team):** Has access to system health, API rate limit metrics, and raw database tables. Can configure global settings.
*   **Broker Admin (You/Managers):** Can manage agents, commission plans, and view reports. Cannot touch system configuration.

---

## Part 3: Transfer & Management (The "How")

**Q: How do we transfer this to our internal Dev Team?**
**A:** The transition is designed to be seamless because the project uses standard, open-source technologies.

### 1. Source Code Handoff
*   **Repository:** The entire codebase (Frontend + Backend) lives in a single Git repository.
*   **Environment Variables:** We provide a `.env.example` file listing all required keys (Database URL, Dotloop Client ID, etc.). Your team simply fills in their values.

### 2. Infrastructure Ownership
*   **Database:** You own the PostgreSQL instance. You can host it on AWS RDS, Google Cloud SQL, or Azure.
*   **Hosting:** You own the deployment pipeline. We recommend a CI/CD pipeline (GitHub Actions) that automatically deploys to your cloud provider whenever your team pushes code.

### 3. The "Keys" Handover
To fully transfer control, you simply rotate the secrets:
1.  Generate a new `Client Secret` in the Dotloop Developer Portal.
2.  Update the production environment variable.
3.  This ensures that *only* your current team has access, locking out any previous developers (including us).

---

## Summary Checklist for Dev Team

1.  [ ] **Apply** for Dotloop Developer Account.
2.  [ ] **Register** the App and get `Client ID` / `Client Secret`.
3.  [ ] **Define** the `Redirect URI` for production.
4.  [ ] **Provision** a PostgreSQL database and Redis instance.
5.  [ ] **Deploy** the code to your corporate cloud account.
