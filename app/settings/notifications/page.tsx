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

const ACTION_OPTIONS = [
  { value: 'key_created', label: 'Key Created' },
  { value: 'deal_closed', label: 'Deal Closed' },
  { value: 'key_disabled', label: 'Key Disabled' },
  { value: 'key_reactivated', label: 'Key Reactivated' },
  { value: 'key_extended', label: 'Key Extended' },
  { value: 'key_edited', label: 'Key Edited' },
];

const DEFAULT_TEMPLATE_IDS = new Set([
  'trial_started',
  'trial_expiring_7d',
  'trial_expiring_3d',
  'trial_expired',
  'trial_extend_offer',
]);

function getTriggerLabel(template: NotificationTemplate): string {
  if (template.trigger_type === 'action') {
    const action = ACTION_OPTIONS.find((a) => a.value === template.trigger_action);
    return `Triggered by: ${action?.label || template.trigger_action || 'Unknown'}`;
  }
  if (template.trigger_type === 'schedule') {
    const days = template.trigger_days ?? 0;
    if (days < 0) return `Scheduled: ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} before expiry`;
    if (days === 0) return 'Scheduled: On expiry day';
    return `Scheduled: ${days} day${days !== 1 ? 's' : ''} after expiry`;
  }
  return '';
}

interface CronRunLog {
  id: string;
  ran_at: string;
  trial_keys_processed: number;
  notifications_sent: number;
  schedule_templates_count: number;
  results: Array<{ key: string; templateId: string; success: boolean }>;
  error: string | null;
  duration_ms: number;
}

export default function NotificationSettingsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Slack Notifications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage notification templates and view schedule run logs.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Schedule Logs
          </button>
        </nav>
      </div>

      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'logs' && <ScheduleLogsTab />}
    </div>
  );
}

/* ────────────────────────── Templates Tab ────────────────────────── */

function TemplatesTab() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    label: '',
    message: '',
    trigger_type: 'action' as 'action' | 'schedule',
    trigger_action: 'key_created',
    trigger_days: -7,
  });

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

  const handleCreate = async () => {
    setError(null);
    setSuccessMessage(null);
    setSaving((prev) => ({ ...prev, _new: true }));
    try {
      const payload = {
        label: newTemplate.label,
        message: newTemplate.message,
        trigger_type: newTemplate.trigger_type,
        trigger_action: newTemplate.trigger_type === 'action' ? newTemplate.trigger_action : undefined,
        trigger_days: newTemplate.trigger_type === 'schedule' ? newTemplate.trigger_days : undefined,
      };
      const res = await fetch('/api/settings/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create');
      }
      const result = await res.json();
      setTemplates((prev) => [...prev, result.data]);
      setEditedMessages((prev) => ({ ...prev, [result.data.id]: result.data.message }));
      setSuccessMessage(`Notification "${newTemplate.label}" created`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setNewTemplate({ label: '', message: '', trigger_type: 'action', trigger_action: 'key_created', trigger_days: -7 });
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create notification');
    } finally {
      setSaving((prev) => ({ ...prev, _new: false }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete notification "${id}"? This cannot be undone.`)) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/settings/notification-templates?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSuccessMessage(`Notification "${id}" deleted`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Failed to delete template');
    } finally {
      setDeleting(null);
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
      <div className="mb-6 flex items-center justify-end">
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          {showCreateForm ? 'Cancel' : '+ Create Notification'}
        </button>
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

      {showCreateForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Notification</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={newTemplate.label}
                onChange={(e) => setNewTemplate((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Deal Closed Alert"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newTemplate.trigger_type === 'action'}
                    onChange={() => setNewTemplate((p) => ({ ...p, trigger_type: 'action' }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">When an action happens</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newTemplate.trigger_type === 'schedule'}
                    onChange={() => setNewTemplate((p) => ({ ...p, trigger_type: 'schedule' }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Based on schedule (relative to expiry)</span>
                </label>
              </div>
            </div>
            {newTemplate.trigger_type === 'action' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={newTemplate.trigger_action}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, trigger_action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {newTemplate.trigger_type === 'schedule' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days relative to expiry</label>
                <input
                  type="number"
                  value={newTemplate.trigger_days}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, trigger_days: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Negative = before expiry (e.g. -7 for 7 days before), 0 = on expiry day, positive = after expiry
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={newTemplate.message}
                onChange={(e) => setNewTemplate((p) => ({ ...p, message: e.target.value }))}
                rows={3}
                placeholder="Use {{variables}} in your message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setNewTemplate((p) => ({ ...p, message: p.message + ' ' + v.name }))}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                  title={v.description}
                >
                  {v.name}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newTemplate.label.trim() || !newTemplate.message.trim() || saving['_new']}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {saving['_new'] ? 'Creating...' : 'Create Notification'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg shadow-sm border p-5 transition-colors ${
              template.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">{template.label}</h3>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {template.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!DEFAULT_TEMPLATE_IDS.has(template.id) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(template.id)}
                    disabled={deleting === template.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting === template.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
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
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {template.trigger_type === 'action' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {getTriggerLabel(template)}
                </span>
              )}
              {template.trigger_type === 'schedule' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {getTriggerLabel(template)}
                </span>
              )}
            </p>
            <textarea
              value={editedMessages[template.id] || ''}
              onChange={(e) =>
                setEditedMessages((prev) => ({ ...prev, [template.id]: e.target.value }))
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

/* ────────────────────────── Schedule Logs Tab ────────────────────────── */

function ScheduleLogsTab() {
  const [logs, setLogs] = useState<CronRunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/settings/cron-logs');
      const result = await res.json();
      if (res.ok) {
        setLogs(result.data || []);
      } else {
        setError(result.error || 'Failed to load logs');
      }
    } catch {
      setError('Failed to load schedule logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No schedule runs recorded yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Logs will appear here after the cron job runs for the first time.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">Showing last {logs.length} run{logs.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setLoading(true); fetchLogs(); }}
          className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date / Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Keys</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Templates</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => {
              const isError = !!log.error;
              const isExpanded = expandedId === log.id;
              return (
                <tr key={log.id} className={isError ? 'bg-red-50' : undefined}>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {new Date(log.ran_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isError ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Success
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{log.trial_keys_processed}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={log.notifications_sent > 0 ? 'font-semibold text-indigo-700' : 'text-gray-700'}>
                      {log.notifications_sent}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{log.schedule_templates_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right whitespace-nowrap">
                    {log.duration_ms}ms
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(log.results.length > 0 || log.error) && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {isExpanded ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded detail panel */}
      {expandedId && (() => {
        const log = logs.find((l) => l.id === expandedId);
        if (!log) return null;
        return (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Run Details &mdash; {new Date(log.ran_at).toLocaleString()}
              </h4>
              <button
                onClick={() => setExpandedId(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            {log.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <span className="font-medium">Error:</span> {log.error}
              </div>
            )}

            {log.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">License Key</th>
                      <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">Template</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {log.results.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-700">{r.key}</td>
                        <td className="py-2 pr-4 text-xs text-gray-700">{r.templateId}</td>
                        <td className="py-2">
                          {r.success ? (
                            <span className="text-xs text-green-700">Sent</span>
                          ) : (
                            <span className="text-xs text-red-700">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !log.error ? (
              <p className="text-sm text-gray-500">No notifications were triggered in this run.</p>
            ) : null}
          </div>
        );
      })()}
    </div>
  );
}
