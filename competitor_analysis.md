# Competitor Analysis & Feature Gap Report

## 1. Sisu (The "Gold Standard" for Team Analytics)
**Key Features Identified:**
*   **Agent Accountability:** Tracks activities (calls, appointments) vs. results (closings).
*   **Goal Tracking:** Visual progress bars for daily/monthly/yearly GCI and unit goals.
*   **Income Reporting:** Net Income and Net GCI tracking (factoring in expenses).
*   **Lead Source ROI:** Not just distribution, but *expense* vs. *return* analysis per source.
*   **Leaderboards:** Gamified rankings (similar to what we built, but likely more extensive).
*   **Client Portal:** Road-to-close trackers for end-clients.

## 2. Brokermint (Back-Office Focus)
**Key Features Identified:**
*   **Commission Automation:** Detailed split management and sliding scales.
*   **Agent Statements:** Automated generation of commission statements.
*   **Accounting Integration:** Syncs with QuickBooks/Xero.

## 3. SkySlope (Compliance & Transaction Focus)
**Key Features Identified:**
*   **Audit Logs:** Detailed history of file access and changes.
*   **Compliance Checklists:** Visual indicators of file completeness (We have a basic version of this).

## Gap Analysis: Dotloop Reporting Tool vs. Market Leaders

| Feature Category | Market Standard (Sisu/Brokermint) | Current Dotloop Tool Status | Gap / Opportunity |
| :--- | :--- | :--- | :--- |
| **Goal Setting** | Agents set annual GCI/Unit goals; dashboards show % to goal. | **Missing** | **High Impact:** Allow users to input goals and show progress bars. |
| **ROI Analysis** | Lead Source ROI (Cost per Lead vs. Commission Generated). | Partial (Distribution only) | **High Impact:** Add "Cost" input to calculate true ROI. |
| **Forecasting** | "Pending Income" and "Projected Closing" timelines. | Partial (Pipeline chart) | **Medium Impact:** Add "Future GCI" projection based on closing dates. |
| **Agent "Scorecards"** | Detailed single-page view of an agent's entire business health. | Good (Agent Modal) | **Low Gap:** Our modal is quite strong, could add "Conversion Rates" (Appt -> Signed). |
| **Gamification** | TV Mode for office displays, contest tracking. | Good (Podium) | **Medium Impact:** Add a "TV Mode" (auto-scroll leaderboard). |
| **Year-over-Year** | Direct comparison of this month vs. same month last year. | Partial (Trends) | **Medium Impact:** Add explicit YoY variance columns (+15% vs 2024). |

## Recommended Improvements (Prioritized)

1.  **Goal Tracking Module:**
    *   *Why:* Agents love seeing how close they are to their "number".
    *   *Implementation:* Simple input field for "Annual Goal" -> Progress Bar on Dashboard.

2.  **Lead Source ROI Calculator:**
    *   *Why:* Knowing *where* deals come from is good; knowing *which make money* is better.
    *   *Implementation:* Allow user to input "Monthly Spend" per source -> Calculate "Cost per Closing".

3.  **"TV Mode" / Kiosk View:**
    *   *Why:* Real estate offices love displaying leaderboards on big screens.
    *   *Implementation:* A full-screen, auto-refreshing version of the Leaderboard/Podium.

4.  **Year-over-Year (YoY) Comparison:**
    *   *Why:* "Are we doing better than last year?" is the #1 question brokers ask.
    *   *Implementation:* Add a "Previous Year" dashed line to the Sales Timeline chart.
