'use client';

import { useState } from 'react';
import { 
  AVAILABLE_FEATURES, 
  FEATURE_PRESETS, 
  FeaturePreset, 
  DeploymentType 
} from '@/lib/types';

interface KeyGenerationFormProps {
  onSuccess: () => void;
}

export default function KeyGenerationForm({ onSuccess }: KeyGenerationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customer_email: '',
    deployment: 'cloud' as DeploymentType,
    valid_days: 14,
    preset: 'business' as FeaturePreset,
  });
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(FEATURE_PRESETS.business)
  );
  const [sendEmail, setSendEmail] = useState(true);

  const handlePresetChange = (preset: FeaturePreset) => {
    setFormData({ ...formData, preset });
    setSelectedFeatures(new Set(FEATURE_PRESETS[preset]));
  };

  const handleFeatureToggle = (featureId: string) => {
    const newFeatures = new Set(selectedFeatures);
    if (newFeatures.has(featureId)) {
      newFeatures.delete(featureId);
    } else {
      newFeatures.add(featureId);
    }
    setSelectedFeatures(newFeatures);
    setFormData({ ...formData, preset: 'business' }); // Reset preset when manually changing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create license key
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: formData.customer_email,
          deployment: formData.deployment,
          features: Array.from(selectedFeatures),
          valid_days: formData.valid_days,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create license key');
      }

      // Send email if requested
      if (sendEmail) {
        await fetch(`/api/keys/${result.data.id}/send-email`, {
          method: 'POST',
        });
      }

      // Reset form
      setFormData({
        customer_email: '',
        deployment: 'cloud',
        valid_days: 14,
        preset: 'business',
      });
      setSelectedFeatures(new Set(FEATURE_PRESETS.business));
      setSendEmail(true);

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate License Key</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Customer Email */}
      <div className="mb-4">
        <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
          Customer Email *
        </label>
        <input
          type="email"
          id="customer_email"
          required
          value={formData.customer_email}
          onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="customer@example.com"
        />
      </div>

      {/* Deployment Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deployment Type *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="cloud"
              checked={formData.deployment === 'cloud'}
              onChange={(e) => setFormData({ ...formData, deployment: e.target.value as DeploymentType })}
              className="mr-2"
            />
            Cloud
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="self-hosted"
              checked={formData.deployment === 'self-hosted'}
              onChange={(e) => setFormData({ ...formData, deployment: e.target.value as DeploymentType })}
              className="mr-2"
            />
            Self-Hosted
          </label>
        </div>
      </div>

      {/* Valid Days */}
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

      {/* Feature Presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Feature Preset
        </label>
        <div className="flex flex-wrap gap-2">
          {(['none', 'all', 'business', 'embed'] as FeaturePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetChange(preset)}
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
      </div>

      {/* Feature Checkboxes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Features
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_FEATURES.map((feature) => (
            <label key={feature.id} className="flex items-start">
              <input
                type="checkbox"
                checked={selectedFeatures.has(feature.id)}
                onChange={() => handleFeatureToggle(feature.id)}
                className="mt-1 mr-2"
              />
              <div>
                <div className="font-medium text-gray-900">{feature.name}</div>
                {feature.description && (
                  <div className="text-sm text-gray-500">{feature.description}</div>
                )}
              </div>
            </label>
          ))}
        </div>
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
            Send trial key email to customer
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
  );
}

