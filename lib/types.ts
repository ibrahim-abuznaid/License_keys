export type KeyType = 'development' | 'production';

export interface LicenseKey {
  key: string;
  email: string;
  createdAt: string;
  expiresAt: string | null;
  activatedAt: string | null;
  ssoEnabled: boolean;
  gitSyncEnabled: boolean;
  showPoweredBy: boolean;
  embeddingEnabled: boolean;
  auditLogEnabled: boolean;
  customAppearanceEnabled: boolean;
  manageProjectsEnabled: boolean;
  managePiecesEnabled: boolean;
  manageTemplatesEnabled: boolean;
  apiKeysEnabled: boolean;
  customDomainsEnabled: boolean;
  projectRolesEnabled: boolean;
  flowIssuesEnabled: boolean;
  alertsEnabled: boolean;
  premiumPieces: string[];
  companyName: string | null;
  goal: string | null;
  analyticsEnabled: boolean;
  globalConnectionsEnabled: boolean;
  customRolesEnabled: boolean;
  environmentsEnabled: boolean;
  notes: string | null;
  keyType: KeyType;
  isTrial: boolean | null;
  fullName: string | null;
  numberOfEmployees: string | null;
  agentsEnabled: boolean;
  tablesEnabled: boolean;
  todosEnabled: boolean;
  mcpsEnabled: boolean;
  activeFlows: number | null;
}

export const LICENSE_KEY_FEATURES = [
  'ssoEnabled',
  'gitSyncEnabled',
  'showPoweredBy',
  'embeddingEnabled',
  'auditLogEnabled',
  'customAppearanceEnabled',
  'manageProjectsEnabled',
  'managePiecesEnabled',
  'manageTemplatesEnabled',
  'apiKeysEnabled',
  'customDomainsEnabled',
  'projectRolesEnabled',
  'flowIssuesEnabled',
  'alertsEnabled',
  'analyticsEnabled',
  'globalConnectionsEnabled',
  'customRolesEnabled',
  'environmentsEnabled',
  'agentsEnabled',
  'tablesEnabled',
  'todosEnabled',
  'mcpsEnabled',
] as const;

export type LicenseKeyFeature = typeof LICENSE_KEY_FEATURES[number];

// Helper type for key status (computed from expiresAt)
export type KeyStatus = 'active' | 'disabled' | 'expired';

// Helper function to compute key status
export function getKeyStatus(key: LicenseKey): KeyStatus {
  if (!key.expiresAt) {
    return 'active'; // null means subscribed (no expiry)
  }
  const expiresAt = new Date(key.expiresAt);
  const now = new Date();
  
  // Use UTC dates to avoid timezone issues
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const expireDate = new Date(Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth(), expiresAt.getUTCDate(), 0, 0, 0, 0));
  
  const daysDiff = Math.floor((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    // Expired in the past
    if (daysDiff >= -1) {
      // Expired today or yesterday (likely manually disabled)
      return 'disabled';
    }
    return 'expired';
  } else if (daysDiff === 0) {
    // Expires today (manually disabled)
    return 'disabled';
  }
  return 'active';
}

// Feature presets for convenience
export type FeaturePreset = 'minimal' | 'business' | 'enterprise' | 'all';

export const FEATURE_PRESETS: Record<FeaturePreset, Partial<LicenseKey>> = {
  minimal: {
    ssoEnabled: false,
    gitSyncEnabled: true,
    showPoweredBy: true,
    embeddingEnabled: false,
    auditLogEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    apiKeysEnabled: true,
    customDomainsEnabled: false,
    projectRolesEnabled: false,
    flowIssuesEnabled: true,
    alertsEnabled: true,
    analyticsEnabled: true,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    agentsEnabled: false,
    tablesEnabled: false,
    todosEnabled: true,
    mcpsEnabled: false,
  },
  business: {
    ssoEnabled: true,
    gitSyncEnabled: true,
    showPoweredBy: true,
    embeddingEnabled: false,
    auditLogEnabled: true,
    customAppearanceEnabled: true,
    manageProjectsEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    apiKeysEnabled: true,
    customDomainsEnabled: false,
    projectRolesEnabled: true,
    flowIssuesEnabled: true,
    alertsEnabled: true,
    analyticsEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: false,
    environmentsEnabled: false,
    agentsEnabled: false,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: false,
  },
  enterprise: {
    ssoEnabled: true,
    gitSyncEnabled: true,
    showPoweredBy: false,
    embeddingEnabled: true,
    auditLogEnabled: true,
    customAppearanceEnabled: true,
    manageProjectsEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    apiKeysEnabled: true,
    customDomainsEnabled: false,
    projectRolesEnabled: true,
    flowIssuesEnabled: true,
    alertsEnabled: true,
    analyticsEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: true,
    environmentsEnabled: true,
    agentsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: true,
  },
  all: {
    ssoEnabled: true,
    gitSyncEnabled: true,
    showPoweredBy: false,
    embeddingEnabled: true,
    auditLogEnabled: true,
    customAppearanceEnabled: true,
    manageProjectsEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    apiKeysEnabled: true,
    customDomainsEnabled: false,
    projectRolesEnabled: true,
    flowIssuesEnabled: true,
    alertsEnabled: true,
    analyticsEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: true,
    environmentsEnabled: true,
    agentsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: true,
  },
};

export interface CreateLicenseKeyInput extends Partial<Record<LicenseKeyFeature, boolean>> {
  email: string;
  valid_days: number | null; // null for subscribed users
  fullName?: string;
  companyName?: string;
  numberOfEmployees?: string;
  goal?: string;
  notes?: string;
  preset?: FeaturePreset;
  activeFlows?: number | null;
}

export interface ExtendKeyInput {
  key: string;
  additional_days: number;
}

export interface DealClosedInput {
  key: string;
  activeFlows?: number;
}

export interface KeyHistory {
  id: string;
  key_value: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  details: Record<string, any> | null;
}
