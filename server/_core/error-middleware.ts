/**
 * tRPC Error Handling Middleware
 * 
 * Automatically wraps all tRPC procedures with error handling and logging.
 * This middleware catches errors, logs them with context, and provides
 * consistent error responses across all API endpoints.
 */

import { TRPCError } from '@trpc/server';
import { initTRPC } from '@trpc/server';
import type { TrpcContext } from './context';
import { generateRequestId, logEntry } from '../lib/error-handler';

const t = initTRPC.context<TrpcContext>().create();

/**
 * Middleware that wraps procedure execution with error handling
 */
const errorHandlingMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
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
 * Create a wrapped query procedure with error handling
 */
export const errorHandledQuery = t.procedure.use(errorHandlingMiddleware);

/**
 * Create a wrapped mutation procedure with error handling
 */
export const errorHandledMutation = t.procedure.use(errorHandlingMiddleware);

/**
 * Wrap an existing procedure handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  procedureName: string,
  procedure: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      logEntry({
        level: 'debug',
        message: `Procedure ${procedureName} started`,
        context: {
          timestamp: new Date().toISOString(),
          requestId,
          procedure: procedureName,
        },
      });

      const result = await procedure(...args);

      const duration = Date.now() - startTime;
      logEntry({
        level: 'debug',
        message: `Procedure ${procedureName} completed`,
        context: {
          timestamp: new Date().toISOString(),
          requestId,
          procedure: procedureName,
          metadata: { duration },
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      logEntry({
        level: 'error',
        message: `Procedure ${procedureName} failed: ${errorMsg}`,
        context: {
          timestamp: new Date().toISOString(),
          requestId,
          procedure: procedureName,
          metadata: { duration },
        },
        error: {
          name: error instanceof Error ? error.name : 'UnknownError',
          message: errorMsg,
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      throw error;
    }
  }) as T;
}
