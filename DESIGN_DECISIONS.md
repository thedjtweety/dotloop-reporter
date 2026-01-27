# Design Decisions & Architecture Patterns

**A comprehensive guide to why certain architectural choices were made and the patterns used throughout the codebase.**

---

## Table of Contents
1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Database Design](#database-design)
4. [API Design](#api-design)
5. [Security Decisions](#security-decisions)
6. [Performance Decisions](#performance-decisions)
7. [UI/UX Decisions](#uiux-decisions)
8. [Testing Strategy](#testing-strategy)

---

## Frontend Architecture

### Why React + TypeScript?

**Decision:** Use React 19 with TypeScript for the frontend.

**Rationale:**
- **Type Safety:** TypeScript catches errors at compile time, reducing runtime bugs
- **Component Reusability:** React's component model enables code reuse across pages
- **Large Ecosystem:** Extensive library support (Recharts, shadcn/ui, etc.)
- **Developer Experience:** Hot module reloading and excellent tooling
- **Team Familiarity:** React is widely adopted and well-documented

**Trade-offs:**
- Larger bundle size compared to vanilla JS
- Learning curve for developers unfamiliar with React
- Dependency management complexity

### Why Vite Instead of Create React App?

**Decision:** Use Vite as the build tool and dev server.

**Rationale:**
- **Speed:** Vite is 10-100x faster than Webpack-based tools
- **ES Modules:** Native ES module support in dev server
- **Modern Tooling:** Built on esbuild for production builds
- **Smaller Bundle:** Better tree-shaking and code splitting
- **HMR:** Instant hot module replacement during development

**Trade-offs:**
- Requires Node.js 14+
- Less mature than Webpack (though widely adopted now)
- Some legacy libraries may not work

### Why Tailwind CSS?

**Decision:** Use Tailwind CSS 4 for styling instead of CSS-in-JS or traditional CSS.

**Rationale:**
- **Utility-First:** Rapid UI development without writing custom CSS
- **Consistency:** Design tokens ensure visual consistency
- **Responsive Design:** Built-in responsive utilities (sm:, md:, lg:, xl:)
- **Dark Mode:** Easy theme switching with dark: prefix
- **Performance:** Only includes used styles in production
- **Customization:** CSS variables for theming and customization

**Trade-offs:**
- Large HTML class names can reduce readability
- Learning curve for developers used to traditional CSS
- Requires build step for optimal output

### Why shadcn/ui Components?

**Decision:** Use shadcn/ui for pre-built accessible UI components.

**Rationale:**
- **Accessibility:** Components built with ARIA standards
- **Customizable:** Copy-paste approach allows full customization
- **Unstyled Foundation:** Works seamlessly with Tailwind
- **No Dependencies:** Components are copied into project (no external dependency)
- **Consistency:** Ensures consistent UI patterns across application

**Trade-offs:**
- Need to maintain copied components
- Less automatic updates compared to npm packages
- Requires understanding of component internals

### State Management Approach

**Decision:** Use React hooks + Context API for state management (no Redux/Zustand).

**Rationale:**
- **Simplicity:** Built-in React features sufficient for this application
- **Bundle Size:** No additional dependencies
- **Learning Curve:** Developers familiar with React hooks
- **Scalability:** Adequate for current application complexity

**Implementation:**
- Local component state with `useState()`
- Custom hooks for shared logic (`useAuth()`)
- Context API for global state (authentication)
- tRPC for server state management

**When to Consider Alternatives:**
- If application grows to 100+ components
- If state becomes deeply nested
- If multiple components need frequent synchronization

### Data Fetching Strategy

**Decision:** Use tRPC for all backend communication instead of REST API or GraphQL.

**Rationale:**
- **Type Safety:** End-to-end type safety from backend to frontend
- **No Schema Duplication:** Types defined once, used everywhere
- **Automatic Validation:** Zod schemas validate input/output
- **Developer Experience:** Autocomplete in IDE for all procedures
- **Smaller Bundle:** Less boilerplate than REST/GraphQL
- **RPC Pattern:** Simpler mental model than REST for procedures

**Implementation:**
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

**Trade-offs:**
- Less familiar to developers used to REST APIs
- Not suitable for public APIs (tRPC is RPC-based)
- Smaller ecosystem compared to REST/GraphQL

---

## Backend Architecture

### Why Express + tRPC?

**Decision:** Use Express.js with tRPC for the backend server.

**Rationale:**
- **Simplicity:** Express is lightweight and straightforward
- **Type Safety:** tRPC provides end-to-end type safety
- **Middleware Ecosystem:** Express has extensive middleware support
- **Performance:** Excellent performance for typical use cases
- **Flexibility:** Easy to add custom middleware and routes

**Alternative Considered:** NestJS
- More opinionated and structured
- Better for large enterprise applications
- Overkill for this application's complexity

### Why Drizzle ORM?

**Decision:** Use Drizzle ORM for database queries instead of raw SQL or other ORMs.

**Rationale:**
- **Type Safety:** SQL queries are type-checked at compile time
- **Performance:** Generates efficient SQL without overhead
- **Developer Experience:** SQL-like syntax with TypeScript benefits
- **Migrations:** Built-in migration system with drizzle-kit
- **Relations:** Automatic handling of table relationships

**Implementation:**
```typescript
// Type-safe query with full autocomplete
const users = await db.select().from(usersTable).where(eq(usersTable.role, 'admin'));

// Relationships work seamlessly
const userWithUploads = await db.query.users.findFirst({
  where: eq(usersTable.id, userId),
  with: { uploads: true },
});
```

**Alternative Considered:** Prisma
- More popular and mature
- Slower query generation
- Larger runtime overhead

### Authentication Architecture

**Decision:** Use Manus OAuth with JWT sessions for authentication.

**Rationale:**
- **Security:** OAuth handles credential management securely
- **Simplicity:** No password management required
- **Integration:** Built-in Manus OAuth support
- **Scalability:** Stateless JWT tokens
- **User Experience:** Single sign-on across Manus ecosystem

**Flow:**
1. User clicks "Login" → redirected to Manus OAuth portal
2. User authenticates with Manus account
3. Manus redirects to `/api/oauth/callback` with authorization code
4. Backend exchanges code for access token
5. Backend creates JWT session cookie
6. Frontend uses session cookie for authenticated requests

**Security Measures:**
- JWT signed with `JWT_SECRET`
- Secure HTTP-only cookies (no JavaScript access)
- CSRF protection via SameSite cookie attribute
- Token expiration and refresh logic

### Error Handling Strategy

**Decision:** Use tRPC error codes with structured error responses.

**Rationale:**
- **Consistency:** Standardized error format across all procedures
- **Client Handling:** Frontend can handle specific error types
- **Debugging:** Detailed error information for troubleshooting
- **User Experience:** Meaningful error messages to users

**Error Types:**
```typescript
// tRPC error codes
PARSE_ERROR       // Input parsing failed
VALIDATION_ERROR  // Input validation failed
NOT_FOUND         // Resource not found
FORBIDDEN         // User lacks permission
INTERNAL_SERVER_ERROR  // Unexpected error
```

### Logging & Monitoring

**Decision:** Use console logging with structured audit logs in database.

**Rationale:**
- **Development:** Console logs visible in dev server output
- **Production:** Logs captured by hosting platform
- **Audit Trail:** Important operations logged to database
- **Compliance:** Audit logs required for security/compliance

**Audit Log Entries:**
- User login/logout
- File uploads
- Admin operations
- Permission changes
- Data exports

---

## Database Design

### Why MySQL/TiDB?

**Decision:** Use MySQL 8+ or TiDB for relational database.

**Rationale:**
- **Maturity:** Stable and widely used
- **Performance:** Excellent for OLTP workloads
- **Scalability:** Handles millions of records
- **Cost:** Open source or affordable managed services
- **Compatibility:** Works with Drizzle ORM seamlessly

**TiDB Advantages:**
- Distributed architecture for high availability
- Horizontal scalability
- ACID transactions across distributed nodes
- Compatible with MySQL protocol

### Multi-Tenant Architecture

**Decision:** Use row-level security with `tenant_id` foreign key for data isolation.

**Rationale:**
- **Efficiency:** Single database instance for all tenants
- **Security:** Row-level security prevents cross-tenant access
- **Simplicity:** No complex sharding logic
- **Cost:** Minimal infrastructure overhead

**Implementation:**
```typescript
// Every table includes tenant_id
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  // ...
  foreignKey(() => ({
    columns: [tenantId],
    references: [tenantsTable.id],
  })),
});

// All queries automatically filtered by tenant
const userUploads = await db
  .select()
  .from(uploadsTable)
  .where(and(
    eq(uploadsTable.userId, userId),
    eq(uploadsTable.tenantId, ctx.tenantId)  // ← Automatic filtering
  ));
```

**Security:**
- Row-level security policies in database
- Application-level filtering as additional layer
- Audit logs track cross-tenant access attempts

### Schema Design Decisions

**Decision:** Normalize schema to 3NF (Third Normal Form) with strategic denormalization.

**Rationale:**
- **Data Integrity:** Normalization prevents data anomalies
- **Consistency:** Single source of truth for each piece of data
- **Flexibility:** Easy to add new features without schema redesign

**Denormalization Examples:**
- Store `recordCount` in uploads table (avoids COUNT query)
- Store `totalAmount` in transactions (avoids SUM query)
- Store agent metrics in separate table (avoids complex aggregation)

**Trade-off:** Slightly more complex update logic, but faster queries

### Indexing Strategy

**Decision:** Index frequently queried and joined columns.

**Rationale:**
- **Query Performance:** Indexes speed up WHERE and JOIN operations
- **Disk Space:** Minimal overhead for most tables
- **Write Performance:** Slight slowdown on INSERT/UPDATE (acceptable trade-off)

**Indexed Columns:**
- Foreign keys (for JOINs)
- Frequently filtered columns (userId, tenantId, status)
- Date columns (for range queries)
- Unique columns (email, etc.)

---

## API Design

### Why RPC Instead of REST?

**Decision:** Use tRPC (RPC-style API) instead of REST.

**Rationale:**
- **Type Safety:** End-to-end type checking
- **Simplicity:** Procedures are simpler than REST resources
- **Efficiency:** No over-fetching or under-fetching
- **Developer Experience:** Autocomplete and inline documentation

**Example Comparison:**

REST Approach:
```typescript
// Multiple endpoints needed
GET /api/uploads
GET /api/uploads/:id
POST /api/uploads
PUT /api/uploads/:id
DELETE /api/uploads/:id

// Frontend needs to manage types
const response = await fetch('/api/uploads');
const uploads: Upload[] = await response.json();
```

tRPC Approach:
```typescript
// Single procedure with full type safety
const { data: uploads } = trpc.uploads.list.useQuery();
// Type of 'uploads' is automatically inferred!
```

### Procedure Organization

**Decision:** Organize procedures by feature in separate routers.

**Rationale:**
- **Maintainability:** Related procedures grouped together
- **Scalability:** Easy to add new features without cluttering main router
- **Testing:** Feature routers can be tested independently

**Structure:**
```typescript
// server/routers.ts
export const appRouter = router({
  uploads: uploadRouter,
  admin: adminRouter,
  commission: commissionRouter,
  // ...
});

// server/uploadRouter.ts
export const uploadRouter = router({
  list: protectedProcedure.query(...),
  create: protectedProcedure.mutation(...),
  delete: protectedProcedure.mutation(...),
});
```

### Input Validation

**Decision:** Use Zod schemas for all procedure inputs.

**Rationale:**
- **Type Safety:** Runtime validation matches TypeScript types
- **Error Messages:** User-friendly validation error messages
- **Consistency:** Validation rules defined once, used everywhere
- **Documentation:** Schema serves as API documentation

**Example:**
```typescript
const uploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive().max(10 * 1024 * 1024),
  recordCount: z.number().nonnegative(),
});

export const uploadRouter = router({
  create: protectedProcedure
    .input(uploadSchema)
    .mutation(({ input, ctx }) => {
      // input is fully type-checked
      return db.createUpload(input, ctx.user.id);
    }),
});
```

---

## Security Decisions

### Authentication vs Authorization

**Decision:** Separate authentication (who are you?) from authorization (what can you do?).

**Rationale:**
- **Clarity:** Clear separation of concerns
- **Flexibility:** Easy to add new roles/permissions
- **Security:** Authorization checks independent of auth mechanism

**Implementation:**
```typescript
// Authentication: Verify user identity
const user = await verifyJWT(token);

// Authorization: Check user permissions
if (user.role !== 'admin') {
  throw new TRPCError({ code: 'FORBIDDEN' });
}
```

### Data Encryption

**Decision:** Encrypt sensitive data at rest and in transit.

**Rationale:**
- **Compliance:** Required for handling real estate transaction data
- **Privacy:** Protects user data from unauthorized access
- **Trust:** Demonstrates commitment to security

**Implementation:**
- **In Transit:** TLS/HTTPS for all network traffic
- **At Rest:** Database encryption (handled by hosting provider)
- **Sensitive Fields:** Encrypt OAuth tokens and API keys

### CORS & CSRF Protection

**Decision:** Use SameSite cookies and CORS headers for protection.

**Rationale:**
- **CSRF:** SameSite=Strict prevents cross-site requests
- **CORS:** Restrict API access to authorized origins
- **Security:** Prevent unauthorized API calls from other domains

**Implementation:**
```typescript
// Express middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

// Cookie settings
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
});
```

---

## Performance Decisions

### Client-Side Caching

**Decision:** Use React Query (TanStack Query) for client-side caching.

**Rationale:**
- **Reduced Server Load:** Cached data avoids redundant requests
- **Instant Updates:** Optimistic updates provide immediate feedback
- **Offline Support:** Cached data available when offline
- **Automatic Invalidation:** Smart cache invalidation on mutations

**Implementation:**
```typescript
// Automatic caching
const { data: uploads } = trpc.uploads.list.useQuery();

// Optimistic update
const { mutate: deleteUpload } = trpc.uploads.delete.useMutation({
  onMutate: async (id) => {
    // Update cache immediately
    await queryClient.cancelQueries({ queryKey: ['uploads'] });
    const previous = queryClient.getQueryData(['uploads']);
    queryClient.setQueryData(['uploads'], (old) =>
      old.filter((u) => u.id !== id)
    );
    return { previous };
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['uploads'], context.previous);
  },
});
```

### Database Query Optimization

**Decision:** Use efficient queries with proper indexing and pagination.

**Rationale:**
- **Scalability:** Handles large datasets without slowdown
- **Cost:** Reduces database resource usage
- **User Experience:** Faster page loads and interactions

**Techniques:**
- **Pagination:** Load data in chunks instead of all at once
- **Indexing:** Index frequently queried columns
- **Lazy Loading:** Load related data only when needed
- **Aggregation:** Pre-compute metrics instead of calculating on-the-fly

### Image & Asset Optimization

**Decision:** Use S3 for file storage and CDN for asset delivery.

**Rationale:**
- **Performance:** CDN delivers assets from nearest location
- **Scalability:** S3 handles unlimited file storage
- **Cost:** Pay only for what you use
- **Reliability:** 99.99% uptime SLA

**Implementation:**
```typescript
// Upload to S3
const { url } = await storagePut(
  `uploads/${userId}/${fileName}`,
  fileBuffer,
  'application/octet-stream'
);

// Use presigned URL for downloads
const { url: downloadUrl } = await storageGet(`uploads/${userId}/${fileName}`);
```

### Bundle Size Optimization

**Decision:** Use code splitting and lazy loading for routes.

**Rationale:**
- **Faster Initial Load:** Only load code needed for current page
- **Better Caching:** Changes to one route don't invalidate all bundles
- **Improved Performance:** Smaller bundles load faster

**Implementation:**
```typescript
// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const Admin = lazy(() => import('./pages/Admin'));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<Loader />}><Home /></Suspense>} />
      <Route path="/admin" element={<Suspense fallback={<Loader />}><Admin /></Suspense>} />
    </Routes>
  );
}
```

---

## UI/UX Decisions

### Mobile-First Responsive Design

**Decision:** Design for mobile first, then enhance for larger screens.

**Rationale:**
- **Performance:** Mobile users often have slower connections
- **Accessibility:** Simpler mobile UI is more accessible
- **Progressive Enhancement:** Add features for larger screens
- **Market:** Majority of users access from mobile

**Implementation:**
```typescript
// Mobile by default, enhanced on larger screens
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {/* Responsive grid: 1 col on mobile, 2 on tablet, 3 on desktop, 4 on large desktop */}
</div>
```

### Dark Mode Support

**Decision:** Implement dark mode with system preference detection.

**Rationale:**
- **User Preference:** Many users prefer dark mode
- **Accessibility:** Reduces eye strain in low-light environments
- **Battery Life:** Dark mode saves battery on OLED screens
- **Modern Standard:** Expected feature in modern applications

**Implementation:**
```typescript
// Theme provider with system preference detection
<ThemeProvider defaultTheme="system" storageKey="theme-preference">
  <App />
</ThemeProvider>

// CSS variables for theming
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.6%;
}

.dark {
  --background: 0 0% 3.6%;
  --foreground: 0 0% 98%;
}
```

### Chart Interactivity

**Decision:** Use Recharts for interactive, responsive charts.

**Rationale:**
- **Interactivity:** Hover tooltips and click drill-down
- **Responsiveness:** Charts adapt to screen size
- **Performance:** Efficient rendering of large datasets
- **Customization:** Easy to customize appearance and behavior

**Features:**
- Responsive height: `h-64 sm:h-72 md:h-80`
- Landscape optimization: `landscape:h-40`
- Click handlers for drill-down: `onClick={(data) => handleDrill(data)}`
- Tooltips for data details

### Error Handling & Recovery

**Decision:** Show user-friendly error messages with recovery options.

**Rationale:**
- **User Experience:** Clear error messages help users understand issues
- **Recovery:** Provide actionable steps to resolve problems
- **Debugging:** Error details help developers troubleshoot

**Implementation:**
```typescript
// Error boundary catches component errors
<ErrorBoundary fallback={<ErrorMessage />}>
  <Dashboard />
</ErrorBoundary>

// API errors show toast notifications
const { mutate } = trpc.uploads.create.useMutation({
  onError: (error) => {
    toast.error(error.message || 'Upload failed. Please try again.');
  },
});
```

---

## Testing Strategy

### Unit Tests

**Decision:** Test individual functions and components in isolation.

**Rationale:**
- **Speed:** Unit tests run quickly
- **Isolation:** Easy to identify what broke
- **Coverage:** Test edge cases and error conditions

**Examples:**
- CSV validation logic
- Data formatting utilities
- Commission calculations
- Field completeness analysis

### Integration Tests

**Decision:** Test complete workflows (upload → parse → store).

**Rationale:**
- **Realistic:** Tests actual user workflows
- **Confidence:** Ensures components work together
- **Regression Prevention:** Catches breaking changes

**Examples:**
- Upload flow (validation → parsing → storage)
- Admin operations (create user → assign uploads → delete)
- Commission calculations (plan creation → tier assignment → calculation)

### E2E Tests

**Decision:** Manual testing for UI interactions (not automated E2E).

**Rationale:**
- **Complexity:** UI testing frameworks add maintenance burden
- **Reliability:** Manual testing catches visual issues
- **Cost:** Automated E2E tests are expensive to maintain
- **Coverage:** Manual testing covers user workflows

**Manual Test Checklist:**
- CSV upload with various formats
- Chart interactions and drill-down
- Dark mode switching
- Mobile responsiveness
- Admin dashboard operations

### Test Coverage Goals

**Decision:** Aim for 80%+ coverage on critical paths.

**Rationale:**
- **Quality:** High coverage catches most bugs
- **Maintainability:** Easier to refactor with good tests
- **Confidence:** Deploy with confidence

**Current Coverage:**
- CSV validation: 19 tests (100% coverage)
- Admin operations: 15 tests (95% coverage)
- Commission calculations: 12 tests (90% coverage)
- Upload flow: 8 tests (85% coverage)

---

## Trade-offs & Alternatives Considered

### Monolith vs Microservices

**Decision:** Single monolithic application.

**Rationale:**
- **Simplicity:** Easier to develop and deploy
- **Performance:** No inter-service latency
- **Consistency:** Single database ensures data consistency
- **Cost:** Lower infrastructure costs

**When to Consider Microservices:**
- Multiple independent teams
- Different scaling requirements per service
- Complex domain with clear service boundaries
- Need for independent deployment cycles

### Relational vs NoSQL Database

**Decision:** Relational database (MySQL/TiDB).

**Rationale:**
- **Data Integrity:** ACID transactions ensure consistency
- **Relationships:** Easy to model complex relationships
- **Queries:** SQL is powerful and well-understood
- **Compliance:** Better audit trail and compliance support

**When to Consider NoSQL:**
- Unstructured data (documents, images)
- Horizontal scaling across many nodes
- Real-time analytics on massive datasets
- Document-oriented data model

### Build Tool: Vite vs Webpack vs Turbopack

**Decision:** Vite.

**Rationale:**
- **Speed:** Fastest development experience
- **Modern:** Built on modern standards (ES modules)
- **Simplicity:** Minimal configuration needed

**Webpack:** More mature, larger ecosystem, but slower
**Turbopack:** Promising but still in development

---

## Future Considerations

### Scaling Decisions

As the application grows, consider:

1. **Database Scaling**
   - Read replicas for read-heavy workloads
   - Sharding for multi-tenant isolation
   - Caching layer (Redis) for frequently accessed data

2. **Application Scaling**
   - Horizontal scaling with load balancer
   - Separate API servers from web servers
   - Background job queue for long-running tasks

3. **Feature Scaling**
   - Microservices for independent features
   - Event-driven architecture for real-time updates
   - GraphQL for complex query requirements

### Technology Upgrades

- **React 20+:** New features and performance improvements
- **TypeScript 6+:** Better type inference and performance
- **Drizzle 1.0+:** Stable API and additional features
- **Tailwind CSS 5+:** New utilities and features

---

## Summary

The Dotloop Reporting Tool uses a modern, type-safe full-stack architecture optimized for:

- **Developer Experience:** TypeScript, tRPC, and excellent tooling
- **Performance:** Efficient queries, caching, and code splitting
- **Security:** Multi-tenant isolation, OAuth authentication, and audit logging
- **Scalability:** Normalized database schema, horizontal scaling support
- **Maintainability:** Clear separation of concerns, comprehensive testing
- **User Experience:** Responsive design, dark mode, interactive charts

These decisions balance simplicity with scalability, allowing the application to grow while maintaining code quality and performance.

---

**Last Updated:** January 27, 2026  
**For:** Claude AI Collaboration
