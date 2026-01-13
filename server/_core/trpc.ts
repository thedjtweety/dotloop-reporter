import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);


/**
 * Error handling middleware for all procedures
 */
const errorHandlingMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const { generateRequestId, logEntry } = await import('../lib/error-handler');
  const startTime = Date.now();
  const requestId = generateRequestId();

  try {
    logEntry({
      level: 'debug',
      message: `[${type.toUpperCase()}] ${path} started`,
      context: {
        timestamp: new Date().toISOString(),
        requestId,
        metadata: {
          userId: ctx.user?.id,
          tenantId: ctx.user?.tenantId,
          path,
          type,
        },
      },
    });

    const result = await next();

    const duration = Date.now() - startTime;
    logEntry({
      level: 'debug',
      message: `[${type.toUpperCase()}] ${path} completed successfully`,
      context: {
        timestamp: new Date().toISOString(),
        requestId,
        metadata: {
          userId: ctx.user?.id,
          tenantId: ctx.user?.tenantId,
          path,
          type,
          duration,
        },
      },
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    logEntry({
      level: 'error',
      message: `[${type.toUpperCase()}] ${path} failed: ${errorMsg}`,
      context: {
        timestamp: new Date().toISOString(),
        requestId,
        metadata: {
          userId: ctx.user?.id,
          tenantId: ctx.user?.tenantId,
          path,
          type,
          duration,
        },
      },
      error: {
        name: errorName,
        message: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    if (error instanceof TRPCError) {
      throw error;
    }

    if (error instanceof Error) {
      const code = errorMsg.includes('not found')
        ? 'NOT_FOUND'
        : errorMsg.includes('unauthorized')
          ? 'UNAUTHORIZED'
          : errorMsg.includes('forbidden')
            ? 'FORBIDDEN'
            : 'INTERNAL_SERVER_ERROR';

      throw new TRPCError({
        code: code as any,
        message: errorMsg,
        cause: error,
      });
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Public procedure with error handling
 */
export const publicProcedureWithErrorHandling = publicProcedure.use(errorHandlingMiddleware);

/**
 * Protected procedure with error handling
 */
export const protectedProcedureWithErrorHandling = protectedProcedure.use(errorHandlingMiddleware);

/**
 * Admin procedure with error handling
 */
export const adminProcedureWithErrorHandling = adminProcedure.use(errorHandlingMiddleware);
