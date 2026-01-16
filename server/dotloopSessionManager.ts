/**
 * Dotloop Session Manager
 * 
 * Handles session creation and validation for Dotloop-authenticated users
 */

import { SignJWT, jwtVerify } from 'jose';
import type { DotloopUser } from './dotloopUserManager';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
const SESSION_COOKIE_NAME = 'dotloop_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface SessionPayload {
  userId: number;
  dotloopUserId: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
  tenantId: number;
  iat?: number;
  exp?: number;
  [key: string]: any; // Index signature for JWT compatibility
}

/**
 * Create a session JWT for a Dotloop user
 * @param user - Dotloop user from database
 * @returns JWT token string
 */
export async function createSession(user: DotloopUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.floor(SESSION_DURATION / 1000);

  const payload: SessionPayload = {
    userId: user.id,
    dotloopUserId: user.dotloopUserId,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    iat: now,
    exp,
  };

  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a session JWT
 * @param token - JWT token string
 * @returns Session payload or null if invalid
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('[Session] Verification failed:', error);
    return null;
  }
}

/**
 * Get session cookie name
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/**
 * Get session cookie options for setting in HTTP response
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION,
    path: '/',
  };
}
