/**
 * FEATURE FLAGS ARCHITECTURE — NUSANTARA HRIS ENTERPRISE
 * 
 * Feature flags control module availability without requiring code deployment.
 * NOTE: Feature flags NEVER bypass Role-Based Access Control (RBAC).
 * Authorization must always be enforced in addition to feature flags.
 */

export interface FeatureFlagsConfig {
  ENABLE_RECRUITMENT: boolean;
  ENABLE_PERFORMANCE: boolean;
  ENABLE_MOBILE_ATTENDANCE: boolean;
  ENABLE_PAYROLL: boolean;
  ENABLE_AI_ASSISTANT: boolean;
  ENABLE_DIRECT_BANKING: boolean;
  ENABLE_BPJS_EDABU_EXPORT: boolean;
  ENABLE_ESPT_PPH21_EXPORT: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsConfig = {
  ENABLE_RECRUITMENT: false, // Planned for Stage 2
  ENABLE_PERFORMANCE: false, // Planned for Stage 2
  ENABLE_MOBILE_ATTENDANCE: true, // Active in Stage 1
  ENABLE_PAYROLL: true, // Core Engine Active
  ENABLE_AI_ASSISTANT: true, // Active (Gemini-powered insights)
  ENABLE_DIRECT_BANKING: false, // Batch file export is active, Direct API planned for Stage 3
  ENABLE_BPJS_EDABU_EXPORT: true,
  ENABLE_ESPT_PPH21_EXPORT: true,
};

export function isFeatureEnabled(
  flagName: keyof FeatureFlagsConfig,
  tenantOverrides?: Partial<FeatureFlagsConfig>
): boolean {
  if (tenantOverrides && tenantOverrides[flagName] !== undefined) {
    return !!tenantOverrides[flagName];
  }
  return DEFAULT_FEATURE_FLAGS[flagName] ?? false;
}
