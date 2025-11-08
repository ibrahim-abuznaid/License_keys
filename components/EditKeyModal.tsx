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

export function EditKeyModal({ isOpen, onClose, onSave, licenseKey }: EditKeyModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    keyType: 'production' as 'development' | 'production',
    isTrial: false,
    expiresAt: '',
    activeFlows: '',
    fullName: '',
    companyName: '',
    numberOfEmployees: '',
    goal: '',
    notes: '',
    // Feature flags
    ssoEnabled: true,
    gitSyncEnabled: true,
    showPoweredBy: true,
    embeddingEnabled: false,
    auditLogEnabled: true,
    customAppearanceEnabled: true,
    manageProjectsEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    apiKeysEnabled: true,
    customDomainsEnabled: true,
    projectRolesEnabled: true,
    flowIssuesEnabled: true,
    alertsEnabled: true,
    analyticsEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: true,
    environmentsEnabled: false,
    agentsEnabled: false,
    tablesEnabled: false,
    todosEnabled: true,
    mcpsEnabled: false,
  });

  useEffect(() => {
    if (licenseKey && isOpen) {
      setFormData({
        email: licenseKey.email || '',
        keyType: licenseKey.keyType || 'production',
        isTrial: licenseKey.isTrial || false,
        expiresAt: licenseKey.expiresAt ? new Date(licenseKey.expiresAt).toISOString().slice(0, 16) : '',
        activeFlows: licenseKey.activeFlows?.toString() || '',
        fullName: licenseKey.fullName || '',
        companyName: licenseKey.companyName || '',
        numberOfEmployees: licenseKey.numberOfEmployees || '',
        goal: licenseKey.goal || '',
        notes: licenseKey.notes || '',
        ssoEnabled: licenseKey.ssoEnabled,
        gitSyncEnabled: licenseKey.gitSyncEnabled,
        showPoweredBy: licenseKey.showPoweredBy,
        embeddingEnabled: licenseKey.embeddingEnabled,
        auditLogEnabled: licenseKey.auditLogEnabled,
        customAppearanceEnabled: licenseKey.customAppearanceEnabled,
        manageProjectsEnabled: licenseKey.manageProjectsEnabled,
        managePiecesEnabled: licenseKey.managePiecesEnabled,
        manageTemplatesEnabled: licenseKey.manageTemplatesEnabled,
        apiKeysEnabled: licenseKey.apiKeysEnabled,
        customDomainsEnabled: licenseKey.customDomainsEnabled,
        projectRolesEnabled: licenseKey.projectRolesEnabled,
        flowIssuesEnabled: licenseKey.flowIssuesEnabled,
        alertsEnabled: licenseKey.alertsEnabled,
        analyticsEnabled: licenseKey.analyticsEnabled,
        globalConnectionsEnabled: licenseKey.globalConnectionsEnabled,
        customRolesEnabled: licenseKey.customRolesEnabled,
        environmentsEnabled: licenseKey.environmentsEnabled,
        agentsEnabled: licenseKey.agentsEnabled,
        tablesEnabled: licenseKey.tablesEnabled,
        todosEnabled: licenseKey.todosEnabled,
        mcpsEnabled: licenseKey.mcpsEnabled,
      });
    }
  }, [licenseKey, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData: any = {
      email: formData.email,
      keyType: formData.keyType,
      isTrial: formData.isTrial,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      activeFlows: formData.activeFlows ? parseInt(formData.activeFlows) : null,
      fullName: formData.fullName || null,
      companyName: formData.companyName || null,
      numberOfEmployees: formData.numberOfEmployees || null,
      goal: formData.goal || null,
      notes: formData.notes || null,
      ssoEnabled: formData.ssoEnabled,
      gitSyncEnabled: formData.gitSyncEnabled,
      showPoweredBy: formData.showPoweredBy,
      embeddingEnabled: formData.embeddingEnabled,
      auditLogEnabled: formData.auditLogEnabled,
      customAppearanceEnabled: formData.customAppearanceEnabled,
      manageProjectsEnabled: formData.manageProjectsEnabled,
      managePiecesEnabled: formData.managePiecesEnabled,
      manageTemplatesEnabled: formData.manageTemplatesEnabled,
      apiKeysEnabled: formData.apiKeysEnabled,
      customDomainsEnabled: formData.customDomainsEnabled,
      projectRolesEnabled: formData.projectRolesEnabled,
      flowIssuesEnabled: formData.flowIssuesEnabled,
      alertsEnabled: formData.alertsEnabled,
      analyticsEnabled: formData.analyticsEnabled,
      globalConnectionsEnabled: formData.globalConnectionsEnabled,
      customRolesEnabled: formData.customRolesEnabled,
      environmentsEnabled: formData.environmentsEnabled,
      agentsEnabled: formData.agentsEnabled,
      tablesEnabled: formData.tablesEnabled,
      todosEnabled: formData.todosEnabled,
      mcpsEnabled: formData.mcpsEnabled,
    };

    onSave(updatedData);
  };

  const toggleAllFeatures = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      ssoEnabled: enabled,
      gitSyncEnabled: enabled,
      showPoweredBy: enabled,
      embeddingEnabled: enabled,
      auditLogEnabled: enabled,
      customAppearanceEnabled: enabled,
      manageProjectsEnabled: enabled,
      managePiecesEnabled: enabled,
      manageTemplatesEnabled: enabled,
      apiKeysEnabled: enabled,
      customDomainsEnabled: enabled,
      projectRolesEnabled: enabled,
      flowIssuesEnabled: enabled,
      alertsEnabled: enabled,
      analyticsEnabled: enabled,
      globalConnectionsEnabled: enabled,
      customRolesEnabled: enabled,
      environmentsEnabled: enabled,
      agentsEnabled: enabled,
      tablesEnabled: enabled,
      todosEnabled: enabled,
      mcpsEnabled: enabled,
    }));
  };

  if (!licenseKey) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit License Key">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
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
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* Full Name & Company Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Number of Employees & Goal */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Employees
            </label>
            <select
              value={formData.numberOfEmployees}
              onChange={(e) => setFormData(prev => ({ ...prev, numberOfEmployees: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select...</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="501+">501+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Flows Limit
            </label>
            <input
              type="number"
              value={formData.activeFlows}
              onChange={(e) => setFormData(prev => ({ ...prev, activeFlows: e.target.value }))}
              placeholder="Leave empty for unlimited"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Goal
          </label>
          <input
            type="text"
            value={formData.goal}
            onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Key Type & Trial Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Type *
            </label>
            <select
              value={formData.keyType}
              onChange={(e) => setFormData(prev => ({ ...prev, keyType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="development">Development</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is Trial
            </label>
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={formData.isTrial}
                onChange={(e) => setFormData(prev => ({ ...prev, isTrial: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Trial Key</span>
            </label>
          </div>
        </div>

        {/* Expires At */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expires At
          </label>
          <input
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty for subscribed users (no expiry). Set to today to disable.
          </p>
        </div>

        {/* Features */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Feature Flags
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleAllFeatures(true)}
                className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => toggleAllFeatures(false)}
                className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                Disable All
              </button>
            </div>
          </div>

          {/* Feature Checkboxes */}
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.ssoEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, ssoEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">SSO Enabled</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gitSyncEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, gitSyncEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Git Sync</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showPoweredBy}
                onChange={(e) => setFormData(prev => ({ ...prev, showPoweredBy: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Show Powered By</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.embeddingEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, embeddingEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Embedding</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auditLogEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, auditLogEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Audit Logs</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.customAppearanceEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, customAppearanceEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Custom Appearance</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.manageProjectsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, manageProjectsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Manage Projects</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.managePiecesEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, managePiecesEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Manage Pieces</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.manageTemplatesEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, manageTemplatesEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Manage Templates</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.apiKeysEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKeysEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">API Keys</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.customDomainsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, customDomainsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Custom Domains</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.projectRolesEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, projectRolesEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Project Roles</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.flowIssuesEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, flowIssuesEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Flow Issues</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.alertsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, alertsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Alerts</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.analyticsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, analyticsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Analytics</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.globalConnectionsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, globalConnectionsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Global Connections</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.customRolesEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, customRolesEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Custom Roles</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.environmentsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, environmentsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Environments</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agentsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, agentsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Agents</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tablesEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, tablesEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Tables</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.todosEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, todosEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Todos</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mcpsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, mcpsEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">MCPs</span>
            </label>
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
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
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
