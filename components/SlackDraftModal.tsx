'use client';

import { useState, useEffect } from 'react';
import { LicenseKey } from '@/lib/types';

const AVAILABLE_VARIABLES = [
  { name: '{{fullName}}', description: 'Customer full name' },
  { name: '{{email}}', description: 'Customer email' },
  { name: '{{companyName}}', description: 'Company name' },
  { name: '{{expiresAt}}', description: 'Expiry date (formatted)' },
  { name: '{{daysRemaining}}', description: 'Days until expiry' },
  { name: '{{licenseKey}}', description: 'License key value' },
];

interface SlackDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  licenseKey: LicenseKey | null;
}

function resolveVariables(template: string, key: LicenseKey): string {
  const expiresAt = key.expiresAt
    ? new Date(key.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never';

  let daysRemaining = 'N/A';
  if (key.expiresAt) {
    const now = new Date();
    const expires = new Date(key.expiresAt);
    const diff = Math.ceil(
      (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    daysRemaining = diff.toString();
  }

  return template
    .replace(/\{\{fullName\}\}/g, key.fullName || 'N/A')
    .replace(/\{\{email\}\}/g, key.email)
    .replace(/\{\{companyName\}\}/g, key.companyName || 'N/A')
    .replace(/\{\{expiresAt\}\}/g, expiresAt)
    .replace(/\{\{daysRemaining\}\}/g, daysRemaining)
    .replace(/\{\{licenseKey\}\}/g, key.key);
}

export function SlackDraftModal({
  isOpen,
  onClose,
  onSend,
  licenseKey,
}: SlackDraftModalProps) {
  const [message, setMessage] = useState('');
  const [slackChannelId, setSlackChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingChannel, setLoadingChannel] = useState(false);

  useEffect(() => {
    if (isOpen && licenseKey) {
      const defaultMsg = `Update for {{fullName}} ({{email}}) - Company: {{companyName}}. License key: {{licenseKey}}`;
      setMessage(resolveVariables(defaultMsg, licenseKey));

      setLoadingChannel(true);
      fetch(`/api/subscribers/${encodeURIComponent(licenseKey.email)}/settings`)
        .then((r) => r.json())
        .then((result) => {
          setSlackChannelId(result.data?.slackChannelId ?? null);
        })
        .catch(() => setSlackChannelId(null))
        .finally(() => setLoadingChannel(false));
    }
  }, [isOpen, licenseKey]);

  const handleSend = async () => {
    setLoading(true);
    try {
      await onSend(message);
      onClose();
    } catch (error) {
      console.error('Failed to send Slack message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !licenseKey) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Slack Message Draft</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To (email):
            </label>
            <input
              type="text"
              value={licenseKey.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slack Channel:
            </label>
            <input
              type="text"
              value={loadingChannel ? 'Loading...' : slackChannelId || 'Not set (will use default)'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Available Variables</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setMessage((prev) => prev + ' ' + v.name)}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer"
                  title={v.description}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Slack Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
