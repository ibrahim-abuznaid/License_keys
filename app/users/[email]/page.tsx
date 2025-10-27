'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LicenseKey } from '@/lib/types';
import { format } from 'date-fns';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const email = decodeURIComponent(params.email as string);
  
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(email)}/keys`);
      const result = await response.json();
      
      if (response.ok) {
        setKeys(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch keys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [email]);

  const handleExtendKey = async (keyId: string) => {
    const days = prompt('Enter number of days to extend (default: 7):', '7');
    if (!days) return;

    setActionLoading(keyId);
    try {
      const response = await fetch(`/api/keys/${keyId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_days: parseInt(days) }),
      });

      if (response.ok) {
        await fetchKeys();
        alert('Key extended successfully!');
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to extend key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDealClosed = async (keyId: string) => {
    const limit = prompt('Enter Active Flows Limit:', '1000');
    if (!limit) return;

    if (!confirm('This will convert the trial key to development and create a new production key. Continue?')) {
      return;
    }

    setActionLoading(keyId);
    try {
      const response = await fetch(`/api/keys/${keyId}/deal-closed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_flows_limit: parseInt(limit) }),
      });

      if (response.ok) {
        await fetchKeys();
        alert('Deal closed successfully! Welcome email sent to customer.');
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to close deal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisableKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to disable this key?')) {
      return;
    }

    setActionLoading(keyId);
    try {
      const response = await fetch(`/api/keys/${keyId}/disable`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchKeys();
        alert('Key disabled successfully!');
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to disable key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async (keyId: string) => {
    setActionLoading(keyId);
    try {
      const response = await fetch(`/api/keys/${keyId}/send-email`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Email sent successfully!');
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to send email');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      disabled: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getKeyTypeBadge = (type: string) => {
    const colors = {
      trial: 'bg-blue-100 text-blue-800',
      development: 'bg-purple-100 text-purple-800',
      production: 'bg-indigo-100 text-indigo-800',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getEnabledFeatures = (features: Record<string, boolean>) => {
    const enabled = Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature.replace(/_/g, ' '));
    
    return enabled.length > 0 ? enabled : ['None'];
  };

  // Group keys by type
  const trialKeys = keys.filter(k => k.key_type === 'trial');
  const developmentKeys = keys.filter(k => k.key_type === 'development');
  const productionKeys = keys.filter(k => k.key_type === 'production');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/')}
              className="text-indigo-100 hover:text-white mb-2 flex items-center gap-2 text-sm"
            >
              ← Back to all keys
            </button>
            <h1 className="text-3xl font-bold mb-2">{email}</h1>
            <p className="text-indigo-100">
              Managing {keys.length} license key{keys.length !== 1 ? 's' : ''} for this user
            </p>
          </div>
          <button
            onClick={() => fetchKeys()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-blue-600 mb-1">Trial Keys</div>
          <div className="text-3xl font-bold text-gray-900">{trialKeys.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            Active: {trialKeys.filter(k => k.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-purple-600 mb-1">Development Keys</div>
          <div className="text-3xl font-bold text-gray-900">{developmentKeys.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            Active: {developmentKeys.filter(k => k.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-indigo-600 mb-1">Production Keys</div>
          <div className="text-3xl font-bold text-gray-900">{productionKeys.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            Active: {productionKeys.filter(k => k.status === 'active').length}
          </div>
        </div>
      </div>

      {keys.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No license keys found for this user.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go back and create one
          </button>
        </div>
      ) : (
        <>
          {/* Trial Keys Section */}
          {trialKeys.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-blue-600">🔵</span> Trial Keys
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {trialKeys.map((key) => (
                  <KeyCard
                    key={key.id}
                    licenseKey={key}
                    onExtend={handleExtendKey}
                    onDealClosed={handleDealClosed}
                    onDisable={handleDisableKey}
                    onSendEmail={handleSendEmail}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getKeyTypeBadge={getKeyTypeBadge}
                    formatDate={formatDate}
                    getEnabledFeatures={getEnabledFeatures}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Development Keys Section */}
          {developmentKeys.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-purple-600">🟣</span> Development Keys
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {developmentKeys.map((key) => (
                  <KeyCard
                    key={key.id}
                    licenseKey={key}
                    onExtend={handleExtendKey}
                    onDealClosed={handleDealClosed}
                    onDisable={handleDisableKey}
                    onSendEmail={handleSendEmail}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getKeyTypeBadge={getKeyTypeBadge}
                    formatDate={formatDate}
                    getEnabledFeatures={getEnabledFeatures}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Production Keys Section */}
          {productionKeys.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-indigo-600">🔷</span> Production Keys
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {productionKeys.map((key) => (
                  <KeyCard
                    key={key.id}
                    licenseKey={key}
                    onExtend={handleExtendKey}
                    onDealClosed={handleDealClosed}
                    onDisable={handleDisableKey}
                    onSendEmail={handleSendEmail}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getKeyTypeBadge={getKeyTypeBadge}
                    formatDate={formatDate}
                    getEnabledFeatures={getEnabledFeatures}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Key Card Component
interface KeyCardProps {
  licenseKey: LicenseKey;
  onExtend: (id: string) => void;
  onDealClosed: (id: string) => void;
  onDisable: (id: string) => void;
  onSendEmail: (id: string) => void;
  actionLoading: string | null;
  getStatusBadge: (status: string) => JSX.Element;
  getKeyTypeBadge: (type: string) => JSX.Element;
  formatDate: (date: string | null) => string;
  getEnabledFeatures: (features: Record<string, boolean>) => string[];
}

function KeyCard({
  licenseKey,
  onExtend,
  onDealClosed,
  onDisable,
  onSendEmail,
  actionLoading,
  getStatusBadge,
  getKeyTypeBadge,
  formatDate,
  getEnabledFeatures,
}: KeyCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getKeyTypeBadge(licenseKey.key_type)}
          {getStatusBadge(licenseKey.status)}
          <span className="text-sm text-gray-600">
            {licenseKey.deployment === 'cloud' ? '☁️ Cloud' : '🏢 Self-hosted'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">License Key</p>
          <code className="text-sm bg-gray-100 px-3 py-2 rounded block break-all">
            {licenseKey.key}
          </code>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Active Flows Limit</p>
          <p className="text-lg font-semibold text-gray-900">
            {licenseKey.active_flows_limit || 'Unlimited'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Created</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(licenseKey.created_at)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Activated</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(licenseKey.activated_at)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Expires</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(licenseKey.expires_at)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Enabled Features</p>
        <div className="flex flex-wrap gap-2">
          {getEnabledFeatures(licenseKey.features).map((feature, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {licenseKey.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Notes</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{licenseKey.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        {licenseKey.status === 'active' && licenseKey.key_type === 'trial' && (
          <>
            <button
              onClick={() => onExtend(licenseKey.id)}
              disabled={actionLoading === licenseKey.id}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              Extend Trial
            </button>
            <button
              onClick={() => onDealClosed(licenseKey.id)}
              disabled={actionLoading === licenseKey.id}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              Deal Closed
            </button>
          </>
        )}
        {licenseKey.status === 'active' && (
          <button
            onClick={() => onSendEmail(licenseKey.id)}
            disabled={actionLoading === licenseKey.id}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
          >
            Send Email
          </button>
        )}
        {licenseKey.status !== 'disabled' && (
          <button
            onClick={() => onDisable(licenseKey.id)}
            disabled={actionLoading === licenseKey.id}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
          >
            Disable Key
          </button>
        )}
        {actionLoading === licenseKey.id && (
          <span className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
            Processing...
          </span>
        )}
      </div>
    </div>
  );
}

