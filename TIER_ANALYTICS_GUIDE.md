# Tier Analytics Implementation Guide

## Overview

The tier analytics system provides comprehensive tracking and visualization of agent progression through commission tiers. It automatically logs tier transitions during commission calculations and provides analytics dashboards for performance monitoring.

## Architecture

### Components

#### 1. Tier History Router (`server/tierHistoryRouter.ts`)
The backend API providing tier tracking and analytics endpoints:

- **logTransition**: Records when an agent reaches a new tier threshold
- **getAgentHistory**: Retrieves tier progression history for a specific agent
- **getTierStats**: Calculates aggregate statistics for tier advancement
- **getTierDistribution**: Shows how many agents are at each tier level
- **getRevenueByTier**: Analyzes revenue impact by tier
- **getAdvancementTimeline**: Tracks tier advancement patterns over time

#### 2. Tier Transition Tracker (`server/lib/tier-transition-tracker.ts`)
Helper module for detecting and tracking tier transitions:

- **getCurrentTierIndex**: Determines agent's current tier based on YTD amount
- **detectTierTransition**: Identifies when an agent crosses a tier threshold
- **trackTierTransitions**: Processes multiple transactions to find all tier changes
- **formatTierTransition**: Formats transition data for display
- **getTierProgression**: Shows an agent's path through tiers

#### 3. Tier Analytics Dashboard (`client/src/components/TierAnalyticsDashboard.tsx`)
Frontend component displaying tier analytics:

- Agent distribution pie chart
- Revenue impact bar chart
- Advancement timeline line chart
- Performance metrics cards
- Recent transitions list

#### 4. Tier Analytics Page (`client/src/pages/TierAnalytics.tsx`)
Full-page view for comprehensive tier analytics viewing.

## Data Model

### Tier History Table
```sql
CREATE TABLE tier_history (
  id VARCHAR(64) PRIMARY KEY,
  tenantId INT NOT NULL,
  agentName VARCHAR(255) NOT NULL,
  planId VARCHAR(64) NOT NULL,
  
  -- Previous tier information
  previousTierIndex INT,
  previousTierThreshold INT,
  previousSplitPercentage INT,
  
  -- New tier information
  newTierIndex INT NOT NULL,
  newTierThreshold INT NOT NULL,
  newSplitPercentage INT NOT NULL,
  
  -- Transaction context
  ytdAmount INT NOT NULL,
  transactionId VARCHAR(64),
  transactionDate VARCHAR(10),
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX tier_history_tenant_idx (tenantId),
  INDEX tier_history_agent_idx (agentName),
  INDEX tier_history_plan_idx (planId),
  INDEX tier_history_date_idx (createdAt),
  INDEX tier_history_tenant_agent_plan_idx (tenantId, agentName, planId)
);
```

## Integration Points

### Commission Calculator Integration
To integrate tier tracking into the commission calculator:

```typescript
import { detectTierTransition } from './lib/tier-transition-tracker';

// After calculating commission for each transaction
const transition = detectTierTransition(
  plan,
  agentName,
  plan.id,
  ytdBefore,
  ytdAfter,
  transaction.id,
  transaction.closingDate
);

if (transition) {
  // Log the transition to the database
  await trpc.tierHistory.logTransition.mutate(transition);
}
```

### API Usage

#### Log a Tier Transition
```typescript
const result = await trpc.tierHistory.logTransition.mutate({
  agentName: 'John Doe',
  planId: 'plan-1',
  previousTierIndex: 0,
  previousTierThreshold: 0,
  previousSplitPercentage: 60,
  newTierIndex: 1,
  newTierThreshold: 50000,
  newSplitPercentage: 65,
  ytdAmount: 55000,
  transactionId: 'txn-001',
  transactionDate: '2024-01-15',
});
```

#### Get Agent Tier History
```typescript
const history = await trpc.tierHistory.getAgentHistory.query({
  agentName: 'John Doe',
  planId: 'plan-1',
  limit: 50,
});
```

#### Get Tier Statistics
```typescript
const stats = await trpc.tierHistory.getTierStats.query({
  planId: 'plan-1',
  daysBack: 90,
});

// Returns:
// - tierCounts: Number of agents at each tier
// - tierTransitions: Number of transitions to each tier
// - averageTimings: Average days to reach each tier
// - totalTransitions: Total tier changes in period
// - uniqueAgents: Number of agents who advanced
// - recentTransitions: Latest 10 transitions
```

#### Get Tier Distribution
```typescript
const distribution = await trpc.tierHistory.getTierDistribution.query({
  planId: 'plan-1',
});

// Returns array of:
// - tier: Tier number
// - count: Number of agents at this tier
// - percentage: Percentage of total agents
// - agents: List of agent names
```

#### Get Revenue by Tier
```typescript
const revenue = await trpc.tierHistory.getRevenueByTier.query({
  planId: 'plan-1',
  daysBack: 90,
});

// Returns array of:
// - tier: Tier number
// - totalYtdAmount: Total YTD for all agents at tier
// - averageYtdAmount: Average YTD per agent
// - transitionCount: Number of transitions to tier
// - uniqueAgents: Number of unique agents at tier
```

#### Get Advancement Timeline
```typescript
const timeline = await trpc.tierHistory.getAdvancementTimeline.query({
  planId: 'plan-1',
  daysBack: 90,
});

// Returns array of:
// - date: YYYY-MM-DD
// - transitions: Array of { tier, count }
```

## Dashboard Features

### Agent Distribution Chart
A pie chart showing the percentage of agents at each tier level. Helps identify:
- Which tiers have the most agents
- Distribution balance across tiers
- Potential bottlenecks in tier progression

### Revenue Impact Analysis
A bar chart comparing total YTD amounts by tier. Shows:
- Revenue contribution by tier
- Average earnings per tier
- Tier profitability

### Advancement Timeline
A line chart tracking tier transitions over time. Reveals:
- Seasonal patterns in tier advancement
- Acceleration or deceleration of progression
- Impact of plan changes

### Performance Metrics
Key statistics including:
- Total transitions in period
- Unique agents advancing
- Average days to reach each tier
- Total YTD revenue by tier

### Recent Transitions
List of latest tier advancements showing:
- Agent name
- Tier progression (e.g., Tier 0 → Tier 1)
- YTD amount at transition
- Transition date

## Multi-Tenant Isolation

All tier history data is scoped by `tenantId` to ensure complete isolation between brokerages:

```typescript
// All queries automatically filter by ctx.user.tenantId
const history = await db
  .select()
  .from(tierHistory)
  .where(eq(tierHistory.tenantId, ctx.user.tenantId));
```

## Performance Considerations

### Indexes
The tier_history table includes strategic indexes for common query patterns:
- `tenantId` for tenant isolation
- `agentName` for agent lookups
- `planId` for plan-specific analytics
- `createdAt` for timeline queries
- Composite index on `(tenantId, agentName, planId)` for agent-specific queries

### Query Optimization
- Queries are limited by date range (`daysBack` parameter)
- Results can be limited to reduce memory usage
- Aggregations are computed in the application layer for flexibility

## Testing

Run the test suite with:
```bash
pnpm test server/tierHistoryRouter.test.ts
```

Tests cover:
- Logging tier transitions
- Retrieving agent history
- Calculating statistics
- Multi-tenant isolation
- Error handling

## Future Enhancements

1. **Tier Velocity Analysis**: Track how quickly agents move through tiers
2. **Predictive Analytics**: Forecast when agents will reach next tier
3. **Comparative Analysis**: Compare tier progression across agents
4. **Alerts**: Notify managers when agents reach new tiers
5. **Export Functionality**: Download tier analytics as CSV/PDF
6. **Custom Time Periods**: Allow users to specify custom date ranges
7. **Drill-Down Capabilities**: Click on tier data to see individual transactions
8. **Tier Retention**: Track how long agents stay at each tier

## Troubleshooting

### No Tier Data Appearing
1. Verify the commission plan has `useSliding: true` and tiers defined
2. Check that transactions have closing dates in the selected period
3. Ensure agents have YTD amounts that cross tier thresholds

### Incorrect Agent Counts
1. Verify the latest tier for each agent is being tracked correctly
2. Check for duplicate agent names across different plans
3. Ensure tenantId is correctly set in the context

### Performance Issues
1. Increase the `daysBack` parameter to reduce query scope
2. Create additional indexes if needed
3. Consider archiving old tier history data

## API Reference

### Tier History Router Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `tierHistory.logTransition` | POST | Log a tier transition |
| `tierHistory.getAgentHistory` | GET | Get agent's tier progression |
| `tierHistory.getTierStats` | GET | Get aggregate tier statistics |
| `tierHistory.getTierDistribution` | GET | Get agent distribution by tier |
| `tierHistory.getRevenueByTier` | GET | Get revenue metrics by tier |
| `tierHistory.getAdvancementTimeline` | GET | Get tier advancement timeline |

### Input Parameters

#### logTransition
```typescript
{
  agentName: string;
  planId: string;
  previousTierIndex?: number;
  previousTierThreshold?: number;
  previousSplitPercentage?: number;
  newTierIndex: number;
  newTierThreshold: number;
  newSplitPercentage: number;
  ytdAmount: number;
  transactionId?: string;
  transactionDate?: string; // YYYY-MM-DD
}
```

#### getAgentHistory
```typescript
{
  agentName: string;
  planId?: string;
  limit?: number; // default: 50
}
```

#### getTierStats
```typescript
{
  planId?: string;
  daysBack?: number; // default: 90
}
```

#### getTierDistribution
```typescript
{
  planId?: string;
}
```

#### getRevenueByTier
```typescript
{
  planId?: string;
  daysBack?: number; // default: 90
}
```

#### getAdvancementTimeline
```typescript
{
  planId?: string;
  daysBack?: number; // default: 90
}
```

## Security Considerations

1. **Authentication**: All endpoints require user authentication
2. **Tenant Isolation**: Data is automatically scoped by tenantId
3. **Authorization**: Only users within the same tenant can access data
4. **Data Validation**: All inputs are validated with Zod schemas
5. **SQL Injection Prevention**: Using Drizzle ORM parameterized queries

## Conclusion

The tier analytics system provides a comprehensive framework for tracking agent performance through commission tiers. By automatically logging transitions and providing rich analytics, it enables brokerages to monitor and optimize their commission structures.
