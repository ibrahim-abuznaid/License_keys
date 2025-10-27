'use client';

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LicenseKey } from '@/lib/types';

interface EditKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedKey: Partial<LicenseKey>) => void;
  licenseKey: LicenseKey | null;
}

const AVAILABLE_FEATURES = [
  { key: 'templates', label: 'Templates' },
  { key: 'pieces_management', label: 'Pieces Management' },
  { key: 'sso', label: 'SSO' },
  { key: 'audit_logs', label: 'Audit Logs' },
  { key: 'advanced_analytics', label: 'Advanced Analytics' },
  { key: 'priority_support', label: 'Priority Support' },
  { key: 'custom_branding', label: 'Custom Branding' },
  { key: 'embed_sdk', label: 'Embed SDK' },
  { key: 'api_access', label: 'API Access' },
  { key: 'webhooks', label: 'Webhooks' },
];

export function EditKeyModal({ isOpen, onClose, onSave, licenseKey }: EditKeyModalProps) {
  const [formData, setFormData] = useState({
    customer_email: '',
    deployment: 'cloud' as 'cloud' | 'self-hosted',
    key_type: 'trial' as 'trial' | 'development' | 'production',
    status: 'active' as 'active' | 'disabled' | 'expired',
    expires_at: '',
    active_flows_limit: '',
    notes: '',
    features: {} as Record<string, boolean>,
  });

  useEffect(() => {
    if (licenseKey && isOpen) {
      setFormData({
        customer_email: licenseKey.customer_email || '',
        deployment: licenseKey.deployment || 'cloud',
        key_type: licenseKey.key_type || 'trial',
        status: licenseKey.status || 'active',
        expires_at: licenseKey.expires_at ? new Date(licenseKey.expires_at).toISOString().slice(0, 16) : '',
        active_flows_limit: licenseKey.active_flows_limit?.toString() || '',
        notes: licenseKey.notes || '',
        features: licenseKey.features || {},
      });
    }
  }, [licenseKey, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData: any = {
      customer_email: formData.customer_email,
      deployment: formData.deployment,
      key_type: formData.key_type,
      status: formData.status,
      features: formData.features,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      active_flows_limit: formData.active_flows_limit ? parseInt(formData.active_flows_limit) : null,
      notes: formData.notes || null,
    };

    onSave(updatedData);
  };

  const toggleFeature = (featureKey: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey],
      },
    }));
  };

  const handlePreset = (preset: 'none' | 'all' | 'business' | 'embed') => {
    let newFeatures: Record<string, boolean> = {};

    switch (preset) {
      case 'none':
        newFeatures = {};
        break;
      case 'all':
        AVAILABLE_FEATURES.forEach(f => {
          newFeatures[f.key] = true;
        });
        break;
      case 'business':
        newFeatures = {
          templates: true,
          pieces_management: true,
          sso: true,
          audit_logs: true,
          advanced_analytics: true,
          priority_support: true,
          custom_branding: true,
          api_access: true,
          webhooks: true,
        };
        break;
      case 'embed':
        newFeatures = {
          templates: true,
          pieces_management: true,
          embed_sdk: true,
        };
        break;
    }

    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  if (!licenseKey) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit License Key">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* License Key (Read Only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Key (Read Only)
          </label>
          <code className="block w-full px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm">
            {licenseKey.key}
          </code>
        </div>

        {/* Customer Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Email *
          </label>
          <input
            type="email"
            value={formData.customer_email}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* Deployment & Key Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deployment *
            </label>
            <select
              value={formData.deployment}
              onChange={(e) => setFormData(prev => ({ ...prev, deployment: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="cloud">Cloud</option>
              <option value="self-hosted">Self-Hosted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Type *
            </label>
            <select
              value={formData.key_type}
              onChange={(e) => setFormData(prev => ({ ...prev, key_type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="trial">Trial</option>
              <option value="development">Development</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Expires At & Active Flows Limit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires At
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Flows Limit
            </label>
            <input
              type="number"
              value={formData.active_flows_limit}
              onChange={(e) => setFormData(prev => ({ ...prev, active_flows_limit: e.target.value }))}
              placeholder="Leave empty for unlimited"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enabled Features
          </label>
          
          {/* Feature Presets */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handlePreset('none')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              None
            </button>
            <button
              type="button"
              onClick={() => handlePreset('all')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handlePreset('business')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              Business
            </button>
            <button
              type="button"
              onClick={() => handlePreset('embed')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              Embed
            </button>
          </div>

          {/* Feature Checkboxes */}
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {AVAILABLE_FEATURES.map((feature) => (
              <label key={feature.key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.features[feature.key]}
                  onChange={() => toggleFeature(feature.key)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{feature.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Optional notes about this license key..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

