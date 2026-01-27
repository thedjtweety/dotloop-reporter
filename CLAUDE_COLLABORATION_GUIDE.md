# Claude Collaboration Guide

**A complete guide for collaborating with Claude on the Dotloop Reporting Tool project.**

---

## Quick Start for Claude

Welcome to the Dotloop Reporting Tool project! This guide will help you understand the codebase and contribute effectively.

### What This Project Does

The Dotloop Reporting Tool is a web-based platform that allows real estate brokerages to upload CSV exports from Dotloop and generate comprehensive reports, dashboards, and analytics. Key features include interactive data visualization, agent performance tracking, commission calculations, and multi-tenant architecture.

**Live Site:** https://dotlooproport.com

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | User interface and interactions |
| **Styling** | Tailwind CSS 4 | Responsive, utility-first styling |
| **Charts** | Recharts | Interactive data visualization |
| **Backend** | Express 4 + tRPC 11 | API and business logic |
| **Database** | MySQL 8+ / TiDB | Data persistence |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Testing** | Vitest | Unit and integration tests |
| **Build** | Vite | Fast development and production builds |

### Project Status

- **Stage:** Production-ready
- **Users:** Real estate brokerages
- **Data:** Transaction records from Dotloop exports
- **Architecture:** Multi-tenant with row-level security
- **Test Coverage:** 75%+ on critical paths
- **Deployment:** Manus hosting with custom domain support

---

## Documentation Map

Start with these documents in this order:

### 1. **README.md** (Start Here!)
- Project overview and features
- Quick start instructions
- Tech stack summary
- Key components overview

### 2. **CLAUDE_CODE_GUIDE.md** (Then Read This)
- File structure and organization
- Key files by feature
- Data flow examples
- Common patterns

### 3. **DESIGN_DECISIONS.md** (Understand Why)
- Architectural decisions and rationale
- Trade-offs and alternatives
- Performance considerations
- Security approach

### 4. **DEVELOPMENT_WORKFLOW.md** (How to Work)
- Local setup instructions
- Common development tasks
- Testing strategies
- Debugging guide

### 5. **GITHUB_SETUP_GUIDE.md** (Collaboration)
- Git workflow and branching
- Pull request process
- Code review guidelines
- Working with Claude

### 6. **docs/ARCHITECTURE.md** (Deep Dive)
- Multi-tenant architecture
- Database schema details
- Request flow diagrams
- Security model

### 7. **docs/SECURITY.md** (Security Details)
- Authentication and authorization
- Data protection measures
- Compliance considerations
- Security best practices

---

## How Claude Can Help

### Code Review & Suggestions
Claude can review code for:
- **Best Practices:** Suggest improvements to code quality
- **Performance:** Identify optimization opportunities
- **Security:** Spot potential security issues
- **Testing:** Recommend additional test cases
- **Architecture:** Suggest refactoring opportunities

**How to Request:**
```
"Please review this component for performance issues and suggest optimizations:
[paste code]"
```

### Feature Planning & Design
Claude can help with:
- **Architecture Design:** Plan new features
- **Database Schema:** Design data structures
- **API Design:** Plan new endpoints
- **UI/UX:** Suggest interface improvements
- **Trade-offs:** Discuss pros and cons of approaches

**How to Request:**
```
"I need to add a feature that allows users to export reports as PDF. 
What's the best approach? Should I use a library or build it from scratch?"
```

### Bug Debugging
Claude can help with:
- **Error Analysis:** Understand error messages
- **Root Cause:** Identify what's causing bugs
- **Solutions:** Suggest fixes
- **Testing:** Help verify fixes work

**How to Request:**
```
"I'm getting this error when uploading CSV files: [error message]
Here's the relevant code: [code]
What's causing this?"
```

### Documentation & Learning
Claude can help with:
- **Explaining Code:** Understand how features work
- **Learning Patterns:** Understand project patterns
- **Documentation:** Write clear documentation
- **Examples:** Provide code examples

**How to Request:**
```
"Can you explain how the CSV upload flow works? 
I'm trying to understand the data flow from upload to storage."
```

### Implementation Assistance
Claude can help with:
- **Code Generation:** Write boilerplate code
- **Testing:** Write test cases
- **Refactoring:** Improve existing code
- **Integration:** Connect components

**How to Request:**
```
"I need to create a new chart component that shows agent performance trends.
Can you provide a starting template that I can customize?"
```

---

## Effective Communication with Claude

### Provide Context

**Good:**
```
"I'm adding a new feature to track agent performance trends. 
I need to create a new chart component that:
1. Accepts an array of agent metrics with timestamps
2. Displays trends over the last 12 months
3. Shows revenue and deals closed
4. Is responsive on mobile
5. Supports dark mode

I'm planning to use Recharts like the other charts. 
Where should I create this component and what's the best approach?"
```

**Poor:**
```
"How do I add a chart?"
```

### Share Relevant Code

**Good:**
```
"Here's the structure of similar chart components:
[paste PipelineChart.tsx]

I want to create something similar but for agent trends.
What would be different?"
```

**Poor:**
```
"The chart isn't working. Fix it."
```

### Ask Specific Questions

**Good:**
```
"Should I store agent metrics in a separate database table 
or calculate them on-the-fly from transactions? 
What are the trade-offs?"
```

**Poor:**
```
"What should I do with agent metrics?"
```

### Describe the Problem

**Good:**
```
"When I upload a CSV with 50,000 records, the browser becomes unresponsive 
for 30 seconds. The validation and parsing complete quickly, but the UI 
freezes when rendering the dashboard. How can I improve this?"
```

**Poor:**
```
"The app is slow."
```

---

## Working with Claude on a Feature

### Phase 1: Planning (Before Coding)

1. **Share Requirements**
   - What should the feature do?
   - Who will use it?
   - What data is needed?
   - What are success criteria?

2. **Get Architectural Advice**
   - Where should the code live?
   - What database changes are needed?
   - How should the API be structured?
   - What are potential challenges?

3. **Discuss Trade-offs**
   - What are different approaches?
   - What are pros and cons?
   - What's the recommended approach?
   - What should we avoid?

### Phase 2: Implementation (During Coding)

1. **Get Code Templates**
   - Ask for boilerplate code
   - Get examples of similar features
   - Ask for best practices
   - Request code snippets

2. **Ask for Clarification**
   - How should this component work?
   - What's the expected data format?
   - How should errors be handled?
   - What testing is needed?

3. **Get Code Review**
   - Share your implementation
   - Ask for feedback
   - Request optimizations
   - Get suggestions for improvements

### Phase 3: Testing (After Coding)

1. **Test Coverage**
   - What test cases are needed?
   - How should edge cases be tested?
   - What's the expected coverage?
   - Are there gaps?

2. **Edge Cases**
   - What could go wrong?
   - How should errors be handled?
   - What about boundary conditions?
   - What about performance?

3. **Documentation**
   - How should this be documented?
   - What examples are helpful?
   - What should be in comments?
   - What should be in README?

---

## Project Conventions

### File Naming

- **Components:** PascalCase (e.g., `WinnersPodium.tsx`)
- **Utilities:** camelCase (e.g., `csvParser.ts`)
- **Types:** PascalCase (e.g., `DotloopRecord`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier (run `pnpm format`)
- **Linting:** ESLint via TypeScript
- **Line Length:** 100 characters (soft limit)

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types (if any)
interface Props {
  title: string;
  onSubmit: (data: Data) => void;
}

// 3. Component
export function MyComponent({ title, onSubmit }: Props) {
  const [state, setState] = useState('');
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API Procedure Structure

```typescript
// server/routers.ts
export const featureRouter = router({
  list: protectedProcedure
    .query(({ ctx }) => {
      return db.getFeatures(ctx.user.id);
    }),
  
  create: protectedProcedure
    .input(z.object({ /* validation */ }))
    .mutation(({ input, ctx }) => {
      return db.createFeature(input, ctx.user.id);
    }),
});
```

### Testing Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = process(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

---

## Key Metrics & Goals

### Code Quality
- **Test Coverage:** 75%+ on critical paths
- **TypeScript:** Strict mode, no `any` types
- **Bundle Size:** < 500KB gzipped
- **Performance:** < 3s initial load

### Development
- **PR Size:** 100-800 lines
- **Review Time:** < 24 hours
- **Merge Frequency:** Multiple times per week
- **Build Time:** < 1 minute

### User Experience
- **Mobile Support:** Fully responsive
- **Dark Mode:** Full support
- **Accessibility:** WCAG 2.1 AA compliant
- **Performance:** 90+ Lighthouse score

---

## Common Patterns

### Using tRPC

```typescript
// Backend: Define procedure
export const appRouter = router({
  uploads: {
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUploads(ctx.user.id);
    }),
  },
});

// Frontend: Call with full type safety
const { data: uploads } = trpc.uploads.list.useQuery();
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {/* 1 col on mobile, 2 on tablet, 3 on desktop, 4 on large desktop */}
</div>
```

### Dark Mode

```typescript
// Tailwind dark mode classes
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  {/* Automatically switches based on theme */}
</div>
```

### Error Handling

```typescript
// Frontend
const { mutate } = trpc.uploads.create.useMutation({
  onError: (error) => {
    toast.error(error.message || 'Operation failed');
  },
});

// Backend
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Invalid input',
});
```

---

## Getting Help

### If You Get Stuck

1. **Check the Documentation**
   - Read relevant guide files
   - Check CLAUDE_CODE_GUIDE.md for similar code
   - Look at existing implementations

2. **Search the Codebase**
   - Find similar features
   - Look at how they're implemented
   - Copy and adapt patterns

3. **Ask Claude**
   - Share the code you're working on
   - Describe what you're trying to do
   - Ask for specific help
   - Provide error messages

4. **Check Tests**
   - Look at test files for examples
   - Understand expected behavior
   - See how to test your code

---

## Next Steps

1. **Read the Documentation**
   - Start with README.md
   - Then read CLAUDE_CODE_GUIDE.md
   - Review DESIGN_DECISIONS.md

2. **Explore the Codebase**
   - Look at Home.tsx (main dashboard)
   - Review routers.ts (API structure)
   - Check schema.ts (database design)

3. **Run the Project Locally**
   - Follow DEVELOPMENT_WORKFLOW.md
   - Get the dev server running
   - Explore the UI

4. **Start Contributing**
   - Pick a small task
   - Create a feature branch
   - Implement the feature
   - Submit a pull request

---

## Quick Reference

### Essential Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm test               # Run tests
pnpm check              # Type check
pnpm format             # Format code
pnpm build              # Build for production

# Database
pnpm db:push            # Apply migrations
pnpm seed               # Seed sample data

# Git
git checkout -b feature/name    # Create branch
git commit -m "feat: description"   # Commit
git push origin feature/name    # Push
```

### Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/Home.tsx` | Main dashboard |
| `server/routers.ts` | API procedures |
| `drizzle/schema.ts` | Database schema |
| `client/src/lib/csvParser.ts` | CSV parsing |
| `client/src/components/WinnersPodium.tsx` | Agent leaderboard |

### Important URLs

- **Repository:** https://github.com/your-org/dotloop-reporter
- **Live Site:** https://dotlooproport.com
- **Documentation:** See files in project root
- **Issues:** https://github.com/your-org/dotloop-reporter/issues

---

## Final Notes

### Philosophy

This project values:
- **Type Safety:** TypeScript everywhere
- **Testing:** Good test coverage
- **Documentation:** Clear and comprehensive
- **User Experience:** Responsive and accessible
- **Code Quality:** Clean, maintainable code
- **Performance:** Fast and efficient

### Success Criteria

You're doing well if:
- ✅ Tests pass locally before pushing
- ✅ Code is formatted and type-checked
- ✅ PRs are reviewed within 24 hours
- ✅ Documentation is updated
- ✅ Features work on mobile and desktop
- ✅ Dark mode is supported

### Asking for Help

Don't hesitate to ask Claude for help with:
- Understanding how something works
- Debugging issues
- Improving code quality
- Planning new features
- Writing tests
- Updating documentation

Claude is here to help you succeed!

---

**Last Updated:** January 27, 2026  
**For:** Claude AI Collaboration

**Questions?** Check the relevant guide file or ask Claude directly!
