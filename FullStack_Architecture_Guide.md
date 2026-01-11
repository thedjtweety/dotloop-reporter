# Full-Stack Architecture Guide: Authentication & Dotloop Integration

This guide details the technical architecture for upgrading the Dotloop Reporting Tool to a full-stack application. It specifically addresses how user access (Login Portal) and data access (Dotloop API) are managed securely and independently.

## 1. The Two Layers of Security

In a professional SaaS (Software as a Service) application, there are two distinct "keys" involved. It is critical to understand that these are separate systems:

1.  **Application Access (The Front Door):** Verifying *who the user is* so they can log in to your dashboard.
2.  **Data Access (The Data Pipe):** Getting permission to *read Dotloop data* on behalf of that user.

---

## 2. Layer 1: The Login Portal (Application Access)

When we upgrade to a full-stack project, we don't need to build a login system from scratch. We utilize **Manus OAuth**, which provides a production-grade authentication system out of the box.

### How it works:
*   **The Portal:** When a user visits your site, they are greeted with a secure login screen.
*   **Methods:** Users can sign up via Email/Password or Social Login (Google, GitHub, etc.).
*   **Session Management:** Once logged in, the system issues a secure "Session Token" to the user's browser. This keeps them logged in for days without re-entering passwords.
*   **User Database:** A `Users` table is automatically created in your database. It stores:
    *   User ID (Unique)
    *   Email
    *   Name
    *   *Crucially: It does NOT store the Dotloop password.*

### Is there an Admin Dashboard?
**Yes.**
*   **Built-in:** The Manus Management UI provides a "Database" tab where you (the developer/owner) can see every registered user, manually reset passwords, or ban users if necessary.
*   **Custom:** We can easily build a "Super Admin" page within the app itself. This would allow you to see a list of all brokerage clients, their subscription status, and their last login date, without needing to touch the raw database.

---

## 3. Layer 2: Dotloop Integration (Data Access)

This is the most important part for an "Expert" understanding. We do **not** ask the user for their Dotloop username and password, nor do we ask them to copy-paste a long "API Token."

We use **OAuth 2.0**, the industry standard for secure authorization (used by Google, Facebook, etc.).

### The "Handshake" Process (OAuth 2.0 Flow):

1.  **The Trigger:** Inside your dashboard, the user clicks a button: **"Connect Dotloop Account"**.
2.  **The Redirect:** Your app redirects the user *away* to `dotloop.com`.
3.  **The Approval:** The user sees a Dotloop-branded page: *"Dotloop Reporting Tool wants to access your transactions. Allow?"*
4.  **The Handoff:** If they click "Allow," Dotloop sends them back to your app with a temporary code.
5.  **The Exchange:** Your backend server secretly takes that code and swaps it with Dotloop's server for two keys:
    *   **Access Token:** A short-lived key (valid for ~2 hours) used to fetch data.
    *   **Refresh Token:** A long-lived key (valid for months) kept in your secure vault.

### Why is this "Expert Level"?
*   **Security:** You never touch the user's Dotloop password. If your database were ever compromised, hackers would only get tokens that can be revoked, not the user's actual credentials.
*   **Persistence:** The **Refresh Token** is the magic component. It allows your server to wake up at 3:00 AM, use the Refresh Token to get a new Access Token, and sync the latest data *while the user is asleep*. This enables "Daily Morning Email Reports" without the user needing to log in.

---

## 4. How It All Connects (The Database Model)

In the full-stack database, we link these two layers together. Here is a simplified view of the data structure:

### Table: `Users` (The Humans)
| ID | Email | Name | Role |
| :--- | :--- | :--- | :--- |
| 101 | broker@agency.com | John Doe | Admin |

### Table: `Integrations` (The Keys)
| ID | User_ID | Provider | Access_Token | Refresh_Token | Expires_At |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 55 | 101 | dotloop | `ey...` (Encrypted) | `rt...` (Encrypted) | 2025-01-12 14:00 |

**The Workflow:**
1.  John logs in (Layer 1).
2.  He views the dashboard.
3.  The dashboard asks the backend for data.
4.  The backend looks up John's ID (101) in the `Integrations` table.
5.  It finds the Dotloop token.
6.  It calls Dotloop's API using that token to get the live transaction data.

## Summary

*   **Login Portal:** Managed by Manus Auth (secure, built-in).
*   **Admin Dashboard:** Available via Manus UI (raw data) or custom-built (user management).
*   **Dotloop Auth:** Managed via OAuth 2.0 (secure token exchange, no passwords).
