import { describe, it, expect, beforeAll } from 'vitest';
import { tokenEncryption } from './lib/token-encryption';

describe('Token Encryption', () => {
  beforeAll(() => {
    // Verify TOKEN_ENCRYPTION_KEY is set
    if (!process.env.TOKEN_ENCRYPTION_KEY) {
      throw new Error('TOKEN_ENCRYPTION_KEY not set');
    }
  });

  it('should have TOKEN_ENCRYPTION_KEY configured', () => {
    expect(process.env.TOKEN_ENCRYPTION_KEY).toBeDefined();
    expect(process.env.TOKEN_ENCRYPTION_KEY).not.toBe('');
    expect(process.env.TOKEN_ENCRYPTION_KEY!.length).toBe(64); // 32 bytes in hex = 64 characters
  });

  it('should encrypt and decrypt tokens correctly', () => {
    const originalToken = 'test-access-token-12345';
    
    // Encrypt the token
    const encrypted = tokenEncryption.encrypt(originalToken);
    
    // Encrypted should be different from original
    expect(encrypted).not.toBe(originalToken);
    expect(encrypted.length).toBeGreaterThan(originalToken.length);
    
    // Decrypt should return original
    const decrypted = tokenEncryption.decrypt(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  it('should generate consistent hashes for same token', () => {
    const token = 'test-token-for-hashing';
    
    const hash1 = tokenEncryption.hashToken(token);
    const hash2 = tokenEncryption.hashToken(token);
    
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(0);
  });

  it('should generate different hashes for different tokens', () => {
    const token1 = 'token-one';
    const token2 = 'token-two';
    
    const hash1 = tokenEncryption.hashToken(token1);
    const hash2 = tokenEncryption.hashToken(token2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should handle encryption of long tokens', () => {
    const longToken = 'a'.repeat(500); // 500 character token
    
    const encrypted = tokenEncryption.encrypt(longToken);
    const decrypted = tokenEncryption.decrypt(encrypted);
    
    expect(decrypted).toBe(longToken);
  });

  it('should handle encryption of tokens with special characters', () => {
    const specialToken = 'token!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    
    const encrypted = tokenEncryption.encrypt(specialToken);
    const decrypted = tokenEncryption.decrypt(encrypted);
    
    expect(decrypted).toBe(specialToken);
  });

  it('should return current key version', () => {
    const version = tokenEncryption.getCurrentKeyVersion();
    
    expect(version).toBeDefined();
    expect(typeof version).toBe('number');
    expect(version).toBeGreaterThanOrEqual(1);
  });

  it('should produce different encrypted values for same plaintext (IV randomization)', () => {
    const token = 'same-token';
    
    const encrypted1 = tokenEncryption.encrypt(token);
    const encrypted2 = tokenEncryption.encrypt(token);
    
    // Should be different due to random IV
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to same value
    expect(tokenEncryption.decrypt(encrypted1)).toBe(token);
    expect(tokenEncryption.decrypt(encrypted2)).toBe(token);
  });

  it('should handle empty string encryption', () => {
    const emptyToken = '';
    
    const encrypted = tokenEncryption.encrypt(emptyToken);
    const decrypted = tokenEncryption.decrypt(encrypted);
    
    expect(decrypted).toBe(emptyToken);
  });
});
