import { describe, it, expect } from 'vitest';
import { extractAgentNames } from './lib/agent-sync';

describe('Agent Sync', () => {
  describe('extractAgentNames', () => {
    it('should extract agent names from transactions with "agents" field', () => {
      const transactions = [
        { agents: 'John Smith', loopName: 'Deal 1' },
        { agents: 'Jane Doe', loopName: 'Deal 2' },
        { agents: 'John Smith', loopName: 'Deal 3' }, // Duplicate
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual(['Jane Doe', 'John Smith']); // Sorted
      expect(result.length).toBe(2);
    });

    it('should extract agent names from transactions with "agent" field', () => {
      const transactions = [
        { agent: 'Alice Johnson', loopName: 'Deal 1' },
        { agent: 'Bob Wilson', loopName: 'Deal 2' },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual(['Alice Johnson', 'Bob Wilson']);
    });

    it('should extract agent names from transactions with "agentName" field', () => {
      const transactions = [
        { agentName: 'Carol White', loopName: 'Deal 1' },
        { agentName: 'David Brown', loopName: 'Deal 2' },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual(['Carol White', 'David Brown']);
    });

    it('should extract agent names from transactions with "Agent Name" field', () => {
      const transactions = [
        { 'Agent Name': 'Eve Davis', loopName: 'Deal 1' },
        { 'Agent Name': 'Frank Miller', loopName: 'Deal 2' },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual(['Eve Davis', 'Frank Miller']);
    });

    it('should extract agent names from transactions with "Agents" field (capitalized)', () => {
      const transactions = [
        { 'Agents': 'Grace Lee', loopName: 'Deal 1' },
        { 'Agents': 'Henry Chen', loopName: 'Deal 2' },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual(['Grace Lee', 'Henry Chen']);
    });

    it('should handle whitespace in agent names', () => {
      const transactions = [
        { agents: '  John Smith  ', loopName: 'Deal 1' },
        { agents: 'Jane Doe', loopName: 'Deal 2' },
        { agents: '   ', loopName: 'Deal 3' }, // Empty after trim
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual(['Jane Doe', 'John Smith']);
      expect(result.length).toBe(2);
    });

    it('should skip empty agent names', () => {
      const transactions = [
        { agents: '', loopName: 'Deal 1' },
        { agents: null, loopName: 'Deal 2' },
        { agents: undefined, loopName: 'Deal 3' },
        { agents: 'Valid Agent', loopName: 'Deal 4' },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual(['Valid Agent']);
    });

    it('should handle mixed case agent names', () => {
      const transactions = [
        { agents: 'JOHN SMITH', loopName: 'Deal 1' },
        { agents: 'jane doe', loopName: 'Deal 2' },
        { agents: 'Bob Wilson', loopName: 'Deal 3' },
      ];

      const result = extractAgentNames(transactions);
      // Should preserve original case
      expect(result).toContain('JOHN SMITH');
      expect(result).toContain('jane doe');
      expect(result).toContain('Bob Wilson');
    });

    it('should handle special characters in agent names', () => {
      const transactions = [
        { agents: "O'Brien, Patrick", loopName: 'Deal 1' },
        { agents: 'Jean-Pierre Dupont', loopName: 'Deal 2' },
        { agents: 'María García-López', loopName: 'Deal 3' },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual([
        "Jean-Pierre Dupont",
        "María García-López",
        "O'Brien, Patrick",
      ]); // Sorted
    });

    it('should handle real CSV data from Demo_SoldTest_Data_2025.csv', () => {
      const transactions = [
        { agents: 'William Jackson', loopName: 'Property 1' },
        { agents: 'Jessica Davis', loopName: 'Property 2' },
        { agents: 'Lisa Thomas', loopName: 'Property 3' },
        { agents: 'Amanda Garcia', loopName: 'Property 4' },
        { agents: 'David Martinez', loopName: 'Property 5' },
        { agents: 'Michael Brown', loopName: 'Property 6' },
        { agents: 'Emily Chen', loopName: 'Property 7' },
        { agents: 'Robert Anderson', loopName: 'Property 8' },
        { agents: 'James Wilson', loopName: 'Property 9' },
        { agents: 'Ashley Martin', loopName: 'Property 10' },
        { agents: 'Christopher Harris', loopName: 'Property 11' },
        { agents: 'William Jackson', loopName: 'Property 12' }, // Duplicate
      ];

      const result = extractAgentNames(transactions);
      expect(result.length).toBe(11); // 11 unique agents
      expect(result).toContain('William Jackson');
      expect(result).toContain('Jessica Davis');
      expect(result).toContain('Christopher Harris');
    });

    it('should handle real CSV data from Demo_Brokerage_Data_2025.csv', () => {
      const transactions = [
        { agents: 'Christopher Harris', loopName: 'Property 1' },
        { agents: 'William Jackson', loopName: 'Property 2' },
        { agents: 'Elizabeth White', loopName: 'Property 3' },
        { agents: 'David Martinez', loopName: 'Property 4' },
        { agents: 'Ashley Martin', loopName: 'Property 5' },
        { agents: 'Michael Brown', loopName: 'Property 6' },
        { agents: 'Robert Anderson', loopName: 'Property 7' },
        { agents: 'Lisa Thomas', loopName: 'Property 8' },
        { agents: 'James Wilson', loopName: 'Property 9' },
        { agents: 'Matthew Thompson', loopName: 'Property 10' },
        { agents: 'Amanda Garcia', loopName: 'Property 11' },
        { agents: 'Emily Chen', loopName: 'Property 12' },
        { agents: 'Sarah Miller', loopName: 'Property 13' },
        { agents: 'Christopher Harris', loopName: 'Property 14' }, // Duplicate
      ];

      const result = extractAgentNames(transactions);
      expect(result.length).toBe(13); // 13 unique agents
      expect(result).toContain('Christopher Harris');
      expect(result).toContain('Sarah Miller');
      expect(result).toContain('Matthew Thompson');
    });

    it('should return empty array for empty transactions', () => {
      const transactions: any[] = [];
      const result = extractAgentNames(transactions);
      expect(result).toEqual([]);
    });

    it('should return empty array when no agent fields are present', () => {
      const transactions = [
        { loopName: 'Deal 1', price: 500000 },
        { loopName: 'Deal 2', price: 600000 },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual([]);
    });

    it('should sort agent names alphabetically', () => {
      const transactions = [
        { agents: 'Zebra Agent', loopName: 'Deal 1' },
        { agents: 'Apple Agent', loopName: 'Deal 2' },
        { agents: 'Mango Agent', loopName: 'Deal 3' },
        { agents: 'Banana Agent', loopName: 'Deal 4' },
      ];

      const result = extractAgentNames(transactions);
      expect(result).toEqual([
        'Apple Agent',
        'Banana Agent',
        'Mango Agent',
        'Zebra Agent',
      ]);
    });

    it('should handle large transaction sets efficiently', () => {
      const transactions = Array.from({ length: 1000 }, (_, i) => ({
        agents: `Agent ${String(i % 50).padStart(2, '0')}`,
        loopName: `Deal ${i}`,
      }));

      const result = extractAgentNames(transactions);
      expect(result.length).toBe(50);
    });
  });
});
