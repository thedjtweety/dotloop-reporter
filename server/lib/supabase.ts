/**
 * Supabase Client - DEPRECATED
 *
 * This project uses TiDB (MySQL) for the database, not Supabase.
 * This file is kept for backward compatibility only.
 * All functions throw errors to prevent accidental usage.
 */

type SupabaseClient = any;

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to your .env file.`
    );
  }
  return val;
}

/**
 * Lazy singleton — clients are created on first access so missing env vars
 * only throw at call time, not at module import time (allows tests to stub).
 */
let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (!_public) {
    throw new Error('Supabase is not configured for this project. This project uses TiDB instead.');
  }
  return _public;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    throw new Error('Supabase is not configured for this project. This project uses TiDB instead.');
  }
  return _admin;
}

// Named exports that create on demand — mirrors the spec's import style
export const supabasePublic = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    throw new Error('Supabase is not configured for this project. This project uses TiDB instead.');
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    throw new Error('Supabase is not configured for this project. This project uses TiDB instead.');
  },
});
