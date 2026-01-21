# Security Briefing: Dotloop Reporting Tool
**Prepared for Executive Leadership Review**

## Executive Summary
This document addresses the security architecture of the proposed Dotloop Reporting Tool. The system is designed with a "Zero-Trust" philosophy regarding user credentials and leverages industry-standard OAuth 2.0 protocols to ensure data integrity. **Crucially, the application never stores, processes, or transmits Dotloop passwords.**

---

## 1. Credential Management (The "Keys to the Kingdom")

**Concern:** "Will this app store our agents' Dotloop passwords? What if it gets hacked?"

**Response:** **No.** The application utilizes **OAuth 2.0**, the same security standard used by Google, Microsoft, and Salesforce.

*   **How it works:** When a user connects their account, they are redirected to `dotloop.com` to log in. Dotloop then issues a secure "Access Token" to our application.
*   **The Benefit:** Our database **never** contains a password. If our database were compromised, an attacker would only find random string tokens (e.g., `xy7-99a...`), which cannot be used to log in to Dotloop directly and can be instantly revoked by the brokerage admin at any time.

## 2. Data Isolation & Privacy

**Concern:** "Is our financial data mixed with other brokerages? Who can see it?"

**Response:** The architecture enforces strict **Tenant Isolation**.

*   **Row-Level Security:** Every transaction record in the database is tagged with a unique `Brokerage_ID`. The application code includes a strict "Where Clause" (e.g., `WHERE brokerage_id = X`) on every single database query.
*   **Result:** It is physically impossible for Brokerage A to query Brokerage B's data, even if they try to manipulate the URL.
*   **Encryption:** All data is encrypted **in transit** (via HTTPS/TLS 1.2+) and **at rest** (in the database storage volume).

## 3. Compliance & Control

**Concern:** "Do we lose control of our data?"

**Response:** The brokerage retains full ownership and control.

| Feature | Benefit |
| :--- | :--- |
| **Instant Revocation** | The Brokerage Admin can disconnect the app from Dotloop settings instantly, cutting off all access immediately. |
| **Read-Only Access** | The application requests **Read-Only** permissions. It cannot delete loops, change commission splits, or modify contracts inside Dotloop. It can only *view* data to generate reports. |
| **Audit Logs** | Every login and data export event is logged, providing a clear trail of who accessed what data and when. |

## 4. Vendor Risk Assessment (The "Build vs. Buy" Security Argument)

**Concern:** "Why build this instead of buying an off-the-shelf tool?"

**Response:** Building this internally actually **reduces** our third-party risk surface.

*   **Data Sovereignty:** By hosting this ourselves (or on our controlled cloud), we are not sending our sensitive commission data to a third-party SaaS vendor who might sell aggregated market data.
*   **Minimal Footprint:** Off-the-shelf tools often require broad permissions to "manage your business." Our tool requests the *minimum viable permission* needed strictly for reporting.

## Conclusion
The Dotloop Reporting Tool is architected to exceed standard real estate data security requirements. By eliminating password storage, enforcing read-only access, and maintaining strict data isolation, we deliver powerful insights without compromising the integrity of the brokerage's sensitive financial data.
