# Feasibility Report: Commission Automation & Sliding Scales

## 1. Data Availability Analysis
Based on the `csvParser.ts` file, your current data structure includes the following key financial fields:
*   `Sale Price` / `Price`
*   `Commission Total`
*   `Buy Side Commission` / `Sell Side Commission`
*   `Company Dollar` (This is critical for splits)
*   `Commission Split` (Raw text field?)
*   `Closing Date` (Essential for YTD calculations)

**Status:** ✅ **SUFFICIENT.** We have enough raw data to calculate splits, provided the `Company Dollar` or `Commission Split` fields are populated in your CSV.

## 2. Sliding Scale Logic (The "Cap" System)
To implement sliding scales (e.g., "70/30 split until $20k cap, then 100%"), we need to track an agent's *cumulative* production over a specific period (usually a calendar year or anniversary year).

**Feasibility:**
*   **YTD Tracking:** We can easily filter records by `Closing Date` to calculate Year-to-Date (YTD) Company Dollar for each agent.
*   **Cap Logic:** We can write a function that checks: `if (Agent_YTD_Company_Dollar < Cap_Amount) { Apply_Split } else { Apply_100_Percent }`.

**The Missing Piece:**
Your CSV contains *transaction* data, but it likely does **not** contain the *rules* themselves (e.g., "Agent A has a $20k cap," "Agent B is on a 50/50 team split").

## 3. Implementation Strategy
Since the "Rules" aren't in the CSV, we need to build a simple "Commission Settings" interface where you can define them.

**Proposed Workflow:**
1.  **Settings Page:** You define "Commission Plans" (e.g., "Standard Agent: 80/20, $18k Cap").
2.  **Agent Assignment:** You assign each agent to a plan.
3.  **Automated Calculation:**
    *   When you upload a CSV, the system calculates each agent's YTD total.
    *   It compares the YTD total to their Cap.
    *   It generates a "Projected Commission" report showing what the split *should* be vs. what was in the CSV (audit tool).

## 4. Recommendation
**Yes, it is possible.** We can build a "Commission Audit" feature that uses your existing data to verify if splits were calculated correctly based on sliding scale rules you define in the app.

**Next Step:**
Would you like me to build the **"Commission Settings"** page first, so you can define these split rules?
