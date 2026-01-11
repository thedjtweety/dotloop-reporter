import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { uploads, transactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("uploads router", () => {
  beforeEach(async () => {
    // Clean up test data before each test
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Delete test transactions and uploads
    await db.delete(transactions).where(eq(transactions.userId, 1));
    await db.delete(uploads).where(eq(uploads.userId, 1));
  });

  it("creates an upload with transactions", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const sampleTransactions = [
      {
        loopId: "loop-123",
        loopName: "123 Main St",
        loopStatus: "Active",
        price: 500000,
        agents: "John Doe",
        city: "Austin",
        state: "TX",
      },
      {
        loopId: "loop-456",
        loopName: "456 Oak Ave",
        loopStatus: "Closed",
        price: 750000,
        agents: "Jane Smith",
        city: "Dallas",
        state: "TX",
      },
    ];

    const result = await caller.uploads.create({
      fileName: "test-upload.csv",
      transactions: sampleTransactions,
    });

    expect(result.uploadId).toBeTypeOf("number");
    expect(result.recordCount).toBe(2);
  });

  it("retrieves all uploads for a user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create two uploads
    await caller.uploads.create({
      fileName: "upload1.csv",
      transactions: [
        { loopId: "1", loopName: "Property 1", price: 100000 },
      ],
    });

    await caller.uploads.create({
      fileName: "upload2.csv",
      transactions: [
        { loopId: "2", loopName: "Property 2", price: 200000 },
      ],
    });

    const uploads = await caller.uploads.list();

    expect(uploads).toHaveLength(2);
    // Verify both uploads exist (order may vary)
    const fileNames = uploads.map(u => u.fileName).sort();
    expect(fileNames).toEqual(["upload1.csv", "upload2.csv"]);
  });

  it("retrieves transactions for a specific upload", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const sampleTransactions = [
      {
        loopId: "loop-789",
        loopName: "789 Pine St",
        loopStatus: "Under Contract",
        price: 600000,
        agents: "Bob Johnson",
        city: "Houston",
        state: "TX",
      },
    ];

    const createResult = await caller.uploads.create({
      fileName: "test-transactions.csv",
      transactions: sampleTransactions,
    });

    const retrievedTransactions = await caller.uploads.getTransactions({
      uploadId: createResult.uploadId,
    });

    expect(retrievedTransactions).toHaveLength(1);
    expect(retrievedTransactions[0].loopId).toBe("loop-789");
    expect(retrievedTransactions[0].loopName).toBe("789 Pine St");
    expect(retrievedTransactions[0].price).toBe(600000);
  });

  it("deletes an upload and its transactions", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const createResult = await caller.uploads.create({
      fileName: "to-delete.csv",
      transactions: [
        { loopId: "delete-1", loopName: "Delete Property", price: 100000 },
      ],
    });

    // Verify upload exists
    const uploadsBeforeDelete = await caller.uploads.list();
    expect(uploadsBeforeDelete).toHaveLength(1);

    // Delete the upload
    await caller.uploads.delete({ uploadId: createResult.uploadId });

    // Verify upload is deleted
    const uploadsAfterDelete = await caller.uploads.list();
    expect(uploadsAfterDelete).toHaveLength(0);
  });

  it("prevents accessing another user's uploads", async () => {
    // Create upload as user 1
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    const createResult = await caller1.uploads.create({
      fileName: "user1-upload.csv",
      transactions: [
        { loopId: "user1-1", loopName: "User 1 Property", price: 100000 },
      ],
    });

    // Try to access as user 2
    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    // Should throw error when trying to access user 1's upload
    await expect(
      caller2.uploads.getTransactions({ uploadId: createResult.uploadId })
    ).rejects.toThrow();
  });

  it("handles empty transaction arrays", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.uploads.create({
      fileName: "empty-upload.csv",
      transactions: [],
    });

    expect(result.recordCount).toBe(0);

    const retrievedTransactions = await caller.uploads.getTransactions({
      uploadId: result.uploadId,
    });

    expect(retrievedTransactions).toHaveLength(0);
  });
});
