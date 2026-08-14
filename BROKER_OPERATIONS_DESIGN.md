# Broker Operations Upgrade Design

## Scope

This delivery adds a repeatable import workflow, commission-plan auditability, and an agent-delivery center without changing the current CSV-first ingestion model.

| Capability | New durable record | Key data retained | Privacy boundary |
|---|---|---|---|
| Import Center | `import_runs` | file name, reporting period, status, record count, data-quality score, field completeness, warnings, mapping reference | Public tenant for this pilot; designed to gain a brokerage tenant boundary later |
| Saved mappings | `import_mapping_templates` | template name, CSV headers, standard-field mapping, use count | Returned only to the broker workflow |
| Plan versioning | `commission_plan_versions` | immutable plan snapshot, version number, effective period, lifecycle status, change note | Cannot change a historical version |
| Calculation audit | `commission_calculation_snapshots` | plan version, agent, reporting period, totals, transaction count, calculation payload | Snapshot remains explainable after plans change |
| Agent delivery | `agent_share_links` and `agent_share_access_logs` | recipient address, reporting-period label, lifecycle action, accessed timestamp | Link remains agent-scoped and revocable; no email service is assumed |

## Workflow

1. A broker imports a CSV and chooses a reporting-period label. The Import Center records the quality result and the reusable mapping.
2. The broker activates that import, which makes its period context available to reporting and sharing.
3. A commission plan is saved as a new immutable version. The broker can set an effective date and a change note.
4. A calculated agent result can be recorded as a snapshot tied to both the active import run and plan version.
5. When creating an agent link, the broker assigns a recipient email and period label. The tool records creation, access, and revocation events. The broker can copy a prefilled delivery message.

## Deliberate limitations in this phase

This app currently has no configured third-party outbound email provider. The Delivery Center validates and records the intended recipient and provides a copyable delivery message, but it does not claim to independently verify or deliver the address. Adding one-click email delivery requires an approved transactional email provider and a sender identity.

## Safety rules

- Raw CSV transaction data is not stored in the import-run metadata table.
- A plan edit creates a version snapshot instead of modifying prior calculation evidence.
- An agent link never receives firm-wide or other-agent transaction data.
- Revocation is immediate and an access-log record is retained for broker review.
