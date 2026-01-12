/**
 * Multi-Tenant Schema with Secure OAuth Token Storage
 * 
 * This schema extends the existing single-tenant structure to support multiple brokerages.
 * All data is scoped by tenant_id to ensure complete isolation between tenants.
 */

import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, unique, index } from "drizzle-orm/mysql-core";

/**
 * Tenants Table
 * Represents each brokerage/organization using the system
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 63 }).notNull().unique(),
  customDomain: varchar("customDomain", { length: 255 }).unique(),
  status: mysqlEnum("status", ["active", "suspended", "deleted"]).default("active").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "basic", "professional", "enterprise"]).default("free").notNull(),
  settings: text("settings"), // JSON string with tenant-specific settings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  subdomainIdx: index("subdomain_idx").on(table.subdomain),
  customDomainIdx: index("customDomain_idx").on(table.customDomain),
}));

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Users Table (Multi-Tenant)
 * Extended to include tenant_id for multi-tenancy
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  openId: varchar("openId", { length: 64 }).notNull(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  openIdUnique: unique("openId_tenant_unique").on(table.openId, table.tenantId),
  emailUnique: unique("email_tenant_unique").on(table.email, table.tenantId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * OAuth Tokens Table
 * Securely stores encrypted OAuth tokens for external API access
 */
export const oauthTokens = mysqlTable("oauth_tokens", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 50 }).default("dotloop").notNull(),
  
  // Encrypted token data
  encryptedAccessToken: text("encryptedAccessToken").notNull(),
  encryptedRefreshToken: text("encryptedRefreshToken").notNull(),
  tokenExpiresAt: timestamp("tokenExpiresAt").notNull(),
  
  // Security metadata
  encryptionKeyVersion: int("encryptionKeyVersion").default(1).notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  
  // Context binding for additional security
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  deviceFingerprint: varchar("deviceFingerprint", { length: 255 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  lastRefreshedAt: timestamp("lastRefreshedAt"),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  userIdx: index("user_idx").on(table.userId),
  tokenHashIdx: index("tokenHash_idx").on(table.tokenHash),
  expiresIdx: index("expires_idx").on(table.tokenExpiresAt),
}));

export type OAuthToken = typeof oauthTokens.$inferSelect;
export type InsertOAuthToken = typeof oauthTokens.$inferInsert;

/**
 * Token Audit Logs
 * Records all security-relevant events for OAuth tokens
 */
export const tokenAuditLogs = mysqlTable("token_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId"),
  tokenId: int("tokenId"),
  
  // Event details
  action: mysqlEnum("action", [
    "token_created",
    "token_refreshed",
    "token_used",
    "token_revoked",
    "token_decryption_failed",
    "suspicious_access",
    "rate_limit_exceeded",
    "security_alert"
  ]).notNull(),
  status: mysqlEnum("status", ["success", "failure", "warning"]).notNull(),
  errorMessage: text("errorMessage"),
  
  // Request context
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  requestId: varchar("requestId", { length: 255 }),
  
  // Additional metadata
  metadata: text("metadata"), // JSON string with additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantTimeIdx: index("tenant_time_idx").on(table.tenantId, table.createdAt),
  actionIdx: index("action_idx").on(table.action, table.createdAt),
  suspiciousIdx: index("suspicious_idx").on(table.tenantId, table.createdAt, table.action),
}));

export type TokenAuditLog = typeof tokenAuditLogs.$inferSelect;
export type InsertTokenAuditLog = typeof tokenAuditLogs.$inferInsert;

/**
 * Uploads Table (Multi-Tenant)
 * Extended to include tenant_id
 */
export const uploads = mysqlTable("uploads", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  recordCount: int("recordCount").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  
  // Performance metrics
  fileSize: int("fileSize"),
  validationTimeMs: int("validationTimeMs"),
  parsingTimeMs: int("parsingTimeMs"),
  uploadTimeMs: int("uploadTimeMs"),
  totalTimeMs: int("totalTimeMs"),
  status: mysqlEnum("status", ["success", "failed", "partial"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  userIdx: index("user_idx").on(table.userId),
}));

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

/**
 * Transactions Table (Multi-Tenant)
 * Extended to include tenant_id
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  uploadId: int("uploadId").notNull(),
  userId: int("userId").notNull(),
  
  // Core transaction fields
  loopId: varchar("loopId", { length: 255 }),
  loopViewUrl: text("loopViewUrl"),
  loopName: varchar("loopName", { length: 500 }),
  loopStatus: varchar("loopStatus", { length: 100 }),
  
  // Dates
  createdDate: varchar("createdDate", { length: 50 }),
  closingDate: varchar("closingDate", { length: 50 }),
  listingDate: varchar("listingDate", { length: 50 }),
  offerDate: varchar("offerDate", { length: 50 }),
  
  // Property details
  address: text("address"),
  price: int("price"),
  propertyType: varchar("propertyType", { length: 100 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  squareFootage: int("squareFootage"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  county: varchar("county", { length: 100 }),
  
  // Lead and agent info
  leadSource: varchar("leadSource", { length: 100 }),
  agents: text("agents"),
  createdBy: varchar("createdBy", { length: 255 }),
  
  // Financial data
  earnestMoney: int("earnestMoney"),
  salePrice: int("salePrice"),
  commissionRate: int("commissionRate"),
  commissionTotal: int("commissionTotal"),
  buySideCommission: int("buySideCommission"),
  sellSideCommission: int("sellSideCommission"),
  companyDollar: int("companyDollar"),
  
  // Additional fields
  referralSource: varchar("referralSource", { length: 255 }),
  referralPercentage: int("referralPercentage"),
  complianceStatus: varchar("complianceStatus", { length: 100 }),
  tags: text("tags"),
  originalPrice: int("originalPrice"),
  yearBuilt: int("yearBuilt"),
  lotSize: int("lotSize"),
  subdivision: varchar("subdivision", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  uploadIdx: index("upload_idx").on(table.uploadId),
  loopIdUnique: unique("loopId_tenant_unique").on(table.loopId, table.tenantId),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Audit Logs (Multi-Tenant)
 * Extended to include tenant_id
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  
  // Admin user who performed the action
  adminId: int("adminId").notNull(),
  adminName: varchar("adminName", { length: 255 }).notNull(),
  adminEmail: varchar("adminEmail", { length: 320 }),
  
  // Action details
  action: mysqlEnum("action", [
    "user_created",
    "user_deleted",
    "user_role_changed",
    "upload_deleted",
    "upload_viewed",
    "settings_changed",
    "data_exported",
    "tenant_settings_changed",
    "oauth_connected",
    "oauth_disconnected"
  ]).notNull(),
  
  // Target of the action
  targetType: mysqlEnum("targetType", ["user", "upload", "system", "tenant"]),
  targetId: int("targetId"),
  targetName: varchar("targetName", { length: 255 }),
  
  // Additional context
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  actionIdx: index("action_idx").on(table.action),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Platform Admin Audit Logs
 * Tracks platform-level admin actions across all tenants
 */
export const platformAdminLogs = mysqlTable("platform_admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  tenantId: int("tenantId"), // null for platform-wide actions
  
  action: varchar("action", { length: 100 }).notNull(),
  reason: text("reason"),
  details: text("details"),
  
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  adminIdx: index("admin_idx").on(table.adminUserId),
  tenantIdx: index("tenant_idx").on(table.tenantId),
  timeIdx: index("time_idx").on(table.createdAt),
}));

export type PlatformAdminLog = typeof platformAdminLogs.$inferSelect;
export type InsertPlatformAdminLog = typeof platformAdminLogs.$inferInsert;
