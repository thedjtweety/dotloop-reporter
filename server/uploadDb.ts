import { eq, desc } from "drizzle-orm";
import { uploads, transactions, InsertUpload, InsertTransaction, auditLogs, users } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new upload record
 */
export async function createUpload(upload: InsertUpload): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(uploads).values(upload);
  // @ts-ignore - insertId exists on mysql2 result
  return Number(result[0].insertId);
}

/**
 * Get all uploads for a user
 */
export async function getUserUploads(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(uploads)
    .where(eq(uploads.userId, userId))
    .orderBy(desc(uploads.uploadedAt));
}

/**
 * Get a specific upload by ID
 */
export async function getUploadById(uploadId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(uploads)
    .where(eq(uploads.id, uploadId))
    .limit(1);

  if (result.length === 0) return null;
  
  // Verify ownership
  if (result[0].userId !== userId) {
    throw new Error("Unauthorized");
  }

  return result[0];
}

/**
 * Bulk insert transactions
 */
export async function createTransactions(transactionList: InsertTransaction[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert in batches of 1000 to avoid query size limits
  const batchSize = 1000;
  for (let i = 0; i < transactionList.length; i += batchSize) {
    const batch = transactionList.slice(i, i + batchSize);
    await db.insert(transactions).values(batch);
  }
}

/**
 * Get all transactions for a specific upload
 */
export async function getTransactionsByUploadId(uploadId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First verify the upload belongs to the user
  const upload = await getUploadById(uploadId, userId);
  if (!upload) throw new Error("Upload not found");

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.uploadId, uploadId));
}

/**
 * Get all transactions for a user (across all uploads)
 */
export async function getUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));
}

/**
 * Delete an upload and all its transactions
 */
export async function deleteUpload(uploadId: number, userId: number, isAdminAction: boolean = false, adminUser?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify ownership
  const upload = await getUploadById(uploadId, userId);
  if (!upload) throw new Error("Upload not found");

  // Delete transactions first (foreign key constraint)
  await db.delete(transactions).where(eq(transactions.uploadId, uploadId));
  
  // Then delete the upload
  await db.delete(uploads).where(eq(uploads.id, uploadId));

  // Log admin action if applicable
  if (isAdminAction && adminUser) {
    await db.insert(auditLogs).values({
      adminId: adminUser.id,
      adminName: adminUser.name || 'Unknown Admin',
      adminEmail: adminUser.email || undefined,
      action: 'upload_deleted',
      targetType: 'upload',
      targetId: uploadId,
      targetName: upload.fileName,
      details: JSON.stringify({ uploadedBy: userId, recordCount: upload.recordCount }),
    });
  }
}
