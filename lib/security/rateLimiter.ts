// Sliding Window Rate Limiting Engine
// Protects endpoints against brute-force attacks, credential stuffing, and DoS.

interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil?: number;
  consecutiveFailures: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  delayMs?: number;
  isLockedOut?: boolean;
}

/**
 * Checks and updates rate limit for a specific key (IP, User ID, or Endpoint)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
  progressiveLockout = false
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = rateLimitStore.get(key);

  // Check if actively locked out
  if (record?.lockedUntil && record.lockedUntil > now) {
    const remainingLockSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: remainingLockSeconds,
      isLockedOut: true,
    };
  }

  // If record does not exist or has expired, initialize
  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
      consecutiveFailures: 0,
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetSeconds: windowSeconds,
    };
  }

  // Increment count
  record.count += 1;

  if (record.count > maxRequests) {
    if (progressiveLockout) {
      record.consecutiveFailures += 1;
      // Lockout for 15 minutes if repeated violations
      record.lockedUntil = now + 15 * 60 * 1000;
    }
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      isLockedOut: progressiveLockout,
    };
  }

  // Artificial progressive delay on 3rd or 4th attempt
  let delayMs = 0;
  if (progressiveLockout && record.count >= 3) {
    delayMs = (record.count - 2) * 1000; // 1s on 3rd, 2s on 4th
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetSeconds: Math.ceil((record.resetAt - now) / 1000),
    delayMs,
  };
}

/**
 * Resets rate limit for a key upon successful authentication
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Specific rate limiters for HRIS subsystems
 */
export const RateLimiters = {
  // Login: 5 attempts per 5 minutes with progressive lockout
  authLogin: (ipOrEmail: string) => checkRateLimit(`login:${ipOrEmail}`, 5, 300, true),

  // Password Reset: 3 attempts per 15 minutes
  passwordReset: (email: string) => checkRateLimit(`reset:${email}`, 3, 900, true),

  // Sensitive Financial & Payroll Actions: 10 per minute
  payrollAction: (userId: string) => checkRateLimit(`payroll:${userId}`, 10, 60, false),

  // General API: 60 per minute per IP
  generalApi: (ip: string) => checkRateLimit(`api:${ip}`, 60, 60, false),

  // Search & Reports: 20 per minute
  dataExport: (userId: string) => checkRateLimit(`export:${userId}`, 20, 60, false),
};
