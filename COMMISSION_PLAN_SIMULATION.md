# Commission Plan Simulation Feature - Architecture & Design

## Overview

The **Commission Plan Simulation** feature enables real estate agents and brokers to perform "what-if" analysis by testing different commission structures and seeing the projected impact on earnings, agent compensation, and total commission across 30/60/90 day timeframes.

---

## Feature Purpose

**Problem:** Agents need to understand how different commission splits (e.g., 60/40 vs 50/50 vs 70/30) would impact their earnings on forecasted deals.

**Solution:** A side-by-side comparison tool that:
- Allows users to define multiple commission plans
- Shows current vs. simulated commission impact
- Displays agent-level earnings breakdown
- Calculates total company dollar and agent dollar across timeframes
- Exports comparison reports

---

## Architecture & Components

### 1. **CommissionPlanSimulator Modal Component**

**Location:** `client/src/components/CommissionPlanSimulator.tsx`

**Purpose:** Main modal interface for creating and testing commission plans

**Key Props:**
```typescript
interface CommissionPlanSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  forecastedDeals: ForecastedDeal[];  // Deals from current 30/60/90 selection
  agentMetrics: AgentMetrics[];        // Agent breakdown data
  currentPlan?: CommissionPlan;        // Current active plan (optional)
  onApplyPlan?: (plan: CommissionPlan) => void;
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Commission Plan Simulator                            [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Create New Plan] [Load Template] [Compare Plans]          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CURRENT PLAN                  │ SIMULATED PLAN       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Plan Name: Standard 60/40     │ Plan Name: [Input]   │   │
│  │ Agent Split: 60%              │ Agent Split: [Slider]│   │
│  │ Company Split: 40%            │ Company Split: Auto  │   │
│  │ Brokerage Fee: 0%             │ Brokerage Fee: [Inp] │   │
│  │ Desk Fee: $0/mo               │ Desk Fee: [Input]    │   │
│  │ Transaction Fee: $0           │ Trans Fee: [Input]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 30-DAY FORECAST COMPARISON                           │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Projected Deals:      16 deals                       │   │
│  │ Avg Deal Value:       $24,584.69                     │   │
│  │ Total GCI:            $393,355.00                    │   │
│  │                                                      │   │
│  │ CURRENT PLAN          │ SIMULATED PLAN              │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ Agent Earnings:       │ Agent Earnings:             │   │
│  │ $235,413.00 (60%)     │ $196,677.50 (50%)           │   │
│  │                       │                             │   │
│  │ Company Dollar:       │ Company Dollar:             │   │
│  │ $157,942.00 (40%)     │ $196,677.50 (50%)           │   │
│  │                       │                             │   │
│  │ Impact: -$38,735.50   │ (+24.6% to company)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AGENT-LEVEL BREAKDOWN (30 Days)                      │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Agent Name    │ Deals │ Current  │ Simulated │ Diff  │   │
│  │ ──────────────┼───────┼──────────┼───────────┼────── │   │
│  │ James W.      │ 3     │ $45,200  │ $37,800   │ -$7.4k│   │
│  │ Sarah M.      │ 2     │ $32,100  │ $26,750   │ -$5.3k│   │
│  │ Michael T.    │ 2     │ $28,900  │ $24,083   │ -$4.8k│   │
│  │ ...           │ ...   │ ...      │ ...       │ ...   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Export Comparison] [Save Plan] [Apply Plan] [Cancel]     │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. **Commission Plan Data Model**

**Location:** `shared/types.ts`

```typescript
interface CommissionPlan {
  id: string;
  name: string;
  description?: string;
  agentSplit: number;           // 0-100 (agent percentage)
  companySplit: number;         // 0-100 (company percentage)
  brokerageFee?: number;        // Percentage or flat amount
  deskFee?: number;             // Monthly desk fee
  transactionFee?: number;      // Per-transaction fee
  minimumCommission?: number;   // Minimum commission per deal
  capCommission?: boolean;      // Cap commission at X%
  capAmount?: number;           // Cap percentage
  isTemplate?: boolean;         // Predefined template
  createdAt: Date;
  updatedAt: Date;
}

interface CommissionPlanComparison {
  currentPlan: CommissionPlan;
  simulatedPlan: CommissionPlan;
  timeframe: '30' | '60' | '90';
  forecastedDeals: ForecastedDeal[];
  currentEarnings: {
    agentTotal: number;
    companyTotal: number;
    byAgent: Record<string, number>;
  };
  simulatedEarnings: {
    agentTotal: number;
    companyTotal: number;
    byAgent: Record<string, number>;
  };
  impact: {
    agentDifference: number;
    agentPercentChange: number;
    companyDifference: number;
    companyPercentChange: number;
    breakeven: boolean;
  };
}
```

---

### 3. **Commission Calculation Engine**

**Location:** `server/routers.ts` (new procedure)

**Procedure:** `commission.simulatePlan`

```typescript
commission: {
  simulatePlan: protectedProcedure
    .input(z.object({
      currentPlan: z.object({
        agentSplit: z.number(),
        companySplit: z.number(),
        brokerageFee: z.number().optional(),
        deskFee: z.number().optional(),
        transactionFee: z.number().optional(),
      }),
      simulatedPlan: z.object({
        agentSplit: z.number(),
        companySplit: z.number(),
        brokerageFee: z.number().optional(),
        deskFee: z.number().optional(),
        transactionFee: z.number().optional(),
      }),
      forecastedDeals: z.array(z.object({
        id: z.string(),
        price: z.number(),
        probability: z.number(),
        agent: z.string(),
      })),
      timeframe: z.enum(['30', '60', '90']),
    }))
    .query(async ({ input, ctx }) => {
      // Calculate earnings for both plans
      const currentEarnings = calculatePlanEarnings(
        input.forecastedDeals,
        input.currentPlan
      );
      
      const simulatedEarnings = calculatePlanEarnings(
        input.forecastedDeals,
        input.simulatedPlan
      );
      
      // Calculate impact
      const impact = {
        agentDifference: simulatedEarnings.agentTotal - currentEarnings.agentTotal,
        agentPercentChange: ((simulatedEarnings.agentTotal - currentEarnings.agentTotal) / currentEarnings.agentTotal) * 100,
        companyDifference: simulatedEarnings.companyTotal - currentEarnings.companyTotal,
        companyPercentChange: ((simulatedEarnings.companyTotal - currentEarnings.companyTotal) / currentEarnings.companyTotal) * 100,
      };
      
      return {
        currentEarnings,
        simulatedEarnings,
        impact,
      };
    }),
}
```

---

### 4. **Commission Calculation Utility**

**Location:** `server/utils/commissionSimulationUtils.ts` (new)

```typescript
export function calculatePlanEarnings(
  deals: ForecastedDeal[],
  plan: CommissionPlan
): CommissionEarnings {
  let agentTotal = 0;
  let companyTotal = 0;
  const byAgent: Record<string, number> = {};
  
  for (const deal of deals) {
    // Base commission: Price × 3% × Probability
    const baseCommission = deal.price * 0.03 * (deal.probability / 100);
    
    // Apply plan splits
    const agentEarnings = baseCommission * (plan.agentSplit / 100);
    const companyEarnings = baseCommission * (plan.companySplit / 100);
    
    // Apply fees
    const agentAfterFees = agentEarnings - (plan.transactionFee || 0);
    const companyAfterFees = companyEarnings + (plan.transactionFee || 0);
    
    // Apply brokerage fee (if percentage)
    if (plan.brokerageFee) {
      const brokerageCut = companyAfterFees * (plan.brokerageFee / 100);
      companyTotal += companyAfterFees - brokerageCut;
    } else {
      companyTotal += companyAfterFees;
    }
    
    agentTotal += agentAfterFees;
    
    // Track by agent
    if (!byAgent[deal.agent]) byAgent[deal.agent] = 0;
    byAgent[deal.agent] += agentAfterFees;
  }
  
  return { agentTotal, companyTotal, byAgent };
}
```

---

### 5. **Frontend Hook for Simulation**

**Location:** `client/src/hooks/useCommissionSimulation.ts` (new)

```typescript
export function useCommissionSimulation() {
  const trpc = trpc.useUtils();
  
  const simulatePlan = trpc.commission.simulatePlan.useQuery(
    (input) => input,
    {
      enabled: false, // Manual trigger
    }
  );
  
  const runSimulation = useCallback(
    (params: SimulationParams) => {
      return simulatePlan.refetch({ ...params });
    },
    [simulatePlan]
  );
  
  return {
    results: simulatePlan.data,
    isLoading: simulatePlan.isLoading,
    error: simulatePlan.error,
    runSimulation,
  };
}
```

---

## User Workflow

### Step 1: Open Simulator
- User clicks "Commission Plan Simulator" button in CommissionProjector component
- Modal opens with current plan pre-populated

### Step 2: Create Simulated Plan
- User adjusts sliders for agent/company split
- Optional: Add desk fees, transaction fees, brokerage fees
- Plan name auto-generated or user-defined

### Step 3: Run Simulation
- Click "Compare Plans" button
- Backend calculates earnings for both plans
- Results display in side-by-side comparison

### Step 4: Analyze Results
- View 30/60/90 day impact
- See agent-level breakdown
- Identify winners/losers in new plan

### Step 5: Export or Apply
- **Export:** Generate PDF/Excel report with comparison
- **Apply:** Save as new plan and update dashboard
- **Save Template:** Store for future use

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ CommissionPlanSimulator Modal                               │
│ (User adjusts splits, fees)                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ useCommissionSimulation Hook                                │
│ (Prepares input data)                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ tRPC Mutation: commission.simulatePlan                      │
│ (Sends to backend)                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Server: calculatePlanEarnings()                             │
│ (Processes deals × 2 plans)                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Return: CommissionPlanComparison                            │
│ {                                                            │
│   currentEarnings: { agentTotal, companyTotal, byAgent }    │
│   simulatedEarnings: { agentTotal, companyTotal, byAgent }  │
│   impact: { difference, percentChange, breakeven }          │
│ }                                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Modal: Display Comparison                                   │
│ - Side-by-side earnings                                     │
│ - Impact metrics                                            │
│ - Agent breakdown table                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. **Plan Templates**
Pre-built commission structures:
- **Standard 60/40:** 60% agent, 40% company
- **Aggressive 70/30:** 70% agent, 30% company
- **Conservative 50/50:** 50/50 split
- **Custom:** User-defined

### 2. **Dynamic Calculation**
- Respects current probability-weighted forecast
- Accounts for deal age and risk adjustment
- Includes all fees and adjustments

### 3. **Agent-Level Impact**
- Shows which agents benefit/lose
- Identifies retention risk
- Helps with targeted retention offers

### 4. **Multi-Timeframe Analysis**
- 30-day impact
- 60-day impact
- 90-day impact
- Cumulative view

### 5. **Export Capabilities**
- **PDF Report:** Professional comparison report with charts
- **Excel:** Detailed breakdown by agent and deal
- **CSV:** Raw data for further analysis

---

## Integration Points

### 1. **CommissionProjector Component**
Add button to open simulator:
```tsx
<Button onClick={() => setSimulatorOpen(true)}>
  Simulate Different Plans
</Button>
```

### 2. **ProjectedToCloseCard**
Add link to simulator:
```tsx
<Link to="#simulator">
  What if you changed your commission plan?
</Link>
```

### 3. **Dashboard Settings**
Allow users to:
- Set default commission plan
- Create custom plans
- Manage plan templates

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create CommissionPlanSimulator component
- [ ] Add data models to shared/types.ts
- [ ] Implement tRPC procedure
- [ ] Create calculation utilities

### Phase 2: UI & Interaction (Week 1-2)
- [ ] Build plan input form with sliders
- [ ] Create comparison display
- [ ] Add agent breakdown table
- [ ] Implement timeframe selector

### Phase 3: Advanced Features (Week 2-3)
- [ ] Plan templates
- [ ] Save/load plans
- [ ] Export functionality
- [ ] Historical comparison

### Phase 4: Testing & Refinement (Week 3-4)
- [ ] Unit tests for calculations
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Performance optimization

---

## Example Scenarios

### Scenario 1: Competitive Retention
**Current Plan:** 60/40
**Simulated Plan:** 70/30
**Impact:** Agent earnings +$38,735 over 30 days → Retention offer

### Scenario 2: Profitability Improvement
**Current Plan:** 60/40
**Simulated Plan:** 50/50
**Impact:** Company dollar +$24,600 over 30 days → Improved margins

### Scenario 3: New Agent Onboarding
**Current Plan:** 60/40
**Simulated Plan:** 80/20 (first 6 months)
**Impact:** Agent earnings +$58,102 over 30 days → Attractive for new hires

---

## Success Metrics

- **Adoption:** % of users who run at least 1 simulation per month
- **Engagement:** Average time spent in simulator
- **Impact:** Plans applied based on simulation results
- **Accuracy:** Simulation vs. actual earnings variance < 2%

---

## Future Enhancements

1. **Machine Learning:** Predict agent performance under different plans
2. **Benchmarking:** Compare plans to industry standards
3. **Scenario Modeling:** Multi-variable what-if analysis
4. **Alerts:** Notify when plan changes would hurt retention
5. **A/B Testing:** Test plans on subset of agents

---

## Technical Considerations

### Performance
- Cache plan calculations for same deals
- Limit to 1000 deals per simulation
- Debounce slider changes

### Security
- Validate all plan parameters
- Audit plan changes
- Restrict to authorized users

### Data Integrity
- Use same probability calculations as main forecast
- Verify against historical data
- Log all simulations

---

## Conclusion

The Commission Plan Simulator empowers brokers and agents to make data-driven decisions about compensation structures. By providing transparent, accurate "what-if" analysis, it enables better retention strategies, improved profitability, and more competitive offers for new talent.
