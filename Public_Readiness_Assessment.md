# Dotloop Reporter: Public-Readiness Assessment and DotView Roadmap

**Prepared by Manus AI**  
**Assessment date:** August 13, 2026

## Executive assessment

The product has become a **strong broker-facing prototype and a credible controlled-pilot product**. Its differentiated workflow is now tangible: a broker can import a report, inspect pipeline and financial analytics, establish commission plans, apply those plans to agents, calculate results, and issue revocable agent-specific views. The recent work on data-quality feedback, commission persistence, plan-card assignment counts, and scoped sharing materially improves usability.

My candid view is that it is **not ready for an unrestricted, multi-broker public launch yet**. The central blocker is not visual polish or another chart; it is the platform boundary. The current public implementation uses a shared public tenant for persisted commission plans and assignments. That is appropriate for a demonstration or a single managed brokerage environment, but not for independently onboarded brokerages. Before multiple brokerages can safely self-serve, each brokerage needs a separate workspace, authenticated administrators, explicit user roles, and hard server-side tenant scoping.

> **Recommendation:** Treat the product as a **DotView companion pilot** now. Keep CSV as the primary import method, launch first with a small number of named brokerages, and build the tenancy, data-governance, and onboarding layer before inviting unrestricted public sign-ups.

| Area | Current assessment | Launch implication |
|---|---|---|
| CSV dashboard and analytics | Strong for a pilot; the data-quality layer makes incomplete exports understandable rather than silently misleading. | Continue improving. |
| Commission plans and assignments | Core workflow is functional and now tied to live recalculation. | Add plan versioning and period controls before production payroll reliance. |
| Agent sharing | The token-scoped portal, expiry, and revocation model is a strong foundation. | Add brokerage identity, email verification, and audit trails before broad distribution. |
| Multi-broker privacy | Not sufficient in the current shared public-tenant architecture. | This is the highest-priority production gap. |
| Direct Dotloop import | Feasible only through an approved route. | Keep CSV first; pursue a sanctioned OAuth/API path separately. |

## Why CSV should be the first-class import path

For the next product stage, **CSV is the right default**. It is simple for brokers, requires no credential handling by DotView, works with the reporting process they already know, and gives the brokerage a deliberate review step before sensitive transaction data enters the analytics workspace. Dotloop’s Broker Report Builder is designed to produce CSV reports from loop details for Business+ or Teams accounts, with configurable status and date filters; it also requires the broker to be in an administrator profile.[1]

That directly supports a low-friction operating model: the broker runs a saved Dotloop report, downloads the file, drops it into DotView, sees an import quality summary, and confirms the reporting period. It is familiar, controllable, and considerably easier to support than a live integration during early rollout.

The important product improvement is not replacing CSV; it is making it feel nearly effortless. The upload experience should become a named **Import Run** rather than a one-off file drop. Each run should retain its reporting period, source filename, record count, mapping version, data-quality score, and import timestamp. The broker should be able to repeat the same mapping in one click and compare the latest import against the prior period.

| Import option | Product value | Operational risk | Recommendation |
|---|---|---|---|
| **Guided CSV import** | Fastest path, broker-controlled scope, no external credentials stored. | Manual download/upload step; export fields can vary. | **Build now and make excellent.** |
| **Approved Dotloop OAuth/API connection** | Lowest friction after setup; can support incremental refresh. | Requires registration, approval, consent, secure token handling, and strict license compliance. | **Plan as phase two.** |
| **Browser extension that reads the logged-in site** | Appears convenient, but creates support, security, and policy risk. | Fragile UI automation, permission risk, potential platform-policy conflict, and higher privacy burden. | **Do not make this the primary path.** |

## Direct Dotloop connection: pursue approval, not scraping

Dotloop publicly documents an OAuth 2.0 API with per-user consent, access-token refresh, profile access, and loop retrieval. Its developer materials state that an application must request access and receive a client ID and client secret before integration.[2] [3] This creates a legitimate future route for a **Connect Dotloop** experience, but it should be treated as a business, legal, and engineering workstream—not as a quick switch in the interface.

The API license is especially relevant for a product positioned as a companion to DotView. It requires prior approval for the application, site, and use case; limits use of Dotloop data to approved permissible uses; and requires consent, confidentiality, deletion controls, and appropriate privacy disclosures.[3] The agreement also expressly prohibits unauthorized scripting, robots, and scraping tools in connection with API and data use.[3]

> “Before accessing the Dotloop APIs, you must apply to register your Approved Site(s), system(s), and use cases … and receive Dotloop’s approval.” — Dotloop API License Agreement [3]

Therefore, I would **not** build a tool that silently harvests data from an already logged-in Dotloop browser session. If a browser companion is ever explored, it should be broker-installed, user-initiated, limited to a clearly approved export handoff, and reviewed with Dotloop in writing before development. The safer strategic route is to apply for API approval with a narrowly described analytics use case: a broker consents to read transaction details for the purpose of displaying their own brokerage analytics, calculating broker-configured commissions, and sharing only an authorized agent’s own data.

## Highest-impact product work

### 1. Build a real brokerage workspace boundary

This is the non-negotiable public-launch requirement. Every imported record, plan, assignment, calculation, agent link, and audit event must carry a **brokerage/workspace ID** that is enforced in server-side queries. A broker administrator should create the workspace; managers can prepare imports and plans; agents can see only their scoped portal; and any share link should resolve to both a workspace and a specific agent.

The design goal is simple: no query, mutation, export, or shared view can ever return information outside its workspace. This must not depend on browser state or UI filters. It needs database-level identifiers, server-side authorization checks, and automated cross-tenant tests.

### 2. Make imports repeatable and auditable

The current data-quality feedback is useful. The next improvement is an **Import Center** that makes the monthly or weekly workflow boring—in the best way. A broker should see import history, recognized mapping, duplicate detection, warning count, data period, and a “replace / append / compare” choice before data becomes active.

| Capability | Why it reduces broker effort | Priority |
|---|---|---|
| Saved brokerage-specific column mapping | Eliminates remapping the same Dotloop export each time. | Now |
| Import-run history and rollback | Lets a broker correct the wrong date range or file without losing the last good dashboard. | Now |
| Duplicate and changed-transaction detection | Avoids double-counted volume when reports overlap. | Now |
| Agent identity resolution | Handles name variants before plan assignment and sharing. | Now |
| Period comparison | Turns repeated imports into a useful management rhythm. | Next |
| Secure mailbox/attachment ingestion | Can remove a manual upload step later, with careful consent and retention controls. | Later |

### 3. Turn commissions into an operational system, not only a calculator

The plan builder is central to your value proposition. For broker trust, it needs a clear lifecycle: **draft → preview impact → effective date → active → archived**. Calculations should show exactly which plan version, cap state, split, deductions, and transaction fields produced each result. A CDA or payout report should be saved as a snapshot so later edits to a commission plan do not rewrite historical results.

I would add an impact preview before plan activation: “This change affects 14 agents and 286 transactions in the selected period; estimated company dollar changes by X.” This is much more valuable to a broker than additional dashboard visualizations because it makes plan editing safer.

### 4. Make agent sharing intentional and trustworthy

The existing agent portal foundation is good. The next public-facing improvements should be email-delivered, revocable access with a visible audit trail: who received the link, when it was opened, what reporting period it covers, and when it expires. The broker should be able to choose which modules the agent sees—for example, performance trends and plan-derived commission estimates, but not firm-wide volume, other-agent details, or broker deductions.

An eventual agent account can replace a bare link, but I would not require agents to create passwords in the first version. Use a magic-link or email verification approach tied to the agent identity once a brokerage workspace exists.

## Recommended DotView integration model

DotView should be the **broker’s operating hub**, while this product is the analytics and commission workspace. Do not attempt to duplicate all of DotView inside the reporter. The cleanest early experience is a signed, contextual handoff:

| DotView action | Reporter destination | Context passed |
|---|---|---|
| “Analyze brokerage” | Dashboard / Import Center | Brokerage workspace, selected reporting period, operator role |
| “Review agent” | Agent performance and commission page | Workspace, agent identity, permitted scope |
| “Manage compensation” | Commission Management | Workspace, manager/admin role |
| “Share agent report” | Share workflow | Workspace, agent identity, access policy |

The handoff should use a short-lived signed token or SSO assertion—not a mutable query string with the broker or agent name. The reporter validates the signature on the server, resolves the workspace and role, and loads only the allowed data. This keeps DotView and the analytics product loosely coupled while still feeling like one platform.

## A practical 90-day sequence

| Window | Outcome | Decision gate |
|---|---|---|
| **Days 0–30** | Pilot-ready foundation: brokerage workspaces, administrator/manager/agent roles, workspace-scoped data, import runs, and audit logs. | Can two pilot brokerages operate without seeing or changing one another’s data? |
| **Days 31–60** | Repeatable commission operations: saved mapping, identity resolution, plan versioning, effective dates, impact preview, and immutable payout snapshots. | Can a broker explain and reproduce any agent calculation? |
| **Days 61–90** | DotView contextual handoff, verified agent delivery, import comparison, and security/retention review. | Can a broker complete the full monthly workflow with minimal support? |

## Bottom line

The product direction is sound. The combination of brokerage-level analytics, configurable commission logic, and agent-specific reporting is compelling because it converts raw transaction exports into management action. The next differentiator is not another visual; it is **trustworthy operating workflow**: isolated brokerage data, repeatable imports, explainable commissions, and controlled sharing.

**Keep CSV as the core import path for launch.** Make it exceptionally guided and repeatable. In parallel, begin the formal conversation with Dotloop about an approved OAuth/API analytics integration. Do not make browser scraping the foundation of the product. That path may look fast at first, but it is less reliable, more difficult to support, and materially riskier for a public-facing platform.

## References

[1]: https://support.dotloop.com/s/article/Broker-Report-Builder "Dotloop Support — Broker Report Builder"
[2]: https://info.dotloop.com/developers "Dotloop Developer Center"
[3]: https://www.dotloop.com/api-license-agreement/ "Dotloop API License Agreement"
[4]: https://dotloop.github.io/public-api/ "Dotloop Platform — Developer Guide, Public API Version 2"
