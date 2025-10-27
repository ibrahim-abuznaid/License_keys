'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LicenseKey } from '@/lib/types';
import { format } from 'date-fns';

export default function KeyManagementTable() {
  const router = useRouter();
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const url = search 
        ? `/api/keys?search=${encodeURIComponent(search)}`
        : '/api/keys';
      
      const response = await fetch(url);
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getEnabledFeatures = (features: Record<string, boolean>) => {
    return Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature.replace(/_/g, ' '))
      .join(', ') || 'None';
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
                Deployment
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
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm">
                    <button
                      onClick={() => router.push(`/users/${encodeURIComponent(key.customer_email)}`)}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                    >
                      {key.customer_email}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {key.key}
                    </code>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {getKeyTypeBadge(key.key_type)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {getStatusBadge(key.status)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {key.deployment}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatDate(key.created_at)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatDate(key.expires_at)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex gap-2">
                      {key.status === 'active' && key.key_type === 'trial' && (
                        <>
                          <button
                            onClick={() => handleExtendKey(key.id)}
                            disabled={actionLoading === key.id}
                            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                            title="Extend Key"
                          >
                            +Days
                          </button>
                          <button
                            onClick={() => handleDealClosed(key.id)}
                            disabled={actionLoading === key.id}
                            className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                            title="Deal Closed"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleSendEmail(key.id)}
                          disabled={actionLoading === key.id}
                          className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                          title="Send Email"
                        >
                          Email
                        </button>
                      )}
                      {key.status !== 'disabled' && (
                        <button
                          onClick={() => handleDisableKey(key.id)}
                          disabled={actionLoading === key.id}
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
    </div>
  );
}

