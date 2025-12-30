'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FEATURE_PRESETS, FeaturePreset, LicenseKey, LicenseKeyFeature, LICENSE_KEY_FEATURES, getKeyStatus } from '@/lib/types';
import { EmailDraftModal } from '@/components/EmailDraftModal';
import { format } from 'date-fns';

interface KeyGenerationFormProps {
  onSuccess?: () => void;
  redirectToSubscriber?: boolean;
}

const FEATURE_LABELS: Record<LicenseKeyFeature, string> = {
  ssoEnabled: 'SSO',
  gitSyncEnabled: 'Git Sync',
  showPoweredBy: 'Display "Powered by Activepieces"',
  embeddingEnabled: 'Embedding',
  auditLogEnabled: 'Audit Log',
  customAppearanceEnabled: 'Custom Appearance',
  manageProjectsEnabled: 'Manage Projects',
  managePiecesEnabled: 'Manage Pieces',
  manageTemplatesEnabled: 'Manage Templates',
  apiKeysEnabled: 'API Keys',
  customDomainsEnabled: 'Custom Domains',
  projectRolesEnabled: 'Project Roles',
  flowIssuesEnabled: 'Flow Issues',
  alertsEnabled: 'Alerts',
  analyticsEnabled: 'Analytics',
  globalConnectionsEnabled: 'Global Connections',
  customRolesEnabled: 'Custom Roles',
  environmentsEnabled: 'Environments',
  agentsEnabled: 'Agents',
  tablesEnabled: 'Tables',
  todosEnabled: 'Todos',
  mcpsEnabled: 'MCPs',
};

const DEFAULT_PRESET: FeaturePreset = 'business';

const buildFeatureState = (preset: FeaturePreset): Record<LicenseKeyFeature, boolean> => {
  const defaults = FEATURE_PRESETS[preset] ?? {};
  return LICENSE_KEY_FEATURES.reduce((acc, key) => {
    const value = defaults[key as keyof LicenseKey];
    acc[key] = typeof value === 'boolean' ? value : false;
    return acc;
  }, {} as Record<LicenseKeyFeature, boolean>);
};

export default function KeyGenerationForm({ onSuccess, redirectToSubscriber = false }: KeyGenerationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    valid_days: 14,
    fullName: '',
    companyName: '',
    numberOfEmployees: '',
    goal: '',
    notes: '',
    activeFlows: '',
    preset: DEFAULT_PRESET,
    isSubscribed: false, // If true, valid_days is ignored and expiresAt will be null
  });
  const [features, setFeatures] = useState<Record<LicenseKeyFeature, boolean>>(() => buildFeatureState(DEFAULT_PRESET));
  const [sendEmail, setSendEmail] = useState(true);
  const [emailDraftModal, setEmailDraftModal] = useState<{ isOpen: boolean; key: LicenseKey | null }>({ 
    isOpen: false, 
    key: null 
  });
  const [redirectEmail, setRedirectEmail] = useState<string | null>(null);
  const [existingKeys, setExistingKeys] = useState<LicenseKey[]>([]);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check for existing keys when email changes
  useEffect(() => {
    const checkExistingKeys = async () => {
      if (!formData.email || !formData.email.includes('@')) {
        setExistingKeys([]);
        return;
      }

      setCheckingEmail(true);
      console.log('🔍 Checking for existing keys for:', formData.email);
      
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(formData.email)}/keys`);
        console.log('📊 Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Found keys:', result.data?.length || 0, result.data);
          setExistingKeys(result.data || []);
        } else {
          console.log('⚠️ No keys found or error');
          setExistingKeys([]);
        }
      } catch (error) {
        console.error('❌ Failed to check existing keys:', error);
        setExistingKeys([]);
      } finally {
        setCheckingEmail(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkExistingKeys, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const goToSubscriberPage = useCallback(
    (email?: string) => {
      if (!redirectToSubscriber) return;
      const target = email ?? redirectEmail;
      if (!target) return;
      setRedirectEmail(null);
      router.push(`/users/${encodeURIComponent(target)}`);
    },
    [redirectEmail, redirectToSubscriber, router],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        email: formData.email,
        valid_days: formData.isSubscribed ? null : formData.valid_days,
        fullName: formData.fullName || undefined,
        companyName: formData.companyName || undefined,
        numberOfEmployees: formData.numberOfEmployees || undefined,
        goal: formData.goal || undefined,
        notes: formData.notes || undefined,
        activeFlows: formData.activeFlows ? parseInt(formData.activeFlows) : undefined,
        preset: formData.preset,
        ...features,
        customDomainsEnabled: false, // Always false
      };

      // Create license key
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create license key');
      }

      const createdKey: LicenseKey = result.data;
      setRedirectEmail(createdKey.email ?? null);

      // Show email draft modal if requested
      if (sendEmail) {
        setEmailDraftModal({ isOpen: true, key: createdKey });
      } else {
        goToSubscriberPage(createdKey.email);
      }

      // Reset form
      setFormData({
        email: '',
        valid_days: 14,
        fullName: '',
        companyName: '',
        numberOfEmployees: '',
        goal: '',
        notes: '',
        activeFlows: '',
        preset: DEFAULT_PRESET,
        isSubscribed: false,
      });
      setFeatures(buildFeatureState(DEFAULT_PRESET));
      setSendEmail(true);
      setExistingKeys([]); // Clear existing keys warning

      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: FeaturePreset) => {
    setFormData(prev => ({ ...prev, preset }));
    setFeatures(buildFeatureState(preset));
  };

  const handleFeatureChange = (feature: LicenseKeyFeature, value: boolean) => {
    // customDomainsEnabled is always false
    if (feature === 'customDomainsEnabled') return;
    setFeatures(prev => ({ ...prev, [feature]: value }));
  };

  const handleSendEmail = async (subject: string, body: string) => {
    const keyValue = emailDraftModal.key?.key;
    if (!keyValue) return;

    try {
      const response = await fetch(`/api/keys/${keyValue}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlBody: body }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw so the modal can handle it
    }
  };

  const handleModalClose = () => {
    setEmailDraftModal({ isOpen: false, key: null });
    goToSubscriberPage();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate License Key</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Customer Email */}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Customer Email *
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="customer@example.com"
        />
        
        {/* Checking email indicator */}
        {checkingEmail && (
          <p className="mt-2 text-sm text-gray-500">
            Checking for existing keys...
          </p>
        )}

        {/* Warning for existing keys */}
        {!checkingEmail && existingKeys.length > 0 && (
          <div className="mt-3 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-base font-bold text-yellow-900">
                  ⚠️ Warning: This user already has {existingKeys.length} license {existingKeys.length === 1 ? 'key' : 'keys'}!
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {existingKeys.slice(0, 3).map((key) => {
                      const status = getKeyStatus(key);
                      const statusColor = status === 'active' ? 'text-green-700' : status === 'expired' ? 'text-red-700' : 'text-gray-700';
                      return (
                        <li key={key.key}>
                          <span className="font-medium">{key.keyType}</span> key 
                          <span className={`ml-1 ${statusColor}`}>({status})</span>
                          {key.activatedAt && (
                            <span className="ml-1">
                              - Activated: {format(new Date(key.activatedAt), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </li>
                      );
                    })}
                    {existingKeys.length > 3 && (
                      <li className="text-yellow-600">
                        ... and {existingKeys.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/users/${encodeURIComponent(formData.email)}`)}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    View all keys for this user →
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium text-yellow-800 bg-yellow-100 p-2 rounded">
                  ⚠️ Be careful! You can still proceed to generate a new key, but make sure this is intentional.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Name & Company Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Acme Inc"
          />
        </div>
      </div>

      {/* Number of Employees & Active Flows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="numberOfEmployees" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Employees
          </label>
          <select
            id="numberOfEmployees"
            value={formData.numberOfEmployees}
            onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select...</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-500">201-500</option>
            <option value="501+">501+</option>
          </select>
        </div>
        <div>
          <label htmlFor="activeFlows" className="block text-sm font-medium text-gray-700 mb-2">
            Active Flows Limit
          </label>
          <input
            type="number"
            id="activeFlows"
            value={formData.activeFlows}
            onChange={(e) => setFormData({ ...formData, activeFlows: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="1000"
          />
        </div>
      </div>

      {/* Goal */}
      <div className="mb-4">
        <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
          Customer Goal
        </label>
        <input
          type="text"
          id="goal"
          value={formData.goal}
          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., Automate customer onboarding"
        />
      </div>

      {/* Key Type: Trial or Subscribed */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Key Type *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={!formData.isSubscribed}
              onChange={() => setFormData({ ...formData, isSubscribed: false })}
              className="mr-2"
            />
            Trial (with expiry)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={formData.isSubscribed}
              onChange={() => setFormData({ ...formData, isSubscribed: true })}
              className="mr-2"
            />
            Subscribed (no expiry)
          </label>
        </div>
      </div>

      {/* Valid Days (only shown for trial keys) */}
      {!formData.isSubscribed && (
        <div className="mb-4">
          <label htmlFor="valid_days" className="block text-sm font-medium text-gray-700 mb-2">
            Valid for (days) *
          </label>
          <input
            type="number"
            id="valid_days"
            min="1"
            required
            value={formData.valid_days}
            onChange={(e) => setFormData({ ...formData, valid_days: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}

      {/* Feature Presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Feature Preset *
        </label>
        <div className="flex flex-wrap gap-2">
          {(['minimal', 'business', 'enterprise', 'all'] as FeaturePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.preset === preset
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
      </div>
        <p className="mt-2 text-xs text-gray-500">
          Presets configure the abilities below; adjust anything that needs to be customized before generating the key.
        </p>
    </div>

      {/* Key Abilities */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Key Abilities
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LICENSE_KEY_FEATURES.map((feature) => {
            const isCustomDomains = feature === 'customDomainsEnabled';
            return (
              <label
                key={feature}
                className={`flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm ${
                  isCustomDomains ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isCustomDomains ? false : features[feature]}
                  onChange={(e) => handleFeatureChange(feature, e.target.checked)}
                  disabled={isCustomDomains}
                  className={`mt-1 h-4 w-4 rounded border-gray-300 ${
                    isCustomDomains ? 'text-gray-400' : 'text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
                <span className={`leading-5 ${isCustomDomains ? 'text-gray-500' : ''}`}>
                  {FEATURE_LABELS[feature]}{isCustomDomains ? ' (disabled)' : ''}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Toggle individual abilities to customize the key beyond the selected preset.
        </p>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Internal notes about this key..."
        />
      </div>

      {/* Send Email Option */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Send key email to customer
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Generating...' : 'Generate License Key'}
      </button>
      </form>

      <EmailDraftModal
        isOpen={emailDraftModal.isOpen}
        onClose={handleModalClose}
        onSend={handleSendEmail}
        licenseKey={emailDraftModal.key}
        emailType="trial"
      />
    </>
  );
}
