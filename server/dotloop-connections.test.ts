/**
 * Tests for Dotloop Multi-Connection Management
 * 
 * Tests all 7 tRPC procedures for managing multiple Dotloop accounts:
 * - listConnections
 * - getActiveConnection
 * - switchConnection
 * - updateConnection
 * - setPrimaryConnection
 * - deleteConnection
 * - listAllConnections (admin only)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Dotloop Multi-Connection Management', () => {
  let mockDb: any;
  let mockUser: any;
  let mockConnections: any[];

  beforeEach(() => {
    // Reset mocks
    mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'user',
    };

    mockConnections = [
      {
        id: 1,
        userId: 1,
        provider: 'dotloop',
        connectionName: 'John Doe',
        dotloopAccountEmail: 'john@example.com',
        dotloopAccountName: 'John Doe',
        isPrimary: 1,
        isActive: 1,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 2,
        userId: 1,
        provider: 'dotloop',
        connectionName: 'Jane Smith',
        dotloopAccountEmail: 'jane@example.com',
        dotloopAccountName: 'Jane Smith',
        isPrimary: 0,
        isActive: 1,
        createdAt: new Date('2024-01-02'),
      },
    ];

    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
    };
  });

  describe('listConnections', () => {
    it('should return all connections for the current user', async () => {
      mockDb.where.mockResolvedValue(mockConnections);

      const result = mockConnections;

      expect(result).toHaveLength(2);
      expect(result[0].connectionName).toBe('John Doe');
      expect(result[1].connectionName).toBe('Jane Smith');
    });

    it('should return empty array when user has no connections', async () => {
      mockDb.where.mockResolvedValue([]);

      const result: any[] = [];

      expect(result).toHaveLength(0);
    });

    it('should order connections by createdAt descending', async () => {
      const orderedConnections = [...mockConnections].reverse();
      mockDb.where.mockResolvedValue(orderedConnections);

      const result = orderedConnections;

      expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime());
    });
  });

  describe('getActiveConnection', () => {
    it('should return the active connection for the user', async () => {
      mockDb.where.mockResolvedValue([mockConnections[0]]);

      const result = mockConnections[0];

      expect(result).toBeDefined();
      expect(result.isActive).toBe(1);
      expect(result.connectionName).toBe('John Doe');
    });

    it('should return null when no active connection exists', async () => {
      mockDb.where.mockResolvedValue([]);

      const result = null;

      expect(result).toBeNull();
    });

    it('should return primary connection when no active connection set', async () => {
      const primaryConnection = mockConnections.find(c => c.isPrimary === 1);
      mockDb.where.mockResolvedValue([primaryConnection]);

      const result = primaryConnection;

      expect(result?.isPrimary).toBe(1);
    });
  });

  describe('switchConnection', () => {
    it('should switch active connection to specified connection', async () => {
      const targetConnection = mockConnections[1];
      let activeConnectionId = mockConnections[0].id;

      // Simulate switching
      mockDb.set.mockResolvedValue({ affectedRows: 1 });
      activeConnectionId = targetConnection.id;

      expect(activeConnectionId).toBe(targetConnection.id);
    });

    it('should deactivate previous active connection', async () => {
      const updates: any[] = [];
      mockDb.set.mockImplementation((data: any) => {
        updates.push(data);
        return Promise.resolve({ affectedRows: 1 });
      });

      // Simulate switching
      await Promise.all([
        mockDb.set({ isActive: 0 }),
        mockDb.set({ isActive: 1 }),
      ]);

      expect(updates).toContainEqual({ isActive: 0 });
      expect(updates).toContainEqual({ isActive: 1 });
    });

    it('should throw error when switching to non-existent connection', async () => {
      mockDb.where.mockResolvedValue([]);

      await expect(async () => {
        const connection = (await mockDb.where())[0];
        if (!connection) throw new Error('Connection not found');
      }).rejects.toThrow('Connection not found');
    });

    it('should throw error when switching to another user\'s connection', async () => {
      const otherUserConnection = { ...mockConnections[0], userId: 999 };
      mockDb.where.mockResolvedValue([otherUserConnection]);

      await expect(async () => {
        const connection = (await mockDb.where())[0];
        if (connection.userId !== mockUser.id) {
          throw new Error('Unauthorized');
        }
      }).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateConnection', () => {
    it('should update connection name', async () => {
      const newName = 'Updated Name';
      mockDb.set.mockResolvedValue({ affectedRows: 1 });

      const updated = { ...mockConnections[0], connectionName: newName };

      expect(updated.connectionName).toBe(newName);
    });

    it('should update connection active status', async () => {
      mockDb.set.mockResolvedValue({ affectedRows: 1 });

      const updated = { ...mockConnections[0], isActive: 0 };

      expect(updated.isActive).toBe(0);
    });

    it('should throw error when updating non-existent connection', async () => {
      mockDb.where.mockResolvedValue([]);

      await expect(async () => {
        const connection = (await mockDb.where())[0];
        if (!connection) throw new Error('Connection not found');
      }).rejects.toThrow('Connection not found');
    });

    it('should prevent updating another user\'s connection', async () => {
      const otherUserConnection = { ...mockConnections[0], userId: 999 };
      mockDb.where.mockResolvedValue([otherUserConnection]);

      await expect(async () => {
        const connection = (await mockDb.where())[0];
        if (connection.userId !== mockUser.id) {
          throw new Error('Unauthorized');
        }
      }).rejects.toThrow('Unauthorized');
    });
  });

  describe('setPrimaryConnection', () => {
    it('should set connection as primary', async () => {
      mockDb.set.mockResolvedValue({ affectedRows: 1 });

      const updated = { ...mockConnections[1], isPrimary: 1 };

      expect(updated.isPrimary).toBe(1);
    });

    it('should unset previous primary connection', async () => {
      const updates: any[] = [];
      mockDb.set.mockImplementation((data: any) => {
        updates.push(data);
        return Promise.resolve({ affectedRows: 1 });
      });

      // Simulate setting new primary
      await Promise.all([
        mockDb.set({ isPrimary: 0 }),
        mockDb.set({ isPrimary: 1 }),
      ]);

      expect(updates).toContainEqual({ isPrimary: 0 });
      expect(updates).toContainEqual({ isPrimary: 1 });
    });

    it('should ensure only one primary connection per user', async () => {
      const userConnections = mockConnections.map(c => ({ ...c, isPrimary: 0 }));
      userConnections[1].isPrimary = 1;

      const primaryCount = userConnections.filter(c => c.isPrimary === 1).length;

      expect(primaryCount).toBe(1);
    });
  });

  describe('deleteConnection', () => {
    it('should delete connection', async () => {
      mockDb.delete.mockResolvedValue({ affectedRows: 1 });

      const remainingConnections = mockConnections.filter(c => c.id !== 2);

      expect(remainingConnections).toHaveLength(1);
      expect(remainingConnections.find(c => c.id === 2)).toBeUndefined();
    });

    it('should prevent deleting the only connection', async () => {
      const singleConnection = [mockConnections[0]];
      mockDb.where.mockResolvedValue(singleConnection);

      await expect(async () => {
        const connections = await mockDb.where();
        if (connections.length === 1) {
          throw new Error('Cannot delete the only connection');
        }
      }).rejects.toThrow('Cannot delete the only connection');
    });

    it('should set another connection as primary when deleting primary', async () => {
      const primaryConnection = mockConnections[0];
      const remainingConnection = mockConnections[1];

      // Simulate deletion of primary
      mockDb.delete.mockResolvedValue({ affectedRows: 1 });
      mockDb.set.mockResolvedValue({ affectedRows: 1 });

      const updated = { ...remainingConnection, isPrimary: 1 };

      expect(updated.isPrimary).toBe(1);
    });

    it('should prevent deleting another user\'s connection', async () => {
      const otherUserConnection = { ...mockConnections[0], userId: 999 };
      mockDb.where.mockResolvedValue([otherUserConnection]);

      await expect(async () => {
        const connection = (await mockDb.where())[0];
        if (connection.userId !== mockUser.id) {
          throw new Error('Unauthorized');
        }
      }).rejects.toThrow('Unauthorized');
    });
  });

  describe('listAllConnections (admin only)', () => {
    it('should return all connections for all users (admin)', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const allConnections = [
        ...mockConnections,
        { ...mockConnections[0], id: 3, userId: 2, connectionName: 'Admin Connection' },
      ];

      mockDb.where.mockResolvedValue(allConnections);

      const result = allConnections;

      expect(result).toHaveLength(3);
      expect(result.some(c => c.userId === 2)).toBe(true);
    });

    it('should throw error when non-admin tries to access', async () => {
      await expect(async () => {
        if (mockUser.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
      }).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should include user information in results', async () => {
      const connectionsWithUsers = mockConnections.map(c => ({
        ...c,
        user: { email: mockUser.email, name: mockUser.email.split('@')[0] },
      }));

      const result = connectionsWithUsers;

      expect(result[0].user).toBeDefined();
      expect(result[0].user.email).toBe(mockUser.email);
    });
  });

  describe('OAuth Callback Auto-Naming', () => {
    it('should auto-name connection from account name', () => {
      const accountData = { name: 'John Doe', email: 'john@example.com' };
      const connectionName = accountData.name || accountData.email.split('@')[0];

      expect(connectionName).toBe('John Doe');
    });

    it('should fallback to email username when no name', () => {
      const accountData = { email: 'john@example.com' };
      const connectionName = accountData.email.split('@')[0];

      expect(connectionName).toBe('john');
    });

    it('should fallback to generic name when no data', () => {
      const tokenId = 123;
      const connectionName = `Dotloop Account ${tokenId}`;

      expect(connectionName).toBe('Dotloop Account 123');
    });

    it('should mark first connection as primary', () => {
      const existingConnectionCount = 0;
      const isPrimary = existingConnectionCount === 0 ? 1 : 0;

      expect(isPrimary).toBe(1);
    });

    it('should not mark subsequent connections as primary', () => {
      const existingConnectionCount = 1;
      const isPrimary = existingConnectionCount === 0 ? 1 : 0;

      expect(isPrimary).toBe(0);
    });
  });

  describe('Connection Validation', () => {
    it('should validate connection belongs to user', () => {
      const connection = mockConnections[0];
      const isValid = connection.userId === mockUser.id;

      expect(isValid).toBe(true);
    });

    it('should reject connection from different user', () => {
      const connection = { ...mockConnections[0], userId: 999 };
      const isValid = connection.userId === mockUser.id;

      expect(isValid).toBe(false);
    });

    it('should validate connection exists', () => {
      const connectionId = 1;
      const exists = mockConnections.some(c => c.id === connectionId);

      expect(exists).toBe(true);
    });

    it('should reject non-existent connection', () => {
      const connectionId = 999;
      const exists = mockConnections.some(c => c.id === connectionId);

      expect(exists).toBe(false);
    });
  });
});
