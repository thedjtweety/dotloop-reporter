# Professional Domain Acquisition & Website Structuring Guide

**Author:** Manus AI  
**Date:** January 12, 2026  
**Version:** 1.0

---

## Executive Summary

This comprehensive guide provides detailed instructions for acquiring a custom domain, configuring DNS records, implementing multi-tenant subdomain routing, and structuring your Dotloop Reporting Tool according to industry best practices. The document covers domain registration, SSL certificate management, SEO optimization, URL architecture, and professional website hierarchy to ensure your application meets enterprise-grade standards.

---

## Table of Contents

1. [Domain Acquisition Strategy](#domain-acquisition-strategy)
2. [DNS Configuration & Setup](#dns-configuration--setup)
3. [Multi-Tenant Subdomain Architecture](#multi-tenant-subdomain-architecture)
4. [SSL Certificate Management](#ssl-certificate-management)
5. [Professional URL Structure](#professional-url-structure)
6. [SEO Optimization Best Practices](#seo-optimization-best-practices)
7. [Website Hierarchy & Navigation](#website-hierarchy--navigation)
8. [Metadata & Open Graph Protocol](#metadata--open-graph-protocol)
9. [Performance & Security Standards](#performance--security-standards)
10. [Implementation Checklist](#implementation-checklist)

---

## 1. Domain Acquisition Strategy

### Choosing the Right Domain Name

When selecting a domain for your Dotloop Reporting Tool, several factors determine its effectiveness for branding, SEO, and user trust. A strong domain name should be memorable, descriptive, and aligned with your business identity.

**Key Considerations:**

The domain name should clearly communicate the purpose of your application while remaining concise and easy to remember. Research shows that shorter domain names (under 15 characters) have higher recall rates and are less prone to typos. Consider including keywords that describe your service, such as "dotloop," "reports," "analytics," or "brokerage," to improve search engine visibility and user understanding.

**Recommended Domain Options:**

| Domain Name | Pros | Cons | Availability Check |
|------------|------|------|-------------------|
| `dotloopreports.com` | Clear purpose, keyword-rich | Slightly long (16 chars) | Check at registrar |
| `loopanalytics.com` | Short, professional | Less specific | Check at registrar |
| `brokerloop.com` | Memorable, brandable | Generic industry term | Check at registrar |
| `dotloopinsights.com` | Descriptive, professional | Longer name | Check at registrar |
| `loopmetrics.com` | Short, modern | May not indicate Dotloop | Check at registrar |

**Top-Level Domain (TLD) Selection:**

The `.com` TLD remains the gold standard for commercial applications, commanding 52% of all registered domains globally and enjoying the highest user trust. However, alternative TLDs can be strategic choices depending on your target market and branding goals.

| TLD | Best For | Trust Level | SEO Impact |
|-----|----------|-------------|------------|
| `.com` | General business, global reach | Highest | Neutral (best) |
| `.io` | Tech startups, SaaS products | High in tech | Neutral |
| `.app` | Web applications, mobile apps | Medium-High | Neutral |
| `.co` | Startups, modern brands | Medium | Neutral |
| `.net` | Network services, alternatives | Medium | Neutral |
| `.biz` | Business services | Low-Medium | Slight negative |

**Where to Purchase:**

Several domain registrars offer competitive pricing and management features. The choice of registrar impacts not only cost but also DNS management capabilities, security features, and customer support quality.

**Recommended Registrars:**

1. **Namecheap** – Offers competitive pricing ($8-15/year for .com), free WHOIS privacy, and excellent DNS management interface. Known for responsive customer support and straightforward domain transfer processes.

2. **Google Domains** (now Squarespace Domains) – Provides clean interface, transparent pricing ($12/year), and seamless integration with Google Cloud services. Includes free privacy protection and email forwarding.

3. **Cloudflare Registrar** – Offers at-cost pricing (no markup), free WHOIS privacy, and integrated CDN services. Requires existing Cloudflare account but provides excellent value for technical users.

4. **Porkbun** – Budget-friendly option ($9-11/year), includes free WHOIS privacy and SSL certificates. Growing reputation for competitive pricing and solid management tools.

**Manus Built-in Domain Purchase:**

Your Manus platform includes integrated domain purchasing directly within the Settings → Domains panel. This streamlined approach allows you to purchase, register, and bind custom domains without leaving the Manus interface. The platform handles DNS configuration automatically and provides one-click domain assignment to your webapp, significantly simplifying the setup process compared to external registrars.

---

## 2. DNS Configuration & Setup

### Understanding DNS Records

The Domain Name System (DNS) translates human-readable domain names into IP addresses that computers use to locate servers. Proper DNS configuration is critical for routing traffic to your application, enabling email services, and implementing security measures.

**Essential DNS Record Types:**

DNS records serve different purposes in directing traffic and configuring services. Understanding each record type ensures proper configuration and troubleshooting capabilities.

| Record Type | Purpose | Example | TTL Recommendation |
|-------------|---------|---------|-------------------|
| **A Record** | Maps domain to IPv4 address | `example.com → 192.0.2.1` | 3600s (1 hour) |
| **AAAA Record** | Maps domain to IPv6 address | `example.com → 2001:db8::1` | 3600s (1 hour) |
| **CNAME Record** | Creates domain alias | `www → example.com` | 3600s (1 hour) |
| **MX Record** | Directs email to mail server | `mail.example.com` priority 10 | 86400s (24 hours) |
| **TXT Record** | Stores text data (SPF, DKIM) | `v=spf1 include:_spf.google.com ~all` | 3600s (1 hour) |
| **NS Record** | Specifies authoritative nameservers | `ns1.cloudflare.com` | 86400s (24 hours) |

### Step-by-Step DNS Configuration

**Step 1: Point Root Domain to Manus**

After purchasing your domain, you need to configure DNS records to point to your Manus-hosted application. The Manus platform provides specific IP addresses or CNAME targets for this purpose.

Navigate to your domain registrar's DNS management panel and create an A record for your root domain. If you're using Manus hosting, the platform will provide the target IP address in the Settings → Domains section. Set the TTL (Time To Live) to 3600 seconds (1 hour) to allow for reasonable propagation time while maintaining flexibility for future changes.

**Example A Record Configuration:**

```
Type: A
Name: @  (or leave blank for root domain)
Value: [Manus-provided IP address]
TTL: 3600
```

**Step 2: Configure WWW Subdomain**

Industry best practice dictates that both `example.com` and `www.example.com` should resolve to your application. This ensures users can access your site regardless of which format they type. Create a CNAME record pointing `www` to your root domain.

```
Type: CNAME
Name: www
Value: example.com  (or Manus-provided CNAME target)
TTL: 3600
```

**Step 3: Set Up Wildcard Subdomain for Multi-Tenancy**

Your multi-tenant architecture requires wildcard subdomain support to allow each brokerage to access their own subdomain (e.g., `acme-realty.example.com`, `sunset-brokers.example.com`). Configure a wildcard A record or CNAME to route all subdomains to your application.

```
Type: A (or CNAME)
Name: *
Value: [Manus-provided IP or CNAME target]
TTL: 3600
```

This configuration enables dynamic subdomain routing without requiring individual DNS records for each tenant.

**Step 4: Verify DNS Propagation**

DNS changes can take anywhere from a few minutes to 48 hours to propagate globally, though most changes complete within 1-4 hours. Use DNS checking tools to verify your configuration has propagated correctly across different geographic regions.

**Verification Commands:**

```bash
# Check A record
dig example.com A

# Check CNAME record
dig www.example.com CNAME

# Check from specific nameserver
dig @8.8.8.8 example.com A

# Check propagation globally
# Visit: https://www.whatsmydns.net/
```

### DNS Provider Recommendations

While your domain registrar typically provides DNS hosting, using a specialized DNS provider can offer significant performance and reliability benefits. These providers operate globally distributed nameserver networks that reduce latency and improve availability.

**Cloudflare DNS (Recommended)**

Cloudflare offers free DNS hosting with industry-leading performance, operating one of the world's largest anycast networks. Their DNS service includes automatic DNSSEC, DDoS protection, and a user-friendly management interface. Average query response time is under 20ms globally, significantly faster than most registrar-provided DNS services.

**Setup Process:**
1. Create free Cloudflare account at cloudflare.com
2. Add your domain and follow the nameserver change instructions
3. Update nameservers at your registrar to Cloudflare's provided values
4. Configure DNS records in Cloudflare dashboard
5. Enable "Proxied" mode for automatic CDN and SSL

**Amazon Route 53**

Route 53 provides enterprise-grade DNS with advanced routing policies, health checks, and seamless AWS integration. Pricing is usage-based ($0.50 per hosted zone per month plus $0.40 per million queries), making it cost-effective for applications with moderate traffic.

**Google Cloud DNS**

Google Cloud DNS offers 100% uptime SLA, low-latency responses, and integration with Google Cloud Platform services. Pricing is competitive at $0.20 per million queries, with the first 1 billion queries per month included in the Google Cloud free tier.

---

## 3. Multi-Tenant Subdomain Architecture

### Subdomain Routing Strategy

Your application implements a multi-tenant architecture where each brokerage operates on a dedicated subdomain. This approach provides logical separation, branding opportunities, and simplified tenant management while maintaining a single codebase.

**Subdomain Structure:**

```
Main Application:
├── app.example.com          → Main application dashboard
├── www.example.com          → Marketing website
├── example.com              → Redirects to www or app

Tenant Subdomains:
├── acme-realty.example.com  → Acme Realty brokerage
├── sunset.example.com       → Sunset Brokers
├── [tenant-slug].example.com → Dynamic tenant routing

Admin & Services:
├── admin.example.com        → Admin panel
├── api.example.com          → API endpoints
├── docs.example.com         → Documentation
├── status.example.com       → Status page
```

### Implementation Architecture

**Subdomain Detection Middleware**

Your application needs middleware to detect the incoming subdomain and route requests to the appropriate tenant. This middleware runs on every request before reaching your application routes.

**Current Implementation Location:** `server/lib/tenant-context.ts`

The middleware should extract the subdomain from the request hostname, query the database for the matching tenant, and attach tenant information to the request context. If no matching tenant is found, the application should either redirect to a signup page or display a "tenant not found" error.

**Example Middleware Logic:**

```typescript
export async function getTenantFromSubdomain(hostname: string): Promise<Tenant | null> {
  // Extract subdomain from hostname
  // Example: "acme-realty.example.com" → "acme-realty"
  const parts = hostname.split('.');
  
  // Handle different scenarios
  if (parts.length < 3) {
    // No subdomain (example.com or www.example.com)
    return null;
  }
  
  const subdomain = parts[0];
  
  // Reserved subdomains
  const reserved = ['www', 'app', 'admin', 'api', 'docs', 'status'];
  if (reserved.includes(subdomain)) {
    return null;
  }
  
  // Query database for tenant
  const db = await getDb();
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.subdomain, subdomain))
    .where(eq(tenants.status, 'active'))
    .limit(1);
  
  return tenant || null;
}
```

### Custom Domain Support

In addition to subdomains, your application should support custom domains where brokerages can use their own domain (e.g., `reports.acme-realty.com`) instead of a subdomain on your domain.

**Database Schema:**

Your `tenants` table already includes a `customDomain` field. When a tenant configures a custom domain, they must:

1. Add a CNAME record pointing their domain to your application
2. Verify domain ownership (via DNS TXT record or file upload)
3. Wait for SSL certificate provisioning

**Custom Domain Detection:**

```typescript
export async function getTenantFromCustomDomain(hostname: string): Promise<Tenant | null> {
  const db = await getDb();
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.customDomain, hostname))
    .where(eq(tenants.status, 'active'))
    .limit(1);
  
  return tenant || null;
}
```

### Reserved Subdomain List

Certain subdomains should be reserved for system use and prevented from tenant registration. Maintaining this list ensures critical infrastructure remains accessible and prevents naming conflicts.

**Recommended Reserved Subdomains:**

```typescript
const RESERVED_SUBDOMAINS = [
  // Core application
  'www', 'app', 'application', 'portal', 'dashboard',
  
  // Administrative
  'admin', 'administrator', 'root', 'system', 'manage',
  
  // Technical infrastructure
  'api', 'apis', 'cdn', 'static', 'assets', 'files',
  'mail', 'email', 'smtp', 'pop', 'imap',
  'ftp', 'sftp', 'ssh', 'vpn',
  
  // Documentation & support
  'docs', 'documentation', 'help', 'support', 'wiki',
  'blog', 'news', 'status', 'health',
  
  // Marketing & business
  'marketing', 'sales', 'billing', 'payments', 'checkout',
  'signup', 'register', 'login', 'auth', 'oauth',
  
  // Development & testing
  'dev', 'development', 'test', 'testing', 'staging',
  'demo', 'sandbox', 'preview', 'beta', 'alpha',
  
  // Security
  'security', 'ssl', 'tls', 'cert', 'certificate',
  
  // Common terms to prevent confusion
  'about', 'contact', 'terms', 'privacy', 'legal',
  'careers', 'jobs', 'team', 'company'
];
```

---

## 4. SSL Certificate Management

### HTTPS Everywhere

Modern web applications must serve all content over HTTPS to ensure data security, maintain user trust, and achieve optimal search engine rankings. Google Chrome and other browsers now display prominent warnings for non-HTTPS sites, and many APIs refuse to work over insecure connections.

**Benefits of HTTPS:**

Security is the primary benefit, as HTTPS encrypts all data transmitted between the user's browser and your server, preventing eavesdropping and man-in-the-middle attacks. Beyond security, HTTPS provides SEO benefits—Google uses HTTPS as a ranking signal and prioritizes secure sites in search results. User trust increases significantly when visitors see the padlock icon in their browser's address bar, and many modern browser features (geolocation, camera access, push notifications) require HTTPS to function.

### SSL Certificate Options

**Let's Encrypt (Recommended)**

Let's Encrypt provides free, automated SSL certificates trusted by all major browsers. Certificates are valid for 90 days and can be automatically renewed, eliminating the manual overhead of certificate management. The ACME protocol enables fully automated certificate issuance and renewal.

**Manus Automatic SSL**

Your Manus hosting platform automatically provisions and manages SSL certificates for all domains and subdomains. When you add a custom domain in the Settings → Domains panel, Manus automatically requests a certificate from Let's Encrypt, configures it on your application, and sets up automatic renewal. This zero-configuration approach eliminates the complexity of manual certificate management.

**Wildcard Certificates**

For multi-tenant applications with dynamic subdomains, wildcard SSL certificates cover all subdomains under a single certificate. A wildcard certificate for `*.example.com` secures `tenant1.example.com`, `tenant2.example.com`, and any other subdomain automatically.

Let's Encrypt supports wildcard certificates through DNS-01 challenge validation, which requires adding a TXT record to your DNS configuration. Most DNS providers offer APIs that enable automated wildcard certificate issuance and renewal.

### SSL Configuration Best Practices

**TLS Version Requirements:**

Modern applications should support TLS 1.2 and TLS 1.3 while disabling older, insecure protocols. TLS 1.0 and 1.1 have known vulnerabilities and are deprecated by major browsers and security standards like PCI DSS.

**Cipher Suite Configuration:**

Configure your server to prefer strong cipher suites that provide forward secrecy. Forward secrecy ensures that even if your private key is compromised in the future, past communications remain secure.

**Recommended Cipher Suites:**
- `TLS_AES_128_GCM_SHA256` (TLS 1.3)
- `TLS_AES_256_GCM_SHA384` (TLS 1.3)
- `TLS_CHACHA20_POLY1305_SHA256` (TLS 1.3)
- `ECDHE-RSA-AES128-GCM-SHA256` (TLS 1.2)
- `ECDHE-RSA-AES256-GCM-SHA384` (TLS 1.2)

**HTTP Strict Transport Security (HSTS)**

HSTS instructs browsers to only connect to your site over HTTPS, even if the user types `http://` in the address bar. This prevents SSL stripping attacks and ensures all connections are encrypted.

**Recommended HSTS Header:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

The `max-age` directive specifies how long (in seconds) browsers should remember to only use HTTPS. Setting it to 31536000 seconds (1 year) is standard practice. The `includeSubDomains` directive applies HSTS to all subdomains, critical for multi-tenant applications. The `preload` directive allows you to submit your domain to the HSTS preload list, which is built into browsers and enforces HTTPS even on the first visit.

---

## 5. Professional URL Structure

### URL Architecture Principles

Well-designed URLs improve user experience, enhance SEO, and make your application easier to maintain. URLs should be human-readable, predictable, and hierarchical, clearly indicating the content or functionality they represent.

**Core Principles:**

URLs should use lowercase letters and hyphens (not underscores) to separate words, as search engines treat hyphens as word separators but treat underscores as word connectors. Keep URLs concise while remaining descriptive—aim for 3-5 words maximum. Avoid including file extensions (.html, .php) in URLs, as they reveal implementation details and reduce flexibility for future changes. Use nouns rather than verbs in URLs to represent resources, following REST API conventions.

### Recommended URL Structure

**Application URLs:**

```
Authentication & Onboarding:
├── /login                    → User login page
├── /signup                   → New user registration
├── /signup/verify            → Email verification
├── /forgot-password          → Password reset request
├── /reset-password/:token    → Password reset form

Dashboard & Core Features:
├── /dashboard                → Main dashboard
├── /uploads                  → Upload history
├── /uploads/new              → New upload form
├── /uploads/:id              → Upload details
├── /reports                  → Reports listing
├── /reports/:id              → Individual report view

Analytics & Insights:
├── /analytics                → Analytics overview
├── /analytics/agents         → Agent performance
├── /analytics/properties     → Property insights
├── /analytics/pipeline       → Pipeline analysis

Agent Management:
├── /agents                   → Agent listing
├── /agents/:id               → Agent profile
├── /agents/:id/transactions  → Agent transactions
├── /agents/:id/performance   → Agent metrics

Settings & Configuration:
├── /settings                 → Tenant settings (current page)
├── /settings/profile         → Tenant profile
├── /settings/subscription    → Subscription management
├── /settings/domains         → Custom domain configuration
├── /settings/team            → Team member management
├── /settings/integrations    → OAuth & API connections

Admin Panel:
├── /admin                    → Admin dashboard
├── /admin/tenants            → Tenant management
├── /admin/users              → User management
├── /admin/audit-logs         → Audit log viewer
```

**API Endpoints:**

```
RESTful API Structure:
├── /api/v1/uploads           → GET (list), POST (create)
├── /api/v1/uploads/:id       → GET (read), PUT (update), DELETE (delete)
├── /api/v1/transactions      → GET (list), POST (create)
├── /api/v1/transactions/:id  → GET (read), PUT (update), DELETE (delete)
├── /api/v1/agents            → GET (list)
├── /api/v1/agents/:id        → GET (read)
├── /api/v1/analytics         → GET (query with filters)
├── /api/v1/tenants/:id       → GET (read), PUT (update)
```

### URL Parameter Guidelines

**Query Parameters:**

Use query parameters for filtering, sorting, pagination, and search operations. Query parameters should be optional and not change the fundamental resource being accessed.

**Best Practices:**

```
Good Examples:
├── /agents?sort=commission&order=desc
├── /transactions?status=closed&year=2024
├── /reports?page=2&limit=20
├── /analytics?start=2024-01-01&end=2024-12-31

Bad Examples:
├── /agents?action=list           → Use HTTP methods instead
├── /transactions?id=123          → Use path parameters for IDs
├── /reports?getPage=2            → Avoid verb prefixes
```

**Path Parameters:**

Use path parameters for resource identifiers and hierarchical relationships. Path parameters should represent required information that identifies a specific resource.

```
Good Examples:
├── /agents/42                    → Agent with ID 42
├── /agents/42/transactions       → Transactions for agent 42
├── /uploads/abc123/download      → Download upload abc123

Bad Examples:
├── /agents?id=42                 → Use path parameter instead
├── /agent-transactions/42        → Maintain hierarchy
├── /download-upload/abc123       → Avoid verb prefixes
```

### Slug Generation

For user-friendly URLs, generate slugs from names or titles. Slugs should be lowercase, use hyphens for spaces, remove special characters, and be unique within their context.

**Example Slug Generation:**

```typescript
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')        // Remove special characters
    .replace(/[\s_-]+/g, '-')        // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
}

// Examples:
// "Acme Realty Group" → "acme-realty-group"
// "Sunset Brokers & Associates" → "sunset-brokers-associates"
// "123 Main Street Properties" → "123-main-street-properties"
```

---

## 6. SEO Optimization Best Practices

### On-Page SEO Fundamentals

Search engine optimization ensures your application appears in relevant search results and attracts organic traffic. While your application is primarily accessed by authenticated users, public-facing pages (marketing site, documentation, blog) benefit significantly from SEO optimization.

**Title Tags:**

The title tag is the most important on-page SEO element, appearing as the clickable headline in search results. Each page should have a unique, descriptive title that includes relevant keywords and your brand name.

**Title Tag Formula:**

```
[Primary Keyword] - [Secondary Keyword] | [Brand Name]

Examples:
├── "Dotloop Transaction Reports - Real Estate Analytics | YourBrand"
├── "Agent Performance Dashboard - Brokerage Insights | YourBrand"
├── "Upload Dotloop Data - CSV Import Tool | YourBrand"
```

**Title Tag Guidelines:**
- Keep titles between 50-60 characters (Google displays ~60 characters)
- Place most important keywords at the beginning
- Include brand name at the end for recognition
- Make each title unique across your site
- Avoid keyword stuffing or repetition

**Meta Descriptions:**

Meta descriptions don't directly impact rankings but significantly influence click-through rates from search results. Write compelling descriptions that accurately summarize page content and include a call-to-action.

**Meta Description Formula:**

```
[What the page offers] + [Key benefit] + [Call to action]

Examples:
├── "Analyze your Dotloop transactions with powerful visual reports. Track agent performance, monitor pipeline status, and identify trends. Start your free trial today."
├── "Upload your Dotloop CSV files and instantly generate comprehensive brokerage reports. Visualize sales data, agent commissions, and property insights in seconds."
```

**Meta Description Guidelines:**
- Keep descriptions between 150-160 characters
- Include primary and secondary keywords naturally
- Write for humans, not search engines
- Include a clear call-to-action
- Make each description unique

### Technical SEO Implementation

**Semantic HTML Structure:**

Use HTML5 semantic elements to help search engines understand your content structure. Proper semantic markup improves accessibility and SEO simultaneously.

```html
<header>
  <nav>
    <!-- Primary navigation -->
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
    <section>
      <h2>Section Heading</h2>
      <p>Content...</p>
    </section>
  </article>
</main>

<aside>
  <!-- Sidebar content -->
</aside>

<footer>
  <!-- Footer content -->
</footer>
```

**Heading Hierarchy:**

Maintain a logical heading structure with a single H1 per page, followed by H2 subsections, H3 sub-subsections, and so on. Never skip heading levels (e.g., H1 to H3 without H2).

**Structured Data (Schema.org)**

Implement structured data using JSON-LD format to help search engines understand your content and enable rich snippets in search results. For a SaaS application, relevant schema types include Organization, SoftwareApplication, and BreadcrumbList.

**Example Organization Schema:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Dotloop Reporting Tool",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127"
  }
}
</script>
```

### Sitemap & Robots.txt

**XML Sitemap:**

Generate an XML sitemap listing all public pages on your site. Submit this sitemap to Google Search Console and Bing Webmaster Tools to ensure search engines discover and index your content.

**Example Sitemap Structure:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-01-12</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/features</loc>
    <lastmod>2026-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/pricing</loc>
    <lastmod>2026-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Robots.txt:**

Create a robots.txt file to control which parts of your site search engines can crawl. Block admin panels, API endpoints, and user-specific pages while allowing public marketing pages.

**Example Robots.txt:**

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /settings/
Disallow: /dashboard/
Disallow: /uploads/

Sitemap: https://example.com/sitemap.xml
```

---

## 7. Website Hierarchy & Navigation

### Information Architecture

A well-structured website hierarchy helps users find information quickly and helps search engines understand your site's organization. Your application should separate public marketing content from authenticated application features.

**Recommended Site Structure:**

```
Root Level (Public):
├── Home (/)
│   ├── Hero section with value proposition
│   ├── Key features overview
│   ├── Social proof (testimonials, logos)
│   ├── Call-to-action (Start free trial)
│   └── Footer with links
│
├── Features (/features)
│   ├── Transaction analytics
│   ├── Agent performance tracking
│   ├── Pipeline management
│   ├── Custom reports
│   └── Dotloop integration
│
├── Pricing (/pricing)
│   ├── Plan comparison table
│   ├── Feature matrix
│   ├── FAQ section
│   └── Contact sales CTA
│
├── Resources (/resources)
│   ├── Documentation (/docs)
│   ├── Blog (/blog)
│   ├── Case studies (/case-studies)
│   ├── Video tutorials (/tutorials)
│   └── API reference (/api-docs)
│
├── Company (/company)
│   ├── About us (/about)
│   ├── Team (/team)
│   ├── Careers (/careers)
│   ├── Contact (/contact)
│   └── Press kit (/press)
│
└── Legal (/legal)
    ├── Terms of service (/terms)
    ├── Privacy policy (/privacy)
    ├── Cookie policy (/cookies)
    └── Security (/security)

Application (Authenticated):
├── Dashboard (/dashboard)
├── Analytics (/analytics)
├── Agents (/agents)
├── Reports (/reports)
├── Uploads (/uploads)
└── Settings (/settings)
```

### Navigation Best Practices

**Primary Navigation:**

The main navigation menu should be consistent across all pages and provide access to top-level sections. Limit primary navigation to 5-7 items to avoid overwhelming users.

**Recommended Primary Nav:**

```
Public Site:
[Logo] Features | Pricing | Resources | Company | Login | Sign Up

Authenticated App:
[Logo] Dashboard | Analytics | Agents | Reports | Uploads | [User Menu]
```

**User Menu (Authenticated):**

```
[User Avatar / Name]
├── Settings
├── Team
├── Billing
├── Help & Support
├── Documentation
└── Log Out
```

**Mobile Navigation:**

Implement a responsive hamburger menu for mobile devices. Ensure the menu is easily accessible (top-right corner), includes all primary navigation items, and uses large, touch-friendly tap targets (minimum 44x44 pixels).

**Breadcrumb Navigation:**

Implement breadcrumbs for deep pages to show users their location in the site hierarchy and provide easy navigation to parent pages.

**Example Breadcrumbs:**

```
Home > Analytics > Agents > John Smith > Transactions
Home > Settings > Team > Add Member
Home > Reports > Q4 2024 > Agent Performance
```

### Footer Structure

The footer provides secondary navigation, legal information, and additional resources. A well-organized footer improves usability and SEO by providing internal links to important pages.

**Recommended Footer Structure:**

```
Column 1: Product
├── Features
├── Pricing
├── Integrations
├── Changelog
└── Roadmap

Column 2: Resources
├── Documentation
├── API Reference
├── Video Tutorials
├── Case Studies
└── Blog

Column 3: Company
├── About Us
├── Careers
├── Contact
├── Press Kit
└── Partners

Column 4: Legal
├── Terms of Service
├── Privacy Policy
├── Cookie Policy
├── Security
└── Compliance

Column 5: Connect
├── Twitter
├── LinkedIn
├── Facebook
├── YouTube
└── Newsletter Signup
```

---

## 8. Metadata & Open Graph Protocol

### Open Graph Tags

Open Graph protocol enables rich previews when your pages are shared on social media platforms like Facebook, LinkedIn, and Twitter. Proper OG tags control how your content appears in social feeds, significantly impacting click-through rates.

**Essential Open Graph Tags:**

```html
<!-- Basic OG Tags -->
<meta property="og:title" content="Dotloop Reporting Tool - Real Estate Analytics" />
<meta property="og:description" content="Analyze your Dotloop transactions with powerful visual reports. Track agent performance and identify trends." />
<meta property="og:image" content="https://example.com/images/og-image.png" />
<meta property="og:url" content="https://example.com/" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Dotloop Reporting Tool" />

<!-- Twitter Card Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@yourbrand" />
<meta name="twitter:title" content="Dotloop Reporting Tool - Real Estate Analytics" />
<meta name="twitter:description" content="Analyze your Dotloop transactions with powerful visual reports." />
<meta name="twitter:image" content="https://example.com/images/twitter-card.png" />
```

**Open Graph Image Guidelines:**

The OG image is the most important visual element in social shares. Create a high-quality image that represents your brand and content effectively.

**Image Specifications:**
- **Recommended size:** 1200x630 pixels (1.91:1 aspect ratio)
- **Minimum size:** 600x315 pixels
- **Maximum file size:** 8 MB
- **Format:** PNG or JPG
- **Content:** Include your logo, headline, and key visual
- **Text:** Keep text large and readable (minimum 40px font size)

### Favicon & App Icons

Favicons appear in browser tabs, bookmarks, and mobile home screens. Provide multiple sizes to ensure optimal display across all devices and contexts.

**Required Favicon Sizes:**

```html
<!-- Standard favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" />

<!-- PNG favicons for modern browsers -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest" />
```

**Web App Manifest:**

Create a `site.webmanifest` file to define how your application appears when installed on mobile devices.

```json
{
  "name": "Dotloop Reporting Tool",
  "short_name": "Dotloop Reports",
  "description": "Real estate transaction analytics and reporting",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e3a5f",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 9. Performance & Security Standards

### Performance Optimization

Website performance directly impacts user experience, conversion rates, and search engine rankings. Google uses Core Web Vitals as ranking factors, making performance optimization essential for SEO success.

**Core Web Vitals Targets:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Largest Contentful Paint (LCP)** | < 2.5s | Time until largest content element loads |
| **First Input Delay (FID)** | < 100ms | Time until page responds to first interaction |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Visual stability during page load |
| **First Contentful Paint (FCP)** | < 1.8s | Time until first content appears |
| **Time to Interactive (TTI)** | < 3.8s | Time until page is fully interactive |

**Performance Best Practices:**

Modern web applications should implement aggressive caching strategies, minimize JavaScript bundle sizes, optimize images, and use content delivery networks (CDNs) to reduce latency. Your application should achieve a Lighthouse performance score of 90+ for optimal user experience and SEO.

**Specific Optimizations:**

1. **Code Splitting** – Split JavaScript bundles by route to load only necessary code for each page. React's lazy loading and dynamic imports enable automatic code splitting.

2. **Image Optimization** – Serve images in modern formats (WebP, AVIF) with appropriate sizes for different devices. Use lazy loading for images below the fold.

3. **CDN Usage** – Serve static assets (images, CSS, JavaScript) from a CDN to reduce latency for users worldwide. Cloudflare, AWS CloudFront, and Fastly offer excellent CDN services.

4. **Caching Strategy** – Implement aggressive caching for static assets with long cache durations (1 year) and cache-busting through filename hashing.

5. **Database Query Optimization** – Use database indexes on frequently queried columns, implement query result caching, and avoid N+1 query problems.

### Security Best Practices

**Security Headers:**

Implement security headers to protect against common web vulnerabilities. These headers instruct browsers to enforce security policies that prevent attacks.

**Recommended Security Headers:**

```
# Prevent clickjacking attacks
X-Frame-Options: DENY

# Prevent MIME type sniffing
X-Content-Type-Options: nosniff

# Enable XSS protection
X-XSS-Protection: 1; mode=block

# Control referrer information
Referrer-Policy: strict-origin-when-cross-origin

# Content Security Policy (customize for your needs)
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.example.com

# Permissions Policy (formerly Feature Policy)
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Authentication Security:**

Your application should implement industry-standard authentication practices including password hashing with bcrypt or Argon2, multi-factor authentication (MFA) support, rate limiting on login attempts, and secure session management with HTTP-only cookies.

**Data Protection:**

Encrypt sensitive data at rest using AES-256 encryption. Your token encryption implementation (`server/lib/token-encryption.ts`) already provides this for OAuth tokens. Extend this approach to other sensitive data like API keys, payment information, and personally identifiable information (PII).

**Audit Logging:**

Your application already implements comprehensive audit logging. Ensure all security-relevant events are logged, including login attempts, permission changes, data access, and configuration modifications. Store audit logs securely and retain them for compliance requirements (typically 90 days to 7 years depending on industry).

---

## 10. Implementation Checklist

### Phase 1: Domain Acquisition & DNS Setup

**Week 1: Domain Purchase & Basic Configuration**

The first phase establishes your domain presence and configures basic DNS routing. This foundational work enables all subsequent phases.

- [ ] **Research and select domain name** using the criteria outlined in Section 1
- [ ] **Purchase domain** through Manus built-in domain purchase or external registrar
- [ ] **Configure DNS A record** for root domain pointing to Manus IP
- [ ] **Configure DNS CNAME record** for www subdomain
- [ ] **Set up wildcard subdomain record** for multi-tenant routing
- [ ] **Verify DNS propagation** using dig commands and online tools
- [ ] **Test domain access** by visiting your new domain in a browser
- [ ] **Configure SSL certificate** (automatic with Manus hosting)
- [ ] **Verify HTTPS access** and check certificate validity
- [ ] **Implement HTTP to HTTPS redirect** for all traffic

**Deliverables:**
- Domain successfully resolves to your application
- SSL certificate active and auto-renewing
- Both root and www domains accessible
- Wildcard subdomain routing functional

### Phase 2: Multi-Tenant Subdomain Implementation

**Week 2: Subdomain Routing & Tenant Detection**

The second phase implements the technical infrastructure for multi-tenant subdomain routing, enabling each brokerage to access their dedicated subdomain.

- [ ] **Review tenant detection middleware** in `server/lib/tenant-context.ts`
- [ ] **Implement subdomain extraction logic** from request hostname
- [ ] **Add reserved subdomain validation** to prevent system conflicts
- [ ] **Update tenant registration** to validate subdomain uniqueness
- [ ] **Create subdomain availability check** API endpoint
- [ ] **Implement custom domain support** with CNAME verification
- [ ] **Add domain verification workflow** for custom domains
- [ ] **Test subdomain routing** with multiple test tenants
- [ ] **Verify tenant isolation** (data doesn't leak between tenants)
- [ ] **Document subdomain setup process** for new tenants

**Deliverables:**
- Functional subdomain routing for all tenants
- Reserved subdomain list enforced
- Custom domain support operational
- Tenant isolation verified

### Phase 3: URL Structure & Navigation

**Week 3: Professional URL Architecture**

The third phase restructures your application's URLs according to industry best practices and implements consistent navigation patterns.

- [ ] **Audit existing URLs** and identify inconsistencies
- [ ] **Implement new URL structure** from Section 5
- [ ] **Set up URL redirects** for any changed URLs (301 redirects)
- [ ] **Update internal links** throughout the application
- [ ] **Implement breadcrumb navigation** for deep pages
- [ ] **Create consistent navigation components** (header, footer, mobile menu)
- [ ] **Add user menu** with settings and account options
- [ ] **Implement responsive mobile navigation**
- [ ] **Test all navigation paths** for broken links
- [ ] **Update sitemap** with new URL structure

**Deliverables:**
- Clean, consistent URL structure
- Functional breadcrumb navigation
- Responsive navigation on all devices
- No broken internal links

### Phase 4: SEO & Metadata Implementation

**Week 4: Search Engine Optimization**

The fourth phase implements comprehensive SEO best practices, ensuring your application ranks well in search results and presents professionally in social shares.

- [ ] **Create unique title tags** for all public pages
- [ ] **Write compelling meta descriptions** for all public pages
- [ ] **Implement Open Graph tags** for social sharing
- [ ] **Create Twitter Card tags** for Twitter sharing
- [ ] **Design and generate OG images** (1200x630px) for key pages
- [ ] **Create favicon set** in all required sizes
- [ ] **Generate web app manifest** for mobile installation
- [ ] **Implement structured data** (Schema.org JSON-LD)
- [ ] **Create XML sitemap** listing all public pages
- [ ] **Write robots.txt** file with appropriate rules
- [ ] **Submit sitemap** to Google Search Console
- [ ] **Submit sitemap** to Bing Webmaster Tools
- [ ] **Test social sharing** on Facebook, Twitter, LinkedIn
- [ ] **Verify structured data** using Google Rich Results Test

**Deliverables:**
- Complete meta tags on all pages
- Professional social sharing previews
- Favicon visible in all browsers
- Sitemap submitted to search engines

### Phase 5: Performance & Security Hardening

**Week 5: Optimization & Security**

The fifth phase optimizes application performance and implements security best practices to ensure fast load times and protect user data.

- [ ] **Run Lighthouse audit** and document baseline scores
- [ ] **Implement code splitting** for route-based lazy loading
- [ ] **Optimize images** (convert to WebP, implement lazy loading)
- [ ] **Configure CDN** for static asset delivery
- [ ] **Implement caching headers** for static assets
- [ ] **Add security headers** (CSP, X-Frame-Options, etc.)
- [ ] **Implement HSTS** with preload directive
- [ ] **Configure rate limiting** on authentication endpoints
- [ ] **Review and update CORS policy**
- [ ] **Conduct security audit** of authentication flow
- [ ] **Test performance** on mobile devices
- [ ] **Verify Core Web Vitals** meet target thresholds
- [ ] **Run security scan** using tools like OWASP ZAP
- [ ] **Document security practices** for team

**Deliverables:**
- Lighthouse performance score 90+
- All security headers implemented
- Core Web Vitals meeting targets
- Security audit completed

### Phase 6: Marketing Website Development

**Week 6-8: Public-Facing Content**

The final phase creates professional public-facing pages that market your application to potential customers and provide necessary information.

- [ ] **Design homepage** with clear value proposition
- [ ] **Create features page** highlighting key capabilities
- [ ] **Build pricing page** with plan comparison
- [ ] **Develop about page** with company story
- [ ] **Write documentation** for common use cases
- [ ] **Create contact page** with inquiry form
- [ ] **Draft terms of service** (consult legal counsel)
- [ ] **Write privacy policy** (consult legal counsel)
- [ ] **Create cookie policy** for GDPR compliance
- [ ] **Build blog infrastructure** for content marketing
- [ ] **Design email templates** for transactional emails
- [ ] **Set up analytics** (Google Analytics, Plausible, etc.)
- [ ] **Implement conversion tracking** for signup flow
- [ ] **Create onboarding flow** for new users
- [ ] **Test entire user journey** from discovery to activation

**Deliverables:**
- Complete marketing website
- Legal pages (terms, privacy, cookies)
- Documentation site
- Analytics and tracking configured
- Smooth onboarding experience

---

## Conclusion

Implementing a professional domain and website structure transforms your Dotloop Reporting Tool from a functional application into an enterprise-grade SaaS platform. This comprehensive guide provides the roadmap for that transformation, covering every aspect from domain acquisition to SEO optimization.

**Key Takeaways:**

Your multi-tenant architecture is already well-positioned for professional deployment. The subdomain routing infrastructure exists in your codebase and requires only configuration and testing to become fully operational. Manus hosting simplifies many technical challenges by automatically managing SSL certificates, providing built-in domain purchasing, and handling infrastructure scaling.

Focus your initial efforts on Phase 1 (domain acquisition) and Phase 2 (subdomain implementation), as these provide immediate value and enable tenant-specific branding. SEO and marketing website development (Phases 4-6) can proceed in parallel or follow once core functionality is stable.

**Next Steps:**

Begin by selecting and purchasing your domain name. Use the domain selection criteria in Section 1 to choose a name that balances brandability, memorability, and SEO value. Once your domain is acquired, work through the implementation checklist systematically, testing each phase thoroughly before proceeding to the next.

Your application's solid technical foundation—multi-tenant database schema, OAuth infrastructure, comprehensive audit logging, and polished UI—positions you well for professional deployment. The guidance in this document bridges the gap between your current state and enterprise-grade standards, ensuring your platform meets industry expectations for security, performance, and user experience.

---

## Additional Resources

**Domain & DNS:**
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [DNS Propagation Checker](https://www.whatsmydns.net/)

**SEO & Web Standards:**
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Web.dev Performance Guides](https://web.dev/performance/)

**Security:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)

**Tools:**
- [Google Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Maintained By:** Manus AI
