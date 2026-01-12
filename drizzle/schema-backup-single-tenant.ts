import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * CSV Upload History
 * Stores metadata about uploaded CSV files
 */
export const uploads = mysqlTable("uploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  recordCount: int("recordCount").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  
  // Performance metrics
  fileSize: int("fileSize"), // File size in bytes
  validationTimeMs: int("validationTimeMs"), // Time spent validating (milliseconds)
  parsingTimeMs: int("parsingTimeMs"), // Time spent parsing (milliseconds)
  uploadTimeMs: int("uploadTimeMs"), // Time spent uploading to DB (milliseconds)
  totalTimeMs: int("totalTimeMs"), // Total processing time (milliseconds)
  status: mysqlEnum("status", ["success", "failed", "partial"]).default("success").notNull(),
  errorMessage: text("errorMessage"), // Error details if failed
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

/**
 * Transaction Records
 * Stores individual transaction data from CSV uploads
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
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
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Dotloop API Integrations (Future)
 * Stores OAuth tokens for Dotloop API access
 */
export const dotloopIntegrations = mysqlTable("dotloop_integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  profileId: varchar("profileId", { length: 255 }),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DotloopIntegration = typeof dotloopIntegrations.$inferSelect;
export type InsertDotloopIntegration = typeof dotloopIntegrations.$inferInsert;

/**
 * Audit Logs
 * Tracks all admin actions for accountability and compliance
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Admin user who performed the action */
  adminId: int("adminId").notNull(),
  adminName: varchar("adminName", { length: 255 }).notNull(),
  adminEmail: varchar("adminEmail", { length: 320 }),
  
  /** Action details */
  action: mysqlEnum("action", [
    "user_created",
    "user_deleted",
    "user_role_changed",
    "upload_deleted",
    "upload_viewed",
    "settings_changed",
    "data_exported"
  ]).notNull(),
  
  /** Target of the action (if applicable) */
  targetType: mysqlEnum("targetType", ["user", "upload", "system"]),
  targetId: int("targetId"),
  targetName: varchar("targetName", { length: 255 }),
  
  /** Additional context */
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"),
  
  /** Metadata */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;