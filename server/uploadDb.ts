import { eq, desc } from "drizzle-orm";
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
 * Uses ON DUPLICATE KEY UPDATE to handle duplicate loopIds by updating existing records
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
      // Use raw SQL for upsert to handle duplicate loopIds gracefully
      // ON DUPLICATE KEY UPDATE will update existing records instead of failing
      await upsertTransactionBatch(db, batch);
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
            await upsertTransactionBatch(db, smallBatch);
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
 * Helper function to upsert a batch of transactions using raw SQL
 */
async function upsertTransactionBatch(db: any, batch: InsertTransaction[]) {
  if (batch.length === 0) return;

  // Build the VALUES clause with proper escaping
  const valuesClauses = batch.map(t => {
    const values = [
      t.tenantId,
      t.uploadId,
      t.userId,
      t.loopId,
      t.loopViewUrl,
      t.loopName,
      t.loopStatus,
      t.createdDate,
      t.closingDate,
      t.listingDate,
      t.offerDate,
      t.address,
      t.price,
      t.propertyType,
      t.bedrooms,
      t.bathrooms,
      t.squareFootage,
      t.city,
      t.state,
      t.county,
      t.leadSource,
      t.agents,
      t.createdBy,
      t.earnestMoney,
      t.salePrice,
      t.commissionRate,
      t.commissionTotal,
      t.buySideCommission,
      t.sellSideCommission,
      t.companyDollar,
      t.referralSource,
      t.referralPercentage,
      t.complianceStatus,
      JSON.stringify(t.tags || []),
      t.originalPrice,
      t.yearBuilt,
      t.lotSize,
      t.subdivision,
    ];
    return `(${values.map(() => '?').join(',')})`;
  });

  // Flatten all values for the query
  const allValues = batch.flatMap(t => [
    t.tenantId,
    t.uploadId,
    t.userId,
    t.loopId,
    t.loopViewUrl,
    t.loopName,
    t.loopStatus,
    t.createdDate,
    t.closingDate,
    t.listingDate,
    t.offerDate,
    t.address,
    t.price,
    t.propertyType,
    t.bedrooms,
    t.bathrooms,
    t.squareFootage,
    t.city,
    t.state,
    t.county,
    t.leadSource,
    t.agents,
    t.createdBy,
    t.earnestMoney,
    t.salePrice,
    t.commissionRate,
    t.commissionTotal,
    t.buySideCommission,
    t.sellSideCommission,
    t.companyDollar,
    t.referralSource,
    t.referralPercentage,
    t.complianceStatus,
    JSON.stringify(t.tags || []),
    t.originalPrice,
    t.yearBuilt,
    t.lotSize,
    t.subdivision,
  ]);

  const sql = `
    INSERT INTO transactions (
      tenantId, uploadId, userId, loopId, loopViewUrl, loopName, loopStatus,
      createdDate, closingDate, listingDate, offerDate, address, price, propertyType,
      bedrooms, bathrooms, squareFootage, city, state, county, leadSource, agents,
      createdBy, earnestMoney, salePrice, commissionRate, commissionTotal,
      buySideCommission, sellSideCommission, companyDollar, referralSource,
      referralPercentage, complianceStatus, tags, originalPrice, yearBuilt, lotSize,
      subdivision
    ) VALUES ${valuesClauses.join(',')}
    ON DUPLICATE KEY UPDATE
      loopViewUrl = VALUES(loopViewUrl),
      loopName = VALUES(loopName),
      loopStatus = VALUES(loopStatus),
      createdDate = VALUES(createdDate),
      closingDate = VALUES(closingDate),
      listingDate = VALUES(listingDate),
      offerDate = VALUES(offerDate),
      address = VALUES(address),
      price = VALUES(price),
      propertyType = VALUES(propertyType),
      bedrooms = VALUES(bedrooms),
      bathrooms = VALUES(bathrooms),
      squareFootage = VALUES(squareFootage),
      city = VALUES(city),
      state = VALUES(state),
      county = VALUES(county),
      leadSource = VALUES(leadSource),
      agents = VALUES(agents),
      createdBy = VALUES(createdBy),
      earnestMoney = VALUES(earnestMoney),
      salePrice = VALUES(salePrice),
      commissionRate = VALUES(commissionRate),
      commissionTotal = VALUES(commissionTotal),
      buySideCommission = VALUES(buySideCommission),
      sellSideCommission = VALUES(sellSideCommission),
      companyDollar = VALUES(companyDollar),
      referralSource = VALUES(referralSource),
      referralPercentage = VALUES(referralPercentage),
      complianceStatus = VALUES(complianceStatus),
      tags = VALUES(tags),
      originalPrice = VALUES(originalPrice),
      yearBuilt = VALUES(yearBuilt),
      lotSize = VALUES(lotSize),
      subdivision = VALUES(subdivision),
      uploadId = VALUES(uploadId),
      updatedAt = NOW()
  `;

  // Execute the raw SQL query
  const connection = await db.execute(sql, allValues);
  return connection;
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
