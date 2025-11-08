'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LicenseKey, getKeyStatus } from '@/lib/types';
import { format } from 'date-fns';
import { InputModal, ConfirmModal, AlertModal } from '@/components/Modal';
import { EditKeyModal } from '@/components/EditKeyModal';
import { EmailDraftModal } from '@/components/EmailDraftModal';
import ReactivateKeyModal from '@/components/ReactivateKeyModal';

export default function KeyManagementTable() {
  const router = useRouter();
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [extendModal, setExtendModal] = useState<{ isOpen: boolean; keyValue: string | null }>({ isOpen: false, keyValue: null });
  const [dealClosedModal, setDealClosedModal] = useState<{ isOpen: boolean; keyValue: string | null }>({ isOpen: false, keyValue: null });
  const [disableModal, setDisableModal] = useState<{ isOpen: boolean; keyValue: string | null }>({ isOpen: false, keyValue: null });
  const [reactivateModal, setReactivateModal] = useState<{ isOpen: boolean; key: LicenseKey | null }>({ isOpen: false, key: null });
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
      const url = search 
        ? `/api/keys?search=${encodeURIComponent(search)}&_t=${timestamp}`
        : `/api/keys?_t=${timestamp}`;
      
      const response = await fetch(url, {
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
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchKeys();
  };

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
    const key = keys.find(k => k.key === keyValue);
    if (!key) return;
    setReactivateModal({ isOpen: true, key });
  };

  const confirmReactivateKey = async (days: number) => {
    const keyValue = reactivateModal.key?.key;
    if (!keyValue) return;

    setActionLoading(keyValue);
    setReactivateModal({ isOpen: false, key: null });
    
    try {
      const response = await fetch(`/api/keys/${keyValue}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
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
      let response;
      
      if (emailDraftModal.emailType === 'dealClosed' && emailDraftModal.developmentKey) {
        // For deal-closed emails, we don't need to call another endpoint
        // The email was already sent or we need to send it via custom email
        // We'll use the send-email endpoint for the production key
        response = await fetch(`/api/keys/${keyValue}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, htmlBody: body }),
        });
      } else {
        // For regular trial emails
        response = await fetch(`/api/keys/${keyValue}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, htmlBody: body }),
        });
      }

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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getKeyTypeBadge = (key: LicenseKey) => {
    // Show "TRIAL" badge for trial keys, otherwise show the actual keyType
    const displayType = key.isTrial ? 'trial' : key.keyType;
    const colors = {
      trial: 'bg-blue-100 text-blue-800',
      development: 'bg-purple-100 text-purple-800',
      production: 'bg-indigo-100 text-indigo-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[displayType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {displayType.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never (Subscribed)';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading && keys.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">License Keys</h2>
        <button
          onClick={() => fetchKeys()}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or domain..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setLoading(true);
                setTimeout(fetchKeys, 100);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No license keys found. Generate your first key above.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.key} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm">
                    <button
                      onClick={() => router.push(`/users/${encodeURIComponent(key.email)}`)}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                    >
                      {key.email}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {key.key}
                    </code>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {getKeyTypeBadge(key)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {getStatusBadge(key)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {key.companyName || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {format(new Date(key.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatDate(key.expiresAt)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setEditModal({ isOpen: true, key })}
                        disabled={actionLoading === key.key}
                        className="text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                        title="Edit Key"
                      >
                        ✏️
                      </button>
                      {getKeyStatus(key) === 'active' && key.isTrial && (
                        <>
                          <button
                            onClick={() => setExtendModal({ isOpen: true, keyValue: key.key })}
                            disabled={actionLoading === key.key}
                            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                            title="Extend Key"
                          >
                            +Days
                          </button>
                          <button
                            onClick={() => setDealClosedModal({ isOpen: true, keyValue: key.key })}
                            disabled={actionLoading === key.key}
                            className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                            title="Deal Closed"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {getKeyStatus(key) === 'active' && (
                        <button
                          onClick={() => setEmailDraftModal({ isOpen: true, key, emailType: 'trial' })}
                          disabled={actionLoading === key.key}
                          className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                          title="Send Email"
                        >
                          Email
                        </button>
                      )}
                      {getKeyStatus(key) === 'disabled' ? (
                        <button
                          onClick={() => handleReactivateKey(key.key)}
                          disabled={actionLoading === key.key}
                          className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                          title="Reactivate Key"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setDisableModal({ isOpen: true, keyValue: key.key })}
                          disabled={actionLoading === key.key}
                          className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                          title="Disable Key"
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {keys.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {keys.length} license key{keys.length !== 1 ? 's' : ''}
        </div>
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
        message="Are you sure you want to disable this license key? This action can be reversed later by extending it."
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

      <ReactivateKeyModal
        isOpen={reactivateModal.isOpen}
        onClose={() => setReactivateModal({ isOpen: false, key: null })}
        onConfirm={confirmReactivateKey}
        keyValue={reactivateModal.key?.key || ''}
        email={reactivateModal.key?.email || ''}
        isTrial={reactivateModal.key?.isTrial || false}
      />
    </div>
  );
}
