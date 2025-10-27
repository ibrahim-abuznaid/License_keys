export type DeploymentType = 'cloud' | 'self-hosted';
export type KeyStatus = 'active' | 'disabled' | 'expired';
export type KeyType = 'trial' | 'development' | 'production';

export interface Feature {
  id: string;
  name: string;
  description?: string;
}

export const AVAILABLE_FEATURES: Feature[] = [
  { id: 'templates', name: 'Templates', description: 'Access to template library' },
  { id: 'pieces_management', name: 'Pieces Management', description: 'Custom pieces management' },
  { id: 'sso', name: 'SSO', description: 'Single Sign-On integration' },
  { id: 'audit_logs', name: 'Audit Logs', description: 'Detailed audit logging' },
  { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Advanced analytics and reporting' },
  { id: 'priority_support', name: 'Priority Support', description: 'Priority customer support' },
  { id: 'custom_branding', name: 'Custom Branding', description: 'White-label branding' },
  { id: 'embed_sdk', name: 'Embed SDK', description: 'Embed SDK for integration' },
  { id: 'api_access', name: 'API Access', description: 'Full API access' },
  { id: 'webhooks', name: 'Webhooks', description: 'Webhook support' },
];

export type FeaturePreset = 'none' | 'all' | 'business' | 'embed';

export const FEATURE_PRESETS: Record<FeaturePreset, string[]> = {
  none: [],
  all: AVAILABLE_FEATURES.map(f => f.id),
  business: AVAILABLE_FEATURES.filter(f => f.id !== 'embed_sdk').map(f => f.id),
  embed: ['embed_sdk', 'templates', 'pieces_management'],
};

export interface LicenseKey {
  id: string;
  key: string;
  customer_email: string;
  deployment: DeploymentType;
  key_type: KeyType;
  status: KeyStatus;
  features: Record<string, boolean>;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  active_flows_limit: number | null;
  notes: string | null;
  created_by: string | null;
}

export interface CreateLicenseKeyInput {
  customer_email: string;
  deployment: DeploymentType;
  features: string[];
  valid_days: number;
}

export interface ExtendKeyInput {
  key_id: string;
  additional_days: number;
}

export interface DealClosedInput {
  key_id: string;
  active_flows_limit: number;
}

export interface KeyHistory {
  id: string;
  key_id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  details: Record<string, any> | null;
}

