import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { users } from "../../drizzle/schema";
import type { InferSelectModel } from "drizzle-orm";
import { sdk } from "./sdk";

type User = InferSelectModel<typeof users>;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First, try Dotloop session authentication
  try {
    const { verifySession, getSessionCookieName } = await import('../dotloopSessionManager');
    const { findUserById } = await import('../dotloopUserManager');
    
    const sessionCookie = opts.req.cookies?.[getSessionCookieName()];
    
    if (sessionCookie) {
      const session = await verifySession(sessionCookie);
      if (session) {
        // Fetch full user record from database
        const dotloopUser = await findUserById(session.userId);
        if (dotloopUser) {
          user = dotloopUser as User;
        }
      }
    }
  } catch (error) {
    console.error('[Context] Dotloop session validation failed:', error);
  }

  // Fallback to Manus authentication if no Dotloop session
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
