'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LicenseKey, getKeyStatus } from '@/lib/types';
import { format } from 'date-fns';
import { InputModal, ConfirmModal, AlertModal } from '@/components/Modal';
import { EditKeyModal } from '@/components/EditKeyModal';
import { EmailDraftModal } from '@/components/EmailDraftModal';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const email = decodeURIComponent(params.email as string);
  
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [extendModal, setExtendModal] = useState<{ isOpen: boolean; keyValue: string | null }>({ isOpen: false, keyValue: null });
  const [dealClosedModal, setDealClosedModal] = useState<{ isOpen: boolean; keyValue: string | null }>({ isOpen: false, keyValue: null });
  const [disableModal, setDisableModal] = useState<{ isOpen: boolean; keyValue: string | null }>({ isOpen: false, keyValue: null });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; key: LicenseKey | null }>({ isOpen: false, key: null });
  const [emailDraftModal, setEmailDraftModal] = useState<{ 
    isOpen: boolean; 
    key: LicenseKey | null;
    emailType: 'trial' | 'dealClosed';
    productionKey?: LicenseKey;
    developmentKey?: LicenseKey;
    activeFlowsLimit?: number;
  }>({ isOpen: false, key: null, emailType: 'trial' });
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ 
    isOpen: false, title: '', message: '', type: 'info' 
  });

  const fetchKeys = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/users/${encodeURIComponent(email)}/keys?_t=${timestamp}`, {
        cache: 'no-store',
      });
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

  const handleExtendKey = async (days: string) => {
    const keyValue = extendModal.keyValue;
    if (!keyValue) return;

    setActionLoading(keyValue);
    try {
      const response = await fetch(`/api/keys/${keyValue}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_days: parseInt(days) }),
      });

      if (response.ok) {
        await fetchKeys();
        setAlertModal({ isOpen: true, title: 'Success', message: 'Key extended successfully!', type: 'success' });
      } else {
        const result = await response.json();
        setAlertModal({ isOpen: true, title: 'Error', message: result.error, type: 'error' });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to extend key', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDealClosed = async (limit: string) => {
    const keyValue = dealClosedModal.keyValue;
    if (!keyValue) return;

    setActionLoading(keyValue);
    try {
      // First, close the deal without sending email
      const response = await fetch(`/api/keys/${keyValue}/deal-closed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeFlows: parseInt(limit), sendEmail: false }),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchKeys();
        
        // Show email draft modal with both keys
        setEmailDraftModal({ 
          isOpen: true, 
          key: result.data.productionKey,
          emailType: 'dealClosed',
          productionKey: result.data.productionKey,
          developmentKey: result.data.developmentKey,
          activeFlowsLimit: parseInt(limit),
        });
      } else {
        const result = await response.json();
        setAlertModal({ isOpen: true, title: 'Error', message: result.error, type: 'error' });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to close deal', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisableKey = async () => {
    const keyValue = disableModal.keyValue;
    if (!keyValue) return;

    setActionLoading(keyValue);
    try {
      const response = await fetch(`/api/keys/${keyValue}/disable`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchKeys();
        setAlertModal({ isOpen: true, title: 'Success', message: 'Key disabled successfully!', type: 'success' });
      } else {
        const result = await response.json();
        setAlertModal({ isOpen: true, title: 'Error', message: result.error, type: 'error' });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to disable key', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateKey = async (keyValue: string) => {
    setActionLoading(keyValue);
    try {
      const response = await fetch(`/api/keys/${keyValue}/reactivate`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchKeys();
        setAlertModal({ isOpen: true, title: 'Success', message: 'Key reactivated successfully!', type: 'success' });
      } else {
        const result = await response.json();
        setAlertModal({ isOpen: true, title: 'Error', message: result.error, type: 'error' });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to reactivate key', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async (subject: string, body: string) => {
    const keyValue = emailDraftModal.key?.key;
    if (!keyValue) return;

    setActionLoading(keyValue);
    try {
      const response = await fetch(`/api/keys/${keyValue}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlBody: body }),
      });

      if (response.ok) {
        const message = emailDraftModal.emailType === 'dealClosed' 
          ? 'Deal closed successfully! Email sent with both Development and Production keys.' 
          : 'Email sent successfully!';
        setAlertModal({ isOpen: true, title: 'Success', message, type: 'success' });
      } else {
        const result = await response.json();
        setAlertModal({ isOpen: true, title: 'Error', message: result.error, type: 'error' });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to send email', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendBothKeysEmail = () => {
    // Find one development and one production key that are active
    const devKey = developmentKeys.find(k => getKeyStatus(k) === 'active');
    const prodKey = productionKeys.find(k => getKeyStatus(k) === 'active');

    if (!devKey || !prodKey) {
      setAlertModal({ 
        isOpen: true, 
        title: 'Error', 
        message: 'Need at least one active Development key and one active Production key to send both keys email.', 
        type: 'error' 
      });
      return;
    }

    // Show email draft modal with both keys
    setEmailDraftModal({ 
      isOpen: true, 
      key: prodKey,
      emailType: 'dealClosed',
      productionKey: prodKey,
      developmentKey: devKey,
      activeFlowsLimit: prodKey.activeFlows || devKey.activeFlows,
    });
  };

  const handleEditKey = async (updatedData: Partial<LicenseKey>) => {
    const keyValue = editModal.key?.key;
    if (!keyValue) return;

    setActionLoading(keyValue);
    try {
      const response = await fetch(`/api/keys/${keyValue}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        await fetchKeys();
        setAlertModal({ 
          isOpen: true, 
          title: 'Success', 
          message: 'License key updated successfully!', 
          type: 'success' 
        });
      } else {
        const result = await response.json();
        setAlertModal({ isOpen: true, title: 'Error', message: result.error, type: 'error' });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to update license key', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (key: LicenseKey) => {
    const status = getKeyStatus(key);
    const colors = {
      active: 'bg-green-100 text-green-800',
      disabled: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status]}`}>
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
    if (!dateString) return 'Never (Subscribed)';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getEnabledFeaturesCount = (key: LicenseKey) => {
    const features = [
      key.ssoEnabled && 'SSO',
      key.gitSyncEnabled && 'Git Sync',
      key.embeddingEnabled && 'Embedding',
      key.auditLogEnabled && 'Audit Logs',
      key.customAppearanceEnabled && 'Custom Appearance',
      key.manageProjectsEnabled && 'Projects',
      key.managePiecesEnabled && 'Pieces',
      key.manageTemplatesEnabled && 'Templates',
      key.apiKeysEnabled && 'API Keys',
      key.customDomainsEnabled && 'Custom Domains',
      key.projectRolesEnabled && 'Project Roles',
      key.flowIssuesEnabled && 'Flow Issues',
      key.alertsEnabled && 'Alerts',
      key.analyticsEnabled && 'Analytics',
      key.globalConnectionsEnabled && 'Global Connections',
      key.customRolesEnabled && 'Custom Roles',
      key.environmentsEnabled && 'Environments',
      key.agentsEnabled && 'Agents',
      key.tablesEnabled && 'Tables',
      key.todosEnabled && 'Todos',
      key.mcpsEnabled && 'MCPs',
    ].filter(Boolean);
    
    return features.length;
  };

  // Group keys by type
  const trialKeys = keys.filter(k => k.keyType === 'trial');
  const developmentKeys = keys.filter(k => k.keyType === 'development');
  const productionKeys = keys.filter(k => k.keyType === 'production');

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
          <div className="flex gap-2">
            {developmentKeys.some(k => getKeyStatus(k) === 'active') && 
             productionKeys.some(k => getKeyStatus(k) === 'active') && (
              <button
                onClick={handleSendBothKeysEmail}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
              >
                📧 Send Both Keys Email
              </button>
            )}
            <button
              onClick={() => fetchKeys()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-blue-600 mb-1">Trial Keys</div>
          <div className="text-3xl font-bold text-gray-900">{trialKeys.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            Active: {trialKeys.filter(k => getKeyStatus(k) === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-purple-600 mb-1">Development Keys</div>
          <div className="text-3xl font-bold text-gray-900">{developmentKeys.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            Active: {developmentKeys.filter(k => getKeyStatus(k) === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-indigo-600 mb-1">Production Keys</div>
          <div className="text-3xl font-bold text-gray-900">{productionKeys.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            Active: {productionKeys.filter(k => getKeyStatus(k) === 'active').length}
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
                    key={key.key}
                    licenseKey={key}
                    onExtend={handleExtendKey}
                    onDealClosed={handleDealClosed}
                    onDisable={handleDisableKey}
                    onReactivate={handleReactivateKey}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getKeyTypeBadge={getKeyTypeBadge}
                    formatDate={formatDate}
                    getEnabledFeaturesCount={getEnabledFeaturesCount}
                    setExtendModal={setExtendModal}
                    setDealClosedModal={setDealClosedModal}
                    setDisableModal={setDisableModal}
                    setEditModal={setEditModal}
                    setEmailDraftModal={setEmailDraftModal}
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
                    key={key.key}
                    licenseKey={key}
                    onExtend={handleExtendKey}
                    onDealClosed={handleDealClosed}
                    onDisable={handleDisableKey}
                    onReactivate={handleReactivateKey}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getKeyTypeBadge={getKeyTypeBadge}
                    formatDate={formatDate}
                    getEnabledFeaturesCount={getEnabledFeaturesCount}
                    setExtendModal={setExtendModal}
                    setDealClosedModal={setDealClosedModal}
                    setDisableModal={setDisableModal}
                    setEditModal={setEditModal}
                    setEmailDraftModal={setEmailDraftModal}
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
                    key={key.key}
                    licenseKey={key}
                    onExtend={handleExtendKey}
                    onDealClosed={handleDealClosed}
                    onDisable={handleDisableKey}
                    onReactivate={handleReactivateKey}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getKeyTypeBadge={getKeyTypeBadge}
                    formatDate={formatDate}
                    getEnabledFeaturesCount={getEnabledFeaturesCount}
                    setExtendModal={setExtendModal}
                    setDealClosedModal={setDealClosedModal}
                    setDisableModal={setDisableModal}
                    setEditModal={setEditModal}
                    setEmailDraftModal={setEmailDraftModal}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <InputModal
        isOpen={extendModal.isOpen}
        onClose={() => setExtendModal({ isOpen: false, keyValue: null })}
        onSubmit={handleExtendKey}
        title="Extend Trial Key"
        message="Enter the number of days to extend this trial key:"
        placeholder="7"
        defaultValue="7"
        inputType="number"
        submitText="Extend"
      />

      <InputModal
        isOpen={dealClosedModal.isOpen}
        onClose={() => setDealClosedModal({ isOpen: false, keyValue: null })}
        onSubmit={handleDealClosed}
        title="Deal Closed"
        message="Enter the Active Flows Limit for this customer:"
        placeholder="1000"
        defaultValue="1000"
        inputType="number"
        submitText="Close Deal"
      />

      <ConfirmModal
        isOpen={disableModal.isOpen}
        onClose={() => setDisableModal({ isOpen: false, keyValue: null })}
        onConfirm={handleDisableKey}
        title="Disable Key"
        message="Are you sure you want to disable this license key? This action can be reversed later."
        confirmText="Disable"
        cancelText="Cancel"
        confirmColor="red"
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <EditKeyModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, key: null })}
        onSave={handleEditKey}
        licenseKey={editModal.key}
      />

      <EmailDraftModal
        isOpen={emailDraftModal.isOpen}
        onClose={() => setEmailDraftModal({ isOpen: false, key: null, emailType: 'trial' })}
        onSend={handleSendEmail}
        licenseKey={emailDraftModal.key}
        emailType={emailDraftModal.emailType}
        productionKey={emailDraftModal.productionKey}
        developmentKey={emailDraftModal.developmentKey}
        activeFlowsLimit={emailDraftModal.activeFlowsLimit}
      />
    </div>
  );
}

// Key Card Component
interface KeyCardProps {
  licenseKey: LicenseKey;
  onExtend: (id: string) => void;
  onDealClosed: (id: string) => void;
  onDisable: (id: string) => void;
  onReactivate: (id: string) => void;
  actionLoading: string | null;
  getStatusBadge: (key: LicenseKey) => JSX.Element;
  getKeyTypeBadge: (type: string) => JSX.Element;
  formatDate: (date: string | null) => string;
  getEnabledFeaturesCount: (key: LicenseKey) => number;
  setExtendModal: (state: { isOpen: boolean; keyValue: string | null }) => void;
  setDealClosedModal: (state: { isOpen: boolean; keyValue: string | null }) => void;
  setDisableModal: (state: { isOpen: boolean; keyValue: string | null }) => void;
  setEditModal: (state: { isOpen: boolean; key: LicenseKey | null }) => void;
  setEmailDraftModal: (state: { isOpen: boolean; key: LicenseKey | null; emailType: 'trial' | 'dealClosed' }) => void;
}

function KeyCard({
  licenseKey,
  onExtend,
  onDealClosed,
  onDisable,
  onReactivate,
  actionLoading,
  getStatusBadge,
  getKeyTypeBadge,
  formatDate,
  getEnabledFeaturesCount,
  setExtendModal,
  setDealClosedModal,
  setDisableModal,
  setEditModal,
  setEmailDraftModal,
}: KeyCardProps) {
  const status = getKeyStatus(licenseKey);
  
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getKeyTypeBadge(licenseKey.keyType)}
          {getStatusBadge(licenseKey)}
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
            {licenseKey.activeFlows || 'Unlimited'}
          </p>
        </div>
      </div>

      {licenseKey.companyName && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Company</p>
          <p className="text-sm font-medium text-gray-900">{licenseKey.companyName}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Created</p>
          <p className="text-sm font-medium text-gray-900">{format(new Date(licenseKey.createdAt), 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Activated</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(licenseKey.activatedAt)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Expires</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(licenseKey.expiresAt)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Enabled Features: {getEnabledFeaturesCount(licenseKey)}
        </p>
      </div>

      {licenseKey.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Notes</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{licenseKey.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => setEditModal({ isOpen: true, key: licenseKey })}
          disabled={actionLoading === licenseKey.key}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
        >
          ✏️ Edit
        </button>
        {status === 'active' && licenseKey.isTrial && (
          <>
            <button
              onClick={() => setExtendModal({ isOpen: true, keyValue: licenseKey.key })}
              disabled={actionLoading === licenseKey.key}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              Extend Trial
            </button>
            <button
              onClick={() => setDealClosedModal({ isOpen: true, keyValue: licenseKey.key })}
              disabled={actionLoading === licenseKey.key}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              Deal Closed
            </button>
          </>
        )}
        {status === 'active' && (
          <button
            onClick={() => setEmailDraftModal({ isOpen: true, key: licenseKey, emailType: 'trial' })}
            disabled={actionLoading === licenseKey.key}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
          >
            Send Email
          </button>
        )}
        {status === 'disabled' ? (
          <button
            onClick={() => onReactivate(licenseKey.key)}
            disabled={actionLoading === licenseKey.key}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
          >
            Reactivate Key
          </button>
        ) : (
          <button
            onClick={() => setDisableModal({ isOpen: true, keyValue: licenseKey.key })}
            disabled={actionLoading === licenseKey.key}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
          >
            Disable Key
          </button>
        )}
        {actionLoading === licenseKey.key && (
          <span className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
            Processing...
          </span>
        )}
      </div>
    </div>
  );
}
