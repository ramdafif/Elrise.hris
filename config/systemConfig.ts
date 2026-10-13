/**
 * SYSTEM CONFIGURATION HIERARCHY — NUSANTARA HRIS ENTERPRISE
 * 
 * Prioritas Konfigurasi:
 * 1. System Defaults (Hard guarantees)
 * 2. Tenant Configuration (Per-Tenant SLA / Customization)
 * 3. Company Configuration (Per-Legal Entity overrides, NPWP, Bank)
 * 4. Employee Configuration (Specific individual contracts)
 */

export interface SystemConfiguration {
  platformName: string;
  supportEmail: string;
  defaultTimezone: string;
  defaultLocale: string;
  defaultCurrency: string;
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  auditLogRetentionDays: number;
  geofenceDefaultRadiusMeters: number;
  defaultWorkStartTime: string; // Standard check-in time e.g. "08:30"
  defaultWorkEndTime: string; // Standard check-out time e.g. "17:00"
  maxOvertimeHoursPerDay: number; // PP 35/2021: Max 4 hours/day
  maxOvertimeHoursPerWeek: number; // PP 35/2021: Max 18 hours/week
}

export const SYSTEM_CONFIG: SystemConfiguration = {
  platformName: 'Nusantara HRIS Enterprise',
  supportEmail: 'support@nusantaratech.co.id',
  defaultTimezone: 'Asia/Jakarta',
  defaultLocale: 'id-ID',
  defaultCurrency: 'IDR',
  sessionTimeoutMinutes: 60,
  maxFailedLoginAttempts: 5,
  auditLogRetentionDays: 365 * 3, // 3 years active retention
  geofenceDefaultRadiusMeters: 150,
  defaultWorkStartTime: '08:30',
  defaultWorkEndTime: '17:00',
  maxOvertimeHoursPerDay: 4,
  maxOvertimeHoursPerWeek: 18,
};
