# Domain Setup Summary: dotloopreport.com

**Date:** January 12, 2026  
**Domain:** dotloopreport.com  
**Status:** ✅ Active and Configured

---

## Current Configuration

### DNS & SSL Status

| Component | Status | Details |
|-----------|--------|---------|
| **Domain Registration** | ✅ Active | Purchased through Manus |
| **DNS Propagation** | ✅ Complete | Resolving correctly globally |
| **SSL Certificate** | ✅ Active | HTTPS enabled with auto-renewal |
| **HSTS** | ✅ Enabled | Strict-Transport-Security header configured |
| **CDN** | ✅ Active | Cloudflare proxy enabled |
| **Root Domain** | ✅ Working | `https://dotloopreport.com` accessible |
| **WWW Subdomain** | ✅ Working | `https://www.dotloopreport.com` accessible |
| **Wildcard Subdomains** | ⚠️ Pending | Needs configuration in Manus UI |

---

## Next Steps

### 1. Enable Wildcard Subdomains (Required for Multi-Tenancy)

**Action Required:**
- Open Manus Management UI → Settings → Domains
- Look for wildcard subdomain or multi-tenant routing option
- Enable `*.dotloopreport.com` to support tenant subdomains

**Purpose:**
This allows each brokerage to access their own subdomain:
- `acme-realty.dotloopreport.com`
- `sunset-brokers.dotloopreport.com`
- `[tenant-slug].dotloopreport.com`

### 2. Update Default Tenant Subdomain

**Current State:**
Your database has a default tenant (ID: 1, "Demo Brokerage") with subdomain configuration.

**Recommended Action:**
Update the default tenant's subdomain to use your new domain:

```sql
UPDATE tenants 
SET subdomain = 'demo'
WHERE id = 1;
```

This will make the default tenant accessible at `demo.dotloopreport.com` once wildcard routing is enabled.

### 3. Test Multi-Tenant Routing

**After enabling wildcard subdomains, test:**

```bash
# Test default tenant subdomain
curl -I https://demo.dotloopreport.com

# Test that tenant detection works
# (Should load the application with tenant context)
```

### 4. Configure OAuth Redirect URLs

**When you register Dotloop OAuth application:**

Update your OAuth redirect URLs to use the new domain:
- Callback URL: `https://dotloopreport.com/api/oauth/dotloop/callback`
- Or for tenant-specific: `https://{tenant}.dotloopreport.com/api/oauth/dotloop/callback`

### 5. Update Application Branding (Optional)

**Consider updating:**
- `VITE_APP_TITLE` environment variable to "Dotloop Report"
- `VITE_APP_LOGO` to use your custom branding
- Favicon to match your brand identity

**How to update:**
Use the `webdev_edit_secrets` tool or update directly in Manus Settings → Secrets panel.

---

## Multi-Tenant Architecture Overview

### Subdomain Routing Flow

```
User visits: acme-realty.dotloopreport.com
     ↓
DNS resolves to Manus server
     ↓
Application receives request
     ↓
Middleware extracts subdomain: "acme-realty"
     ↓
Database query: SELECT * FROM tenants WHERE subdomain = 'acme-realty'
     ↓
Tenant context attached to request
     ↓
All queries scoped to tenant's data
     ↓
Response rendered with tenant branding
```

### Reserved Subdomains

The following subdomains are reserved for system use and cannot be used by tenants:

```
www, app, admin, api, docs, status, help, support, blog, 
mail, ftp, dev, test, staging, demo, beta, auth, login, 
signup, dashboard, portal, cdn, static, assets
```

### Tenant Subdomain Validation

When a new tenant registers, the system validates:
1. Subdomain is not in the reserved list
2. Subdomain is unique (not already taken)
3. Subdomain follows naming rules (lowercase, alphanumeric, hyphens only)
4. Subdomain length is 3-63 characters

---

## Custom Domain Support

### How Tenants Can Use Their Own Domain

Your application supports custom domains where brokerages can use their own domain instead of a subdomain.

**Example:** Instead of `acme-realty.dotloopreport.com`, they can use `reports.acme-realty.com`

**Setup Process:**

1. **Tenant adds custom domain** in Settings → Domains
2. **System generates verification record** (DNS TXT record)
3. **Tenant adds CNAME record** pointing to your application:
   ```
   reports.acme-realty.com  →  CNAME  →  dotloopreport.com
   ```
4. **System verifies domain ownership** via DNS TXT record
5. **SSL certificate provisioned** automatically for custom domain
6. **Custom domain activated** and tenant can access via their domain

### Custom Domain Database Schema

Your `tenants` table includes:
- `customDomain` (nullable string) - stores the custom domain
- `customDomainVerified` (boolean) - indicates if domain is verified
- `customDomainVerifiedAt` (timestamp) - when verification completed

---

## Security Considerations

### HTTPS Everywhere

All traffic is automatically redirected to HTTPS. The application enforces:
- TLS 1.2 and TLS 1.3 only (no older protocols)
- Strong cipher suites with forward secrecy
- HSTS with includeSubDomains directive

### Tenant Isolation

The application enforces strict tenant isolation:
- All database queries include `tenantId` filter
- Middleware validates tenant context on every request
- Users cannot access data from other tenants
- Audit logs track all cross-tenant access attempts

### OAuth Security

When implementing Dotloop OAuth:
- Store tokens encrypted using `server/lib/token-encryption.ts`
- Use AES-256-GCM encryption for token storage
- Implement automatic token refresh before expiration
- Log all OAuth events to audit log

---

## Performance Optimization

### CDN Configuration

Your domain is proxied through Cloudflare CDN, providing:
- Global edge caching for static assets
- DDoS protection
- Automatic image optimization
- Brotli compression
- HTTP/2 and HTTP/3 support

### Caching Strategy

**Recommended cache headers:**

```
Static assets (JS, CSS, images):
Cache-Control: public, max-age=31536000, immutable

HTML pages:
Cache-Control: no-cache, no-store, must-revalidate

API responses:
Cache-Control: private, max-age=0, must-revalidate
```

---

## Monitoring & Maintenance

### DNS Monitoring

**Tools to monitor DNS health:**
- [DNS Checker](https://dnschecker.org/) - Check global DNS propagation
- [What's My DNS](https://www.whatsmydns.net/) - Verify DNS records worldwide
- [MX Toolbox](https://mxtoolbox.com/) - Comprehensive DNS diagnostics

### SSL Certificate Monitoring

**Manus automatically:**
- Renews SSL certificates 30 days before expiration
- Monitors certificate validity
- Alerts if renewal fails

**Manual verification:**
```bash
# Check certificate expiration
echo | openssl s_client -servername dotloopreport.com -connect dotloopreport.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Performance Monitoring

**Recommended tools:**
- [Google PageSpeed Insights](https://pagespeed.web.dev/) - Core Web Vitals
- [GTmetrix](https://gtmetrix.com/) - Performance analysis
- [WebPageTest](https://www.webpagetest.org/) - Detailed performance testing

---

## Troubleshooting

### Common Issues

**Issue: Subdomain not resolving**
- Verify wildcard DNS record is configured
- Check DNS propagation (can take up to 48 hours)
- Confirm subdomain exists in database
- Check tenant status is 'active'

**Issue: SSL certificate error**
- Wait for Manus to provision certificate (usually < 5 minutes)
- Verify domain DNS points to Manus servers
- Check Manus dashboard for certificate status

**Issue: Tenant data not loading**
- Verify tenant middleware is extracting subdomain correctly
- Check database for tenant with matching subdomain
- Review server logs for tenant context errors
- Ensure `tenantId` is included in all queries

**Issue: OAuth redirect failing**
- Verify redirect URL matches exactly in Dotloop app settings
- Check that URL uses HTTPS (not HTTP)
- Confirm domain is accessible publicly
- Review OAuth error logs in audit log

---

## Support Resources

**Manus Documentation:**
- Domain Management: Check Manus help docs
- SSL Certificates: Automatic provisioning documentation
- Multi-tenant Routing: Subdomain configuration guide

**Your Application Documentation:**
- Professional Domain Guide: `/docs/PROFESSIONAL_DOMAIN_GUIDE.md`
- Chart Enhancements: `/docs/CHART_VISUAL_ENHANCEMENTS.md`
- OAuth Flow: `/docs/DOTLOOP_OAUTH_FLOW.md`

**External Resources:**
- [Cloudflare DNS Docs](https://developers.cloudflare.com/dns/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

## Changelog

**January 12, 2026:**
- ✅ Domain `dotloopreport.com` purchased through Manus
- ✅ DNS propagation verified
- ✅ SSL certificate active
- ✅ Root and www subdomains working
- ⚠️ Wildcard subdomain configuration pending

---

**Next Update:** After wildcard subdomains are enabled and tested
