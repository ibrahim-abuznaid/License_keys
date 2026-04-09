'use client';

import { useEffect, useState } from 'react';
import { NotificationTemplate } from '@/lib/types';

const AVAILABLE_VARIABLES = [
  { name: '{{fullName}}', description: 'Customer full name' },
  { name: '{{email}}', description: 'Customer email' },
  { name: '{{companyName}}', description: 'Company name' },
  { name: '{{expiresAt}}', description: 'Expiry date (formatted)' },
  { name: '{{daysRemaining}}', description: 'Days until expiry' },
  { name: '{{licenseKey}}', description: 'License key value' },
];

export default function NotificationSettingsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/settings/notification-templates');
      const result = await res.json();
      if (res.ok) {
        setTemplates(result.data || []);
        const msgs: Record<string, string> = {};
        for (const t of result.data || []) {
          msgs[t.id] = t.message;
        }
        setEditedMessages(msgs);
      } else {
        setError(result.error || 'Failed to load templates');
      }
    } catch {
      setError('Failed to load notification templates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    setSaving((prev) => ({ ...prev, [id]: true }));
    setError(null);
    try {
      const res = await fetch('/api/settings/notification-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, enabled } : t)),
      );
    } catch {
      setError('Failed to toggle template');
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSave = async (id: string) => {
    setSaving((prev) => ({ ...prev, [id]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/settings/notification-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, message: editedMessages[id] }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const result = await res.json();
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? result.data : t)),
      );
      setSuccessMessage(`Template "${id}" saved successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Failed to save template');
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const hasChanges = (id: string) => {
    const original = templates.find((t) => t.id === id);
    return original ? original.message !== editedMessages[id] : false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Slack Notification Templates</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure the Slack messages sent at different stages of a trial lifecycle.
          These messages are sent via ActivePieces to the Slack channel associated with each license key.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Available Variables Reference */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VARIABLES.map((v) => (
            <span
              key={v.name}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200"
              title={v.description}
            >
              {v.name}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Hover over a variable to see its description. Use these in your message templates.
        </p>
      </div>

      {/* Template Cards */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg shadow-sm border p-5 transition-colors ${
              template.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {template.label}
                </h3>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {template.id}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.enabled}
                  onChange={(e) => handleToggle(template.id, e.target.checked)}
                  disabled={saving[template.id]}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {template.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <textarea
              value={editedMessages[template.id] || ''}
              onChange={(e) =>
                setEditedMessages((prev) => ({
                  ...prev,
                  [template.id]: e.target.value,
                }))
              }
              rows={3}
              disabled={!template.enabled}
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                template.enabled
                  ? 'border-gray-300 bg-white text-gray-800'
                  : 'border-gray-200 bg-gray-100 text-gray-500'
              }`}
            />

            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">
                Last updated: {new Date(template.updated_at).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={() => handleSave(template.id)}
                disabled={saving[template.id] || !hasChanges(template.id) || !template.enabled}
                className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {saving[template.id] ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
