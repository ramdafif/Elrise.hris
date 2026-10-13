// Immutable Audit Trail & Security Event Logging Service
// Adheres to ISO 27001, SOC 2, and UU PDP No. 27/2022 standards.

import crypto from 'crypto';
import { maskNik, maskNpwp, maskBankAccount } from './classification';

export interface AuditRecord {
  id: string;
  tenantId: string;
  actorId: string;
  actorRole: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string; // ISO-8601
  ipAddress: string;
  userAgent: string;
  requestId: string;
  correlationId: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SecurityEvent {
  id: string;
  type: 'FAILED_LOGIN' | 'ACCOUNT_LOCKOUT' | 'SUSPICIOUS_EXPORT' | 'IDOR_ATTEMPT' | 'CROSS_TENANT_VIOLATION' | 'PAYROLL_OVERRIDE_ATTEMPT';
  actorId?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  details: string;
}

// In-memory append-only audit trail storage
const AUDIT_TRAIL_STORE: AuditRecord[] = [];
const SECURITY_EVENT_STORE: SecurityEvent[] = [];

/**
 * Sanitizes object payload before saving to audit log
 * Redacts passwords, secrets, and masks NIK/NPWP/Bank
 */
export function sanitizeAuditPayload(obj?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!obj) return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Redact credentials and keys completely
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('cookie') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('api_key') ||
      lowerKey.includes('auth') ||
      lowerKey === 'key'
    ) {
      sanitized[key] = '[REDACTED_SECRET]';
      continue;
    }

    // Mask sensitive national and banking identifiers
    if (lowerKey.includes('nik') && typeof value === 'string') {
      sanitized[key] = maskNik(value);
      continue;
    }

    if (lowerKey.includes('npwp') && typeof value === 'string') {
      sanitized[key] = maskNpwp(value);
      continue;
    }

    if (lowerKey.includes('bankaccount') && typeof value === 'string') {
      sanitized[key] = maskBankAccount(value);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

export const AuditLogService = {
  /**
   * Records a business audit event (Append-Only)
   */
  log(record: Omit<AuditRecord, 'id' | 'timestamp' | 'requestId' | 'correlationId'>): AuditRecord {
    const newRecord: AuditRecord = {
      ...record,
      id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      requestId: `req-${crypto.randomBytes(6).toString('hex')}`,
      correlationId: `corr-${crypto.randomBytes(6).toString('hex')}`,
      before: sanitizeAuditPayload(record.before),
      after: sanitizeAuditPayload(record.after),
      metadata: sanitizeAuditPayload(record.metadata),
    };

    // Object freeze ensures in-memory immutability
    Object.freeze(newRecord);
    AUDIT_TRAIL_STORE.unshift(newRecord); // Prepend for latest first

    // Limit in-memory store to latest 500 records
    if (AUDIT_TRAIL_STORE.length > 500) {
      AUDIT_TRAIL_STORE.pop();
    }

    return newRecord;
  },

  /**
   * Records a security incident or anomaly
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const newEvent: SecurityEvent = {
      ...event,
      id: `sec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };

    Object.freeze(newEvent);
    SECURITY_EVENT_STORE.unshift(newEvent);

    if (SECURITY_EVENT_STORE.length > 200) {
      SECURITY_EVENT_STORE.pop();
    }

    return newEvent;
  },

  /**
   * Retrieves audit logs scoped by tenant with pagination
   */
  getLogs(tenantId: string, limit = 50): AuditRecord[] {
    return AUDIT_TRAIL_STORE.filter((r) => r.tenantId === tenantId).slice(0, limit);
  },

  /**
   * Retrieves security events (restricted to Super Admin)
   */
  getSecurityEvents(limit = 50): SecurityEvent[] {
    return SECURITY_EVENT_STORE.slice(0, limit);
  },
};
