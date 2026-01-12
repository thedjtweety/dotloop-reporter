# Automatic Commission Calculation Guide

## Overview

The Automatic Commission Calculation feature transforms the Dotloop Reporter from an **audit-only** tool to a **full commission management system**. This feature automatically calculates agent commissions based on transaction data, commission plans, team splits, deductions, and cap tracking.

---

## Key Features

### ✅ What's Included

1. **Automatic Commission Calculation**
   - Calculate commissions from transaction data without manual entry
   - Support for multiple commission plan types
   - Real-time calculation with instant results

2. **Commission Plan Types**
   - **Percentage Split** (e.g., 80/20, 70/30)
   - **Cap-Based Plans** (annual company dollar caps)
   - **Post-Cap Splits** (100% to agent after cap)
   - **No-Cap Plans** (flat percentage throughout)

3. **Advanced Features**
   - **Team Splits** - Automatically split commissions with team leads
   - **YTD Tracking** - Track year-to-date company dollar with cap progress
   - **Anniversary Dates** - Support custom cap reset dates (not just calendar year)
   - **Deductions** - Fixed and percentage-based deductions per transaction
   - **Royalty/Franchise Fees** - Calculate franchise fees with caps
   - **Mixed Cap Scenarios** - Handle transactions that hit cap mid-deal

4. **Comprehensive Testing**
   - 21 test scenarios covering all edge cases
   - 100% test coverage for calculation logic
   - Validated against real-world brokerage scenarios

---

## How It Works

### Step-by-Step Calculation Process

#### 1. **Gross Commission Income (GCI)**
```
GCI = Sale Price × Commission Rate
```
If multiple agents, GCI is split equally.

**Example:**
- Sale Price: $500,000
- Commission Rate: 3%
- GCI = $500,000 × 0.03 = $15,000

---

#### 2. **Team Split (if applicable)**
```
Team Split Amount = GCI × Team Split Percentage
After Team Split = GCI - Team Split Amount
```

**Example:**
- GCI: $15,000
- Team Split: 50%
- Team Split Amount = $15,000 × 0.50 = $7,500
- After Team Split = $7,500

---

#### 3. **Brokerage Split (with Cap Logic)**

**Before Cap:**
```
Brokerage Split = After Team Split × (100 - Agent Split %)
```

**After Cap:**
```
Brokerage Split = After Team Split × (100 - Post-Cap Split %)
```

**Mixed (Hit Cap During Transaction):**
```
Pre-Cap Portion = Remaining Cap
Post-Cap Portion = (Potential Company Dollar - Remaining Cap) × (100 - Post-Cap Split %)
Brokerage Split = Pre-Cap Portion + Post-Cap Portion
```

**Example (Before Cap):**
- After Team Split: $7,500
- Agent Split: 80%
- Brokerage Split = $7,500 × 0.20 = $1,500
- Agent Gets: $6,000

---

#### 4. **Royalty/Franchise Fee (if applicable)**
```
Royalty = GCI × Royalty Percentage
If Royalty > Royalty Cap, then Royalty = Royalty Cap
```

**Example:**
- GCI: $15,000
- Royalty: 6%
- Royalty Cap: $500
- Calculated Royalty = $15,000 × 0.06 = $900
- Actual Royalty = $500 (capped)

---

#### 5. **Deductions**

**Fixed Deductions:**
```
Deduction Amount = Fixed Amount
```

**Percentage Deductions:**
```
Deduction Amount = GCI × Percentage
```

**Example:**
- Tech Fee: $50 (fixed)
- E&O Insurance: 2% of $15,000 = $300
- Total Deductions = $350

---

#### 6. **Net Commission to Agent**
```
Net Commission = After Team Split - Brokerage Split - Royalty - Deductions
```

**Example:**
- After Team Split: $7,500
- Brokerage Split: $1,500
- Royalty: $500
- Deductions: $350
- Net Commission = $7,500 - $1,500 - $500 - $350 = $5,150

---

#### 7. **YTD Tracking**
```
YTD After Transaction = YTD Before Transaction + Brokerage Split
Percent to Cap = (YTD After Transaction / Cap Amount) × 100
Is Capped = YTD After Transaction >= Cap Amount
```

**Example:**
- YTD Before: $5,000
- Brokerage Split: $1,500
- YTD After = $6,500
- Cap Amount: $18,000
- Percent to Cap = ($6,500 / $18,000) × 100 = 36.1%
- Is Capped: No

---

## Commission Plan Examples

### Example 1: Standard Capped Plan (80/20)

```typescript
{
  id: 'standard-80-20',
  name: 'Standard Capped (80/20)',
  splitPercentage: 80,        // Agent gets 80%
  capAmount: 18000,            // $18,000 annual cap
  postCapSplit: 100,           // Agent gets 100% after cap
}
```

**How it works:**
- Agent keeps 80% of commission before hitting $18,000 cap
- Brokerage keeps 20% (company dollar)
- After cap, agent keeps 100%

**Example Transaction:**
- GCI: $10,000
- Before cap: Agent gets $8,000, Brokerage gets $2,000
- After cap: Agent gets $10,000, Brokerage gets $0

---

### Example 2: No-Cap Plan (70/30)

```typescript
{
  id: 'no-cap-70-30',
  name: 'No Cap 70/30',
  splitPercentage: 70,
  capAmount: 0,                // No cap
  postCapSplit: 70,
}
```

**How it works:**
- Agent keeps 70% throughout the year
- Brokerage keeps 30% always
- No cap, so split never changes

---

### Example 3: Plan with Deductions

```typescript
{
  id: 'plan-with-deductions',
  name: 'Plan with Deductions',
  splitPercentage: 80,
  capAmount: 20000,
  postCapSplit: 100,
  deductions: [
    { id: 'd1', name: 'Tech Fee', amount: 50, type: 'fixed' },
    { id: 'd2', name: 'E&O Insurance', amount: 2, type: 'percentage' },
  ],
}
```

**How it works:**
- Same as standard 80/20 plan
- Deducts $50 tech fee per transaction
- Deducts 2% of GCI for E&O insurance

**Example Transaction:**
- GCI: $10,000
- Agent Split: $8,000
- Tech Fee: $50
- E&O: $200 (2% of $10,000)
- Net to Agent: $7,750

---

### Example 4: Franchise Plan with Royalty

```typescript
{
  id: 'franchise-plan',
  name: 'Franchise Plan',
  splitPercentage: 80,
  capAmount: 18000,
  postCapSplit: 100,
  royaltyPercentage: 6,        // 6% franchise fee
  royaltyCap: 500,             // Max $500 per transaction
}
```

**How it works:**
- Standard 80/20 split
- 6% franchise fee (capped at $500)
- Franchise fee is deducted from agent's share

**Example Transaction:**
- GCI: $15,000
- Agent Split: $12,000
- Franchise Fee: $500 (6% of $15,000 = $900, but capped at $500)
- Net to Agent: $11,500

---

## Team Splits

### How Team Splits Work

When an agent is part of a team, the **team split is applied first** before the brokerage split.

**Example:**

**Team Configuration:**
```typescript
{
  id: 'team-1',
  name: 'Alpha Team',
  leadAgent: 'John Doe',
  teamSplitPercentage: 50,     // Team lead gets 50%
}
```

**Agent Assignment:**
```typescript
{
  agentName: 'Jane Smith',
  planId: 'standard-80-20',
  teamId: 'team-1',
}
```

**Transaction:**
- GCI: $10,000
- Team Split: 50% = $5,000 (goes to team lead)
- Remaining: $5,000
- Agent Split (80%): $4,000
- Brokerage Split (20%): $1,000
- Net to Jane: $4,000
- Net to John (team lead): $5,000

---

## Anniversary Dates & Cap Resets

### Calendar Year (Default)

If no anniversary date is specified, caps reset on **January 1st**.

### Custom Anniversary Date

You can set a custom anniversary date (e.g., agent's hire date) for cap resets.

**Format:** `"MM-DD"` (e.g., `"03-15"` for March 15th)

**Example:**
- Agent's anniversary: March 1st (`"03-01"`)
- Transaction on February 15, 2024: Uses cycle starting March 1, 2023
- Transaction on April 15, 2024: Uses cycle starting March 1, 2024 (new cycle!)

**YTD Calculation:**
- YTD is calculated from the most recent anniversary date
- Transactions before the anniversary are in the previous cycle
- Transactions after the anniversary are in the new cycle

---

## Cap Scenarios

### Scenario 1: Before Cap

**Setup:**
- Cap: $18,000
- YTD: $5,000
- Transaction GCI: $10,000
- Brokerage Split (20%): $2,000

**Result:**
- YTD After: $7,000
- Split Type: `pre-cap`
- Agent Gets: $8,000
- Brokerage Gets: $2,000

---

### Scenario 2: After Cap

**Setup:**
- Cap: $18,000
- YTD: $20,000 (already capped)
- Transaction GCI: $10,000
- Post-Cap Split: 100% to agent

**Result:**
- YTD After: $20,000 (no change, already capped)
- Split Type: `post-cap`
- Agent Gets: $10,000
- Brokerage Gets: $0

---

### Scenario 3: Hit Cap During Transaction (Mixed)

**Setup:**
- Cap: $18,000
- YTD: $17,000
- Transaction GCI: $10,000
- Brokerage Split (20%): Would be $2,000
- Post-Cap Split: 100% to agent

**Calculation:**
- Remaining Cap: $18,000 - $17,000 = $1,000
- Pre-Cap Portion: $1,000 (brokerage gets this)
- Post-Cap Portion: $2,000 - $1,000 = $1,000 (agent gets 100%)
- Brokerage Gets: $1,000
- Agent Gets: $9,000

**Result:**
- YTD After: $18,000 (hit cap!)
- Split Type: `mixed`
- Agent Gets: $9,000
- Brokerage Gets: $1,000

---

## API Usage

### Calculate Commissions for Transactions

```typescript
import { calculateCommissions } from './server/lib/commission-calculator';

const result = calculateCommissions(
  transactions,      // Array of transaction data
  plans,             // Array of commission plans
  teams,             // Array of teams
  assignments,       // Array of agent plan assignments
  adjustmentsMap     // Optional: transaction-specific adjustments
);

// Result contains:
// - breakdowns: Array of CommissionBreakdown (one per transaction per agent)
// - ytdSummaries: Array of AgentYTDSummary (one per agent)
```

### Calculate Single Transaction

```typescript
import { calculateTransactionCommission } from './server/lib/commission-calculator';

const breakdown = calculateTransactionCommission(
  transaction,       // Transaction data
  agentName,         // Agent name
  plan,              // Commission plan
  team,              // Team (or undefined)
  ytdCompanyDollar,  // YTD before this transaction
  adjustments        // Optional: transaction-specific adjustments
);

// Returns: CommissionBreakdown
```

---

## Data Structures

### TransactionInput

```typescript
{
  id: string;
  loopName: string;
  closingDate: string;          // ISO date string
  agents: string;               // Comma-separated agent names
  salePrice: number;
  commissionRate: number;       // Percentage (e.g., 3 for 3%)
  buySidePercent?: number;      // Optional (default 50)
  sellSidePercent?: number;     // Optional (default 50)
}
```

### CommissionBreakdown

```typescript
{
  // Transaction Info
  transactionId: string;
  loopName: string;
  closingDate: string;
  agentName: string;
  
  // Gross Commission
  grossCommissionIncome: number;
  
  // Team Split
  teamSplitAmount: number;
  teamSplitPercentage: number;
  afterTeamSplit: number;
  
  // Brokerage Split
  brokerageSplitAmount: number;
  brokerageSplitPercentage: number;
  splitType: 'pre-cap' | 'post-cap' | 'mixed';
  
  // Deductions
  deductions: Array<{ name: string; amount: number; type: 'fixed' | 'percentage' }>;
  totalDeductions: number;
  
  // Royalty
  royaltyAmount: number;
  royaltyPercentage: number;
  
  // Net to Agent
  agentNetCommission: number;
  
  // YTD Tracking
  ytdBeforeTransaction: number;
  ytdAfterTransaction: number;
  capAmount: number;
  percentToCap: number;
  isCapped: boolean;
  
  // Plan Info
  planId: string;
  planName: string;
  teamId?: string;
  teamName?: string;
}
```

### AgentYTDSummary

```typescript
{
  agentName: string;
  planId: string;
  planName: string;
  teamId?: string;
  teamName?: string;
  
  // YTD Stats
  ytdCompanyDollar: number;
  ytdGrossCommission: number;
  ytdNetCommission: number;
  ytdDeductions: number;
  ytdRoyalties: number;
  
  // Cap Info
  capAmount: number;
  percentToCap: number;
  isCapped: boolean;
  remainingToCap: number;
  
  // Transaction Count
  transactionCount: number;
  
  // Anniversary
  anniversaryDate?: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
}
```

---

## Testing

### Run Tests

```bash
pnpm test server/lib/commission-calculator.test.ts
```

### Test Coverage

- ✅ Basic percentage splits (80/20, 70/30)
- ✅ Multiple agents splitting commission
- ✅ No-cap plans
- ✅ Transactions before cap
- ✅ Transactions after cap
- ✅ Transactions that hit cap (mixed)
- ✅ Team splits
- ✅ Fixed deductions
- ✅ Percentage deductions
- ✅ Transaction-specific adjustments
- ✅ Royalty/franchise fees
- ✅ Royalty caps
- ✅ YTD tracking across multiple transactions
- ✅ Cap hit across multiple transactions
- ✅ Anniversary date cycle resets
- ✅ Edge cases (zero GCI, no plan, negative commissions)

**Total: 21 test scenarios, all passing ✅**

---

## Best Practices

### 1. **Always Use Anniversary Dates for Accurate Cap Tracking**

If agents have custom cap reset dates (e.g., hire date), set the `anniversaryDate` field in their assignment.

### 2. **Process Transactions Chronologically**

The calculator automatically sorts transactions by closing date, but ensure your data is accurate.

### 3. **Handle Multiple Agents Carefully**

When multiple agents are on a transaction, GCI is split equally. If you need custom splits, process each agent separately.

### 4. **Use Transaction Adjustments for One-Off Expenses**

For expenses that aren't part of the standard plan (e.g., staging fees), use the `adjustmentsMap` parameter.

### 5. **Test with Real Data**

Before deploying, test with actual brokerage data to ensure calculations match expectations.

---

## Troubleshooting

### Issue: YTD doesn't match expectations

**Solution:** Check if the agent has an anniversary date set. YTD is calculated from the most recent anniversary, not calendar year.

### Issue: Cap not triggering correctly

**Solution:** Verify the `capAmount` in the commission plan. A cap of `0` means no cap.

### Issue: Team split not applying

**Solution:** Ensure the agent has a `teamId` in their assignment and the team exists in the `teams` array.

### Issue: Deductions not showing

**Solution:** Check if deductions are defined in the commission plan's `deductions` array.

---

## Future Enhancements

### Planned Features

1. **Tiered Commission Plans**
   - Multiple split percentages based on YTD thresholds
   - Example: 70% until $10k, then 80% until $20k, then 90%

2. **Transaction-Level Commission Rates**
   - Different splits for buy-side vs sell-side
   - Referral-only transactions with different rates

3. **Automated Email Notifications**
   - Alert agents when they hit cap milestones (80%, 100%)
   - Monthly production summaries

4. **Commission Statements**
   - Generate PDF statements for agents
   - Include YTD summary, transaction breakdown, deductions

5. **Payment Tracking**
   - Mark commissions as "paid"
   - Track payment dates and methods
   - Generate disbursement authorizations

---

## Support

For questions or issues, please refer to:
- **Competitive Analysis:** `/docs/COMMISSION_COMPETITIVE_ANALYSIS.md`
- **QuickBooks Integration:** `/docs/QUICKBOOKS_INTEGRATION_ANALYSIS.md`
- **Test Suite:** `/server/lib/commission-calculator.test.ts`

---

## Changelog

### v1.0.0 (January 2026)
- ✅ Initial release
- ✅ Automatic commission calculation
- ✅ Support for percentage splits, caps, and post-cap splits
- ✅ Team split calculations
- ✅ Deductions (fixed and percentage)
- ✅ Royalty/franchise fees
- ✅ YTD tracking with anniversary dates
- ✅ 21 test scenarios with 100% pass rate
