# Dotloop Reporting Tool

**A comprehensive web-based reporting and analytics platform for Dotloop real estate transaction data.**

## Quick Overview

The Dotloop Reporting Tool is a full-stack React + Express application that allows real estate brokerages to upload CSV exports from Dotloop, visualize transaction data through interactive dashboards, perform drill-down analysis, and manage agent performance metrics. The application features responsive design, mobile optimization, and comprehensive data validation.

**Live Site:** [dotlooproport.com](https://dotlooproport.com)

**Current Status:** Production-ready with multi-tenant architecture support

---

## Key Features

### 📊 Data Visualization
- **Interactive Dashboards** – Pipeline analysis, financial summaries, and transaction metrics
- **10+ Chart Types** – Pipeline, revenue distribution, agent performance, geographic analysis, and more
- **Responsive Charts** – Mobile-optimized with landscape orientation support
- **Real-time Updates** – Instant metric recalculation on date range changes

### 💰 Financial Analytics
- **Commission Calculations** – Automatic commission computation with configurable tier structures
- **Revenue Tracking** – Sales volume, average price, and financial metrics
- **Agent Performance** – Leaderboards with deals closed, revenue, and performance trends
- **Audit Reports** – Commission variance analysis and transaction validation

### 📱 Mobile & Accessibility
- **Responsive Design** – Works seamlessly on mobile, tablet, and desktop
- **Landscape Orientation** – Optimized for rotated mobile devices
- **Touch-Friendly UI** – 44px+ minimum touch targets
- **Dark Mode Support** – Theme switching with persistent preferences

### 🔐 Data Management
- **CSV Upload** – Support for multiple Dotloop export formats
- **Field Mapping** – Intelligent field detection with manual override capability
- **Data Validation** – File size limits (10MB), structure validation, and error recovery
- **Upload History** – Persistent storage and quick access to recent uploads

### 👥 Multi-Tenant Architecture
- **Tenant Isolation** – Complete data separation between brokerages
- **Admin Dashboard** – User management and upload monitoring
- **OAuth Integration** – Manus OAuth for authentication
- **Role-Based Access** – Admin and user roles with appropriate permissions

---

## Tech Stack

### Frontend
- **React 19** – UI framework with hooks and concurrent features
- **TypeScript** – Type-safe development
- **Tailwind CSS 4** – Utility-first styling with responsive design
- **Recharts** – Data visualization library
- **Vite** – Fast build tool and dev server
- **shadcn/ui** – Pre-built accessible components

### Backend
- **Express 4** – HTTP server framework
- **tRPC 11** – Type-safe RPC framework
- **Drizzle ORM** – Type-safe database queries
- **MySQL/TiDB** – Relational database

### Testing & Quality
- **Vitest** – Unit testing framework
- **TypeScript** – Static type checking
- **Prettier** – Code formatting
- **ESLint** – Code linting (via TypeScript)

### Deployment
- **Manus Hosting** – Built-in hosting with custom domain support
- **GitHub Integration** – Automatic syncing and version control

---

## Project Structure

```
dotloop-reporter/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── pages/                   # Page-level components
│   │   │   └── Home.tsx             # Main dashboard and upload
│   │   ├── components/              # Reusable UI components
│   │   │   ├── charts/              # Chart components (10+)
│   │   │   ├── WinnersPodium.tsx    # Agent leaderboard
│   │   │   ├── DrillDownModal.tsx   # Transaction drill-down
│   │   │   ├── DataHealthCheck.tsx  # Data quality monitoring
│   │   │   ├── UploadZone.tsx       # CSV upload component
│   │   │   └── ...                  # 50+ other components
│   │   ├── lib/                     # Utility functions
│   │   │   ├── csvParser.ts         # CSV parsing logic
│   │   │   ├── formatUtils.ts       # Formatting utilities
│   │   │   └── ...
│   │   ├── _core/hooks/             # Custom React hooks
│   │   │   └── useAuth.ts           # Authentication hook
│   │   ├── App.tsx                  # Route definitions
│   │   ├── main.tsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── index.html                   # HTML template
│   └── public/                      # Static assets
│
├── server/                          # Backend Express application
│   ├── routers.ts                   # Main tRPC router
│   ├── db.ts                        # Database query helpers
│   ├── storage.ts                   # S3 file storage
│   ├── adminRouter.ts               # Admin-only procedures
│   ├── commissionRouter.ts          # Commission calculations
│   ├── uploadDb.ts                  # Upload data management
│   ├── _core/                       # Framework internals
│   │   ├── context.ts               # Request context setup
│   │   ├── auth.ts                  # Authentication logic
│   │   ├── oauth.ts                 # OAuth flow
│   │   └── ...
│   └── __tests__/                   # Server tests
│
├── drizzle/                         # Database schema and migrations
│   ├── schema.ts                    # Table definitions
│   ├── relations.ts                 # Relationship definitions
│   └── migrations/                  # SQL migration files
│
├── shared/                          # Shared types and constants
│   ├── types.ts                     # Shared TypeScript types
│   └── const.ts                     # Shared constants
│
├── docs/                            # Documentation
│   ├── ARCHITECTURE.md              # System architecture
│   ├── SECURITY.md                  # Security guidelines
│   └── ...                          # Other docs
│
├── scripts/                         # Utility scripts
│   ├── seed-sample-data.mjs         # Database seeding
│   └── ...
│
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── drizzle.config.ts                # Drizzle configuration
└── vitest.config.ts                 # Vitest configuration
```

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and **pnpm** 10+
- **MySQL** 8+ or **TiDB** database
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dotloop-reporter.git
cd dotloop-reporter

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

Required environment variables (see `.env.example`):

```
# Database
DATABASE_URL=mysql://user:password@localhost:3306/dotloop_reporter

# Authentication
JWT_SECRET=your-secret-key
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Dotloop OAuth (optional)
DOTLOOP_CLIENT_ID=your-dotloop-client-id
DOTLOOP_CLIENT_SECRET=your-dotloop-client-secret
DOTLOOP_REDIRECT_URI=https://yourdomain.com/api/oauth/dotloop/callback

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test -- csvValidator.test.ts
```

### Database Migrations

```bash
# Generate and apply migrations
pnpm db:push

# View migration status
drizzle-kit status

# Seed sample data
pnpm seed
```

### Building for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

### Code Quality

```bash
# Format code
pnpm format

# Type check
pnpm check
```

---

## Key Components & Features

### CSV Upload & Validation
- **File:** `client/src/components/UploadZone.tsx`
- **Validation:** `server/csvValidator.test.ts`, `client/src/utils/csvValidation.ts`
- **Features:** File size limits (10MB), format validation, structure checking
- **Test Coverage:** 19 passing tests covering edge cases

### Data Visualization
- **Charts:** `client/src/components/charts/` (10+ chart types)
- **Drill-Down:** `client/src/components/DrillDownModal.tsx`
- **Responsive:** Mobile and landscape orientation optimized

### Agent Performance
- **Leaderboard:** `client/src/components/WinnersPodium.tsx`
- **Metrics:** Revenue, deals closed, performance trends
- **Gamification:** Medal badges, animations, responsive design

### Data Health Monitoring
- **Component:** `client/src/components/DataHealthCheck.tsx`
- **Features:** Field completeness analysis, quality indicators
- **Test Coverage:** 6 passing tests

### Admin Dashboard
- **Router:** `server/adminRouter.ts`
- **Features:** User management, upload monitoring, performance metrics
- **Test Coverage:** 15 passing tests

---

## API Structure (tRPC)

The application uses **tRPC** for type-safe API calls. All procedures are defined in `server/routers.ts` and consumed via React hooks.

### Example Procedure

```typescript
// server/routers.ts
export const appRouter = router({
  uploads: {
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUploads(ctx.user.id);
    }),
  },
});

// client/src/pages/Home.tsx
const { data: uploads } = trpc.uploads.list.useQuery();
```

### Authentication

- **Public Procedures:** `publicProcedure` – No authentication required
- **Protected Procedures:** `protectedProcedure` – Requires valid session
- **Admin Procedures:** `adminProcedure` – Requires admin role

---

## Database Schema

### Core Tables
- **users** – User accounts with roles (admin/user)
- **uploads** – CSV upload records with metadata
- **transactions** – Parsed transaction data from uploads
- **tenants** – Multi-tenant brokerage information
- **commission_plans** – Configurable commission tier structures
- **audit_logs** – System activity tracking

See `drizzle/schema.ts` for complete schema definition.

---

## Testing Strategy

### Unit Tests
- CSV validation and parsing logic
- Commission calculations
- Data transformations
- Utility functions

### Integration Tests
- Upload flow (validation → parsing → storage)
- Admin operations
- Database queries

### Manual Testing
- UI responsiveness on mobile/tablet/desktop
- Dark mode theme switching
- Chart interactions and drill-down
- Upload with various CSV formats

---

## Common Tasks

### Adding a New Chart
1. Create component in `client/src/components/charts/ChartName.tsx`
2. Add responsive height classes (h-64 sm:h-72 md:h-80)
3. Import and use in dashboard
4. Add drill-down handler if needed

### Adding a New API Endpoint
1. Define procedure in `server/routers.ts`
2. Add database helper in `server/db.ts` if needed
3. Add tests in `server/__tests__/`
4. Call from frontend via `trpc.*.useQuery/useMutation()`

### Adding a Database Table
1. Define table in `drizzle/schema.ts`
2. Run `pnpm db:push` to generate migration
3. Create query helpers in `server/db.ts`
4. Add tRPC procedures in `server/routers.ts`

### Deploying to Production
1. Create checkpoint via Manus Management UI
2. Click "Publish" button in Management UI
3. Configure custom domain in Settings → Domains
4. Monitor via Dashboard panel

---

## Performance Considerations

### Frontend
- **Code Splitting:** Routes are lazy-loaded via Vite
- **Image Optimization:** Use responsive images with srcset
- **Chart Optimization:** Recharts handles large datasets efficiently
- **Mobile:** Responsive design reduces unnecessary rendering

### Backend
- **Database Indexing:** Key columns indexed for fast queries
- **Query Optimization:** Drizzle ORM generates efficient SQL
- **Caching:** Session data cached in memory
- **File Upload:** Streaming validation for large files

### Monitoring
- **Performance Dashboard:** `/performance` (admin-only)
- **Metrics Tracked:** File sizes, processing times, success rates
- **Bottleneck Analysis:** Identifies slowest processing stages

---

## Security

### Data Protection
- **Tenant Isolation:** Row-level security in database
- **Authentication:** Manus OAuth with JWT sessions
- **Authorization:** Role-based access control
- **Encryption:** TLS for all network traffic

### Input Validation
- **File Upload:** Size limits, type checking, structure validation
- **CSV Parsing:** Sanitization of field values
- **API Input:** Zod schema validation on all procedures

### Audit Trail
- **Audit Logs:** All significant operations logged
- **Admin Actions:** User management changes tracked
- **Upload History:** Complete upload metadata retained

See `docs/SECURITY.md` for detailed security guidelines.

---

## Troubleshooting

### Dev Server Issues
```bash
# Clear cache and restart
rm -rf node_modules/.vite
pnpm dev
```

### Database Connection Issues
```bash
# Check connection string in .env.local
# Verify database is running and accessible
# Check MySQL user permissions
```

### Build Errors
```bash
# Clear build cache
rm -rf dist .vite
pnpm build
```

### Test Failures
```bash
# Run tests with verbose output
pnpm test -- --reporter=verbose

# Run specific test
pnpm test -- csvValidator.test.ts
```

---

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow Prettier formatting (run `pnpm format`)
- Write tests for new features
- Keep components under 300 lines

### Git Workflow
1. Create feature branch from `main`
2. Commit changes with descriptive messages
3. Create pull request with summary
4. Ensure all tests pass
5. Merge to `main`

### Documentation
- Update README for user-facing changes
- Add JSDoc comments to complex functions
- Update ARCHITECTURE.md for system changes
- Keep docs in sync with code

---

## Additional Resources

- **Architecture Guide:** `docs/ARCHITECTURE.md`
- **Security Guidelines:** `docs/SECURITY.md`
- **Admin Dashboard Guide:** `Admin_Dashboard_Guide.md`
- **CSV Robustness:** `CSV_ROBUSTNESS_GUIDE.md`
- **Commission Calculations:** `docs/COMMISSION_CALCULATION_GUIDE.md`

---

## Support & Contact

For issues, questions, or feature requests:
1. Check existing documentation in `/docs`
2. Review GitHub issues for similar problems
3. Contact the development team

---

## License

MIT License – See LICENSE file for details

---

**Last Updated:** January 27, 2026  
**Maintained By:** Manus AI
