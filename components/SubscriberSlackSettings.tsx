'use client';

import { useState, useEffect } from 'react';

interface SubscriberSlackSettingsProps {
  email: string;
}

export function SubscriberSlackSettings({ email }: SubscriberSlackSettingsProps) {
  const [slackChannelId, setSlackChannelId] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/subscribers/${encodeURIComponent(email)}/settings`);
        if (res.ok) {
          const result = await res.json();
          const val = result.data?.slackChannelId || '';
          setSlackChannelId(val);
          setOriginalValue(val);
        }
      } catch {
        // If no settings exist yet, that's fine
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [email]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/subscribers/${encodeURIComponent(email)}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slackChannelId: slackChannelId || null }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setOriginalValue(slackChannelId);
      setMessage({ text: 'Slack channel saved', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: 'Failed to save Slack channel', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = slackChannelId !== originalValue;

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-700">Slack Notifications</h3>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={loading ? '' : slackChannelId}
          onChange={(e) => setSlackChannelId(e.target.value)}
          placeholder={loading ? 'Loading...' : 'Slack Channel ID (e.g., C01ABCDEF23)'}
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges || loading}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-400">
        Slack channel where trial notifications for this subscriber will be posted.
      </p>
    </div>
  );
}
