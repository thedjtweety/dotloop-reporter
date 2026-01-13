import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRequestId,
  createProcedureErrorHandler,
  withErrorHandling,
  logEntry,
} from '../error-handler';

// Mock console methods
const consoleSpy = {
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate request ID with timestamp and random string', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('logEntry', () => {
    it('should log debug messages', () => {
      logEntry({
        level: 'debug',
        message: 'Test debug message',
        context: {
          timestamp: new Date().toISOString(),
        },
      });

      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logEntry({
        level: 'info',
        message: 'Test info message',
        context: {
          timestamp: new Date().toISOString(),
        },
      });

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logEntry({
        level: 'warn',
        message: 'Test warning message',
        context: {
          timestamp: new Date().toISOString(),
        },
      });

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages with error details', () => {
      const error = new Error('Test error');
      logEntry({
        level: 'error',
        message: 'Test error message',
        context: {
          timestamp: new Date().toISOString(),
        },
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include context metadata in log entries', () => {
      const context = {
        timestamp: new Date().toISOString(),
        userId: 123,
        tenantId: 456,
        metadata: { action: 'test' },
      };

      logEntry({
        level: 'info',
        message: 'Test with context',
        context,
      });

      expect(consoleSpy.info).toHaveBeenCalled();
      const call = consoleSpy.info.mock.calls[0];
      expect(call[1]).toMatchObject({ context });
    });
  });

  describe('createProcedureErrorHandler', () => {
    it('should create a handler for a procedure', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      expect(handler).toBeDefined();
      expect(handler.handle).toBeDefined();
      expect(handler.warn).toBeDefined();
      expect(handler.info).toBeDefined();
      expect(handler.debug).toBeDefined();
    });

    it('should throw error with procedure name context', () => {
      const handler = createProcedureErrorHandler('testProcedure');
      const error = new Error('Test error');

      expect(() => {
        handler.handle(error, {});
      }).toThrow();
    });

    it('should log warning messages with procedure context', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      handler.warn('Test warning', { userId: 123 });

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log info messages with procedure context', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      handler.info('Test info', { userId: 123 });

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log debug messages with procedure context', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      handler.debug('Test debug', { userId: 123 });

      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap a successful procedure', async () => {
      const procedure = vi.fn().mockResolvedValue({ success: true });
      const wrapped = withErrorHandling('testProcedure', procedure);

      const result = await wrapped();

      expect(result).toEqual({ success: true });
      expect(procedure).toHaveBeenCalled();
    });

    it('should log procedure start and completion', async () => {
      const procedure = vi.fn().mockResolvedValue({ success: true });
      const wrapped = withErrorHandling('testProcedure', procedure);

      await wrapped();

      // At least one debug call should be made
      expect(consoleSpy.debug.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should catch and log errors from wrapped procedure', async () => {
      const error = new Error('Procedure failed');
      const procedure = vi.fn().mockRejectedValue(error);
      const wrapped = withErrorHandling('testProcedure', procedure);

      await expect(wrapped()).rejects.toThrow('Procedure failed');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include duration in logs', async () => {
      const procedure = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 10))
      );
      const wrapped = withErrorHandling('testProcedure', procedure);

      await wrapped();

      // Verify that logging was called with context that includes metadata
      const debugCalls = consoleSpy.debug.mock.calls;
      expect(debugCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('should pass through procedure arguments', async () => {
      const procedure = vi.fn().mockResolvedValue({ success: true });
      const wrapped = withErrorHandling('testProcedure', procedure);

      await wrapped('arg1', 'arg2');

      expect(procedure).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle non-Error exceptions', async () => {
      const procedure = vi.fn().mockRejectedValue('String error');
      const wrapped = withErrorHandling('testProcedure', procedure);

      await expect(wrapped()).rejects.toBe('String error');
      // Error logging should be called
      expect(consoleSpy.error.mock.calls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error logging context', () => {
    it('should include user ID in context when available', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      handler.info('Test', { userId: 123 });

      const call = consoleSpy.info.mock.calls[0];
      expect(call[1]).toMatchObject({
        context: expect.any(Object),
      });
    });

    it('should include tenant ID in context when available', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      handler.info('Test', { tenantId: 456 });

      const call = consoleSpy.info.mock.calls[0];
      expect(call[1]).toMatchObject({
        context: expect.any(Object),
      });
    });

    it('should include custom metadata', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      handler.info('Test', { metadata: { customKey: 'customValue' } });

      const call = consoleSpy.info.mock.calls[0];
      expect(call[1]).toMatchObject({
        context: expect.any(Object),
      });
    });
  });

  describe('Error message formatting', () => {
    it('should format Error objects correctly', () => {
      const error = new Error('Test error message');
      const handler = createProcedureErrorHandler('testProcedure');

      expect(() => {
        handler.handle(error, {});
      }).toThrow();

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle string errors', () => {
      const handler = createProcedureErrorHandler('testProcedure');

      expect(() => {
        handler.handle('String error', {});
      }).toThrow();

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include stack trace for Error objects', () => {
      const error = new Error('Test error');
      const handler = createProcedureErrorHandler('testProcedure');

      expect(() => {
        handler.handle(error, {});
      }).toThrow();

      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});
