# Broker Quick-Start Verification

The populated dashboard presents three prominent broker task cards above the live brokerage health snapshot. The cards cover agent-metric calculation and sharing, overall brokerage health, and commission-aware CDA creation. The summary uses the active data context and correctly reported 33 agents and 381 transactions in the representative demo dataset.

The first-use agent-delivery card opened a guided dialog with three visible stages: reviewing the agent roster, applying commission plans, and creating private agent links. The dialog provides direct handoffs to the existing Agent Leaderboard, Commission Management, and agent-sharing workspace, plus a clear option to skip the tutorial for quick access on later use.

Selecting **Skip tutorial — use quick access** opened the existing agent-sharing workspace. Returning to the dashboard changed the agent-delivery card to **Quick access**, displayed an **Open sharing workspace** primary action, and retained a separate link to review the guided steps again.

The brokerage-health walkthrough displayed the three intended leadership-review stages. Its **View Health Snapshot** handoff dismissed the dialog and scrolled directly to the live brokerage health snapshot, where the production, volume, closing-rate, and pipeline metrics remained visible.

The CDA walkthrough displayed the intended closing sequence: choose a transaction, confirm the applied commission plan, then preview and produce the CDA. Its first action provides a direct handoff to the existing CDA Builder, which now accepts the active dashboard transaction data.

The CDA Builder was verified with the active demo dataset: its transaction selector loaded the available records, selection prefilled the property and transaction details, and the waterfall recalculated. When a selected agent has no assignment, the builder gives an explicit manual-review notice instead of implying that a commission plan has been applied.
