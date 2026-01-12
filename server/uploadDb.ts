import { eq, desc, sql } from "drizzle-orm";
import { uploads, transactions, auditLogs, users } from "../drizzle/schema";
import type { InferInsertModel } from 'drizzle-orm';

type InsertUpload = InferInsertModel<typeof uploads>;
type InsertTransaction = InferInsertModel<typeof transactions>;
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
 * Bulk insert or update transactions (upsert) with error handling and retry logic
 * Uses Drizzle's onDuplicateKeyUpdate to handle duplicate loopIds gracefully
 */
export async function createTransactions(transactionList: InsertTransaction[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Upsert in batches of 100 to avoid MySQL max_allowed_packet limit (default 4MB)
  // Each transaction row can be ~1-2KB, so 100 rows = ~100-200KB per batch
  const batchSize = 100;
  const failedBatches: { batchIndex: number; error: Error }[] = [];
  
  for (let i = 0; i < transactionList.length; i += batchSize) {
    const batchIndex = Math.floor(i / batchSize);
    const batch = transactionList.slice(i, i + batchSize);
    
    try {
      // Use Drizzle's onDuplicateKeyUpdate for upsert
      // This will update existing records if loopId already exists
      // Using sql.raw to reference VALUES() from the INSERT statement
      await db.insert(transactions).values(batch).onDuplicateKeyUpdate({
        set: {
          loopViewUrl: sql`VALUES(${transactions.loopViewUrl})`,
          loopName: sql`VALUES(${transactions.loopName})`,
          loopStatus: sql`VALUES(${transactions.loopStatus})`,
          createdDate: sql`VALUES(${transactions.createdDate})`,
          closingDate: sql`VALUES(${transactions.closingDate})`,
          listingDate: sql`VALUES(${transactions.listingDate})`,
          offerDate: sql`VALUES(${transactions.offerDate})`,
          address: sql`VALUES(${transactions.address})`,
          price: sql`VALUES(${transactions.price})`,
          propertyType: sql`VALUES(${transactions.propertyType})`,
          bedrooms: sql`VALUES(${transactions.bedrooms})`,
          bathrooms: sql`VALUES(${transactions.bathrooms})`,
          squareFootage: sql`VALUES(${transactions.squareFootage})`,
          city: sql`VALUES(${transactions.city})`,
          state: sql`VALUES(${transactions.state})`,
          county: sql`VALUES(${transactions.county})`,
          leadSource: sql`VALUES(${transactions.leadSource})`,
          agents: sql`VALUES(${transactions.agents})`,
          createdBy: sql`VALUES(${transactions.createdBy})`,
          earnestMoney: sql`VALUES(${transactions.earnestMoney})`,
          salePrice: sql`VALUES(${transactions.salePrice})`,
          commissionRate: sql`VALUES(${transactions.commissionRate})`,
          commissionTotal: sql`VALUES(${transactions.commissionTotal})`,
          buySideCommission: sql`VALUES(${transactions.buySideCommission})`,
          sellSideCommission: sql`VALUES(${transactions.sellSideCommission})`,
          companyDollar: sql`VALUES(${transactions.companyDollar})`,
          referralSource: sql`VALUES(${transactions.referralSource})`,
          referralPercentage: sql`VALUES(${transactions.referralPercentage})`,
          complianceStatus: sql`VALUES(${transactions.complianceStatus})`,
          tags: sql`VALUES(${transactions.tags})`,
          originalPrice: sql`VALUES(${transactions.originalPrice})`,
          yearBuilt: sql`VALUES(${transactions.yearBuilt})`,
          lotSize: sql`VALUES(${transactions.lotSize})`,
          subdivision: sql`VALUES(${transactions.subdivision})`,
          uploadId: sql`VALUES(${transactions.uploadId})`,
        },
      });
      
      console.log(`Batch ${batchIndex}: Upserted ${batch.length} records`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to upsert batch ${batchIndex} (rows ${i}-${Math.min(i + batchSize, transactionList.length)})`, err);
      
      // Try smaller batch size if this batch failed (50 rows per retry)
      if (batch.length > 50) {
        console.log(`Retrying batch ${batchIndex} with smaller size (50 rows)...`);
        try {
          const smallBatchSize = 50;
          for (let j = 0; j < batch.length; j += smallBatchSize) {
            const smallBatch = batch.slice(j, j + smallBatchSize);
            await db.insert(transactions).values(smallBatch).onDuplicateKeyUpdate({
              set: {
                loopViewUrl: sql`VALUES(${transactions.loopViewUrl})`,
                loopName: sql`VALUES(${transactions.loopName})`,
                loopStatus: sql`VALUES(${transactions.loopStatus})`,
                createdDate: sql`VALUES(${transactions.createdDate})`,
                closingDate: sql`VALUES(${transactions.closingDate})`,
                listingDate: sql`VALUES(${transactions.listingDate})`,
                offerDate: sql`VALUES(${transactions.offerDate})`,
                address: sql`VALUES(${transactions.address})`,
                price: sql`VALUES(${transactions.price})`,
                propertyType: sql`VALUES(${transactions.propertyType})`,
                bedrooms: sql`VALUES(${transactions.bedrooms})`,
                bathrooms: sql`VALUES(${transactions.bathrooms})`,
                squareFootage: sql`VALUES(${transactions.squareFootage})`,
                city: sql`VALUES(${transactions.city})`,
                state: sql`VALUES(${transactions.state})`,
                county: sql`VALUES(${transactions.county})`,
                leadSource: sql`VALUES(${transactions.leadSource})`,
                agents: sql`VALUES(${transactions.agents})`,
                createdBy: sql`VALUES(${transactions.createdBy})`,
                earnestMoney: sql`VALUES(${transactions.earnestMoney})`,
                salePrice: sql`VALUES(${transactions.salePrice})`,
                commissionRate: sql`VALUES(${transactions.commissionRate})`,
                commissionTotal: sql`VALUES(${transactions.commissionTotal})`,
                buySideCommission: sql`VALUES(${transactions.buySideCommission})`,
                sellSideCommission: sql`VALUES(${transactions.sellSideCommission})`,
                companyDollar: sql`VALUES(${transactions.companyDollar})`,
                referralSource: sql`VALUES(${transactions.referralSource})`,
                referralPercentage: sql`VALUES(${transactions.referralPercentage})`,
                complianceStatus: sql`VALUES(${transactions.complianceStatus})`,
                tags: sql`VALUES(${transactions.tags})`,
                originalPrice: sql`VALUES(${transactions.originalPrice})`,
                yearBuilt: sql`VALUES(${transactions.yearBuilt})`,
                lotSize: sql`VALUES(${transactions.lotSize})`,
                subdivision: sql`VALUES(${transactions.subdivision})`,
                uploadId: sql`VALUES(${transactions.uploadId})`,
              },
            });
          }
          console.log(`Successfully upserted batch ${batchIndex} with smaller batch size`);
          continue;
        } catch (retryError) {
          const retryErr = retryError instanceof Error ? retryError : new Error(String(retryError));
          console.error(`Retry failed for batch ${batchIndex}`, retryErr);
          failedBatches.push({ batchIndex, error: retryErr });
        }
      } else {
        failedBatches.push({ batchIndex, error: err });
      }
    }
  }
  
  // If there were failed batches, throw an error with details
  if (failedBatches.length > 0) {
    const failedBatchIndices = failedBatches.map(fb => fb.batchIndex).join(', ');
    const firstError = failedBatches[0].error.message;
    throw new Error(
      `Failed to upsert ${failedBatches.length} batch(es) (indices: ${failedBatchIndices}). ` +
      `First error: ${firstError}. ` +
      `Total records attempted: ${transactionList.length}`
    );
  }
  
  console.log(`Upsert completed: ${transactionList.length} records processed`);
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
    const { getTenantIdFromUser } = await import('./lib/tenant-context');
    const tenantId = await getTenantIdFromUser(adminUser.id);
    
    await db.insert(auditLogs).values({
      tenantId,
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
