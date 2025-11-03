'use client';

import { useState, useEffect } from 'react';
import { LicenseKey } from '@/lib/types';

interface EmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => Promise<void>;
  licenseKey: LicenseKey | null;
  emailType: 'trial' | 'dealClosed';
  productionKey?: LicenseKey;
  developmentKey?: LicenseKey;
  activeFlowsLimit?: number;
}

export function EmailDraftModal({
  isOpen,
  onClose,
  onSend,
  licenseKey,
  emailType,
  productionKey,
  developmentKey,
  activeFlowsLimit,
}: EmailDraftModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (isOpen && licenseKey) {
      // Generate default email content
      if (emailType === 'trial') {
        setSubject(generateTrialSubject(licenseKey));
        setBody(generateTrialBody(licenseKey));
      } else if (emailType === 'dealClosed' && productionKey && developmentKey) {
        setSubject(generateDealClosedSubject());
        setBody(generateDealClosedBody(developmentKey, productionKey, activeFlowsLimit || 0));
      }
    }
  }, [isOpen, licenseKey, emailType, productionKey, developmentKey, activeFlowsLimit]);

  const handleSend = async () => {
    setLoading(true);
    try {
      await onSend(subject, body);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !licenseKey) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Email Draft</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPreview
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showPreview
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Edit HTML
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To:
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
              Subject:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body:
            </label>
            {showPreview ? (
              <div className="border border-gray-300 rounded-lg p-4 bg-white overflow-auto max-h-[400px]">
                <div dangerouslySetInnerHTML={{ __html: body }} />
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              />
            )}
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
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get enabled features list
function getEnabledFeaturesList(key: LicenseKey): string {
  const features: string[] = [];
  
  if (key.ssoEnabled) features.push('SSO');
  if (key.gitSyncEnabled) features.push('Git Sync');
  if (key.embeddingEnabled) features.push('Embedding');
  if (key.auditLogEnabled) features.push('Audit Logs');
  if (key.customAppearanceEnabled) features.push('Custom Appearance');
  if (key.manageProjectsEnabled) features.push('Manage Projects');
  if (key.managePiecesEnabled) features.push('Manage Pieces');
  if (key.manageTemplatesEnabled) features.push('Manage Templates');
  if (key.apiKeysEnabled) features.push('API Keys');
  if (key.customDomainsEnabled) features.push('Custom Domains');
  if (key.projectRolesEnabled) features.push('Project Roles');
  if (key.flowIssuesEnabled) features.push('Flow Issues');
  if (key.alertsEnabled) features.push('Alerts');
  if (key.analyticsEnabled) features.push('Analytics');
  if (key.globalConnectionsEnabled) features.push('Global Connections');
  if (key.customRolesEnabled) features.push('Custom Roles');
  if (key.environmentsEnabled) features.push('Environments');
  if (key.agentsEnabled) features.push('Agents');
  if (key.tablesEnabled) features.push('Tables');
  if (key.todosEnabled) features.push('Todos');
  if (key.mcpsEnabled) features.push('MCPs');
  
  return features.length > 0 ? features.join(', ') : 'None';
}

function generateTrialSubject(licenseKey: LicenseKey): string {
  return 'Your Activepieces license key is here';
}

function generateTrialBody(licenseKey: LicenseKey): string {
  const enabledFeatures = getEnabledFeaturesList(licenseKey);
  const expiryDate = licenseKey.expiresAt 
    ? new Date(licenseKey.expiresAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Never (Subscribed)';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Activepieces License Key</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Activepieces!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hello${licenseKey.fullName ? ' ' + licenseKey.fullName : ''},</p>
        
        <p style="font-size: 16px;">Thank you for your interest in Activepieces! Your license key is ready.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #666;">Your License Key:</p>
          <code style="display: block; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; color: #667eea; letter-spacing: 1px; word-break: break-all;">${licenseKey.key}</code>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">${licenseKey.isTrial ? 'Trial' : 'License'} Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Key Type:</strong> ${licenseKey.keyType.toUpperCase()}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong> ${expiryDate}</li>
            <li style="padding: 8px 0;"><strong>Enabled Features:</strong> ${enabledFeatures}</li>
          </ul>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Activation Instructions:</h3>
          <ol style="padding-left: 20px;">
            <li style="margin-bottom: 10px;">For <strong>Cloud deployment</strong>: Log in to your Activepieces dashboard at <a href="https://cloud.activepieces.com" style="color: #667eea;">cloud.activepieces.com</a>, navigate to <strong>Settings → License</strong>, and enter your key.</li>
            <li style="margin-bottom: 10px;">For <strong>Self-hosted deployment</strong>: Add the license key to your environment variables:
              <code style="display: block; background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 8px;">AP_LICENSE_KEY=${licenseKey.key}</code>
              Then restart your Activepieces instance.
            </li>
          </ol>
        </div>

        ${licenseKey.isTrial ? `
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>⚠️ Note:</strong> This is a trial license key. If you need to extend your trial or have any questions, please contact our sales team.</p>
        </div>
        ` : ''}

        <p style="font-size: 16px;">Need help? Our team is here to assist you:</p>
        <p style="font-size: 14px;">
          📧 Email: <a href="mailto:support@activepieces.com" style="color: #667eea;">support@activepieces.com</a><br>
          📚 Documentation: <a href="https://www.activepieces.com/docs" style="color: #667eea;">activepieces.com/docs</a>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} Activepieces. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateDealClosedSubject(): string {
  return 'Welcome to Activepieces - Your Production License';
}

function generateDealClosedBody(
  developmentKey: LicenseKey,
  productionKey: LicenseKey,
  activeFlowsLimit: number
): string {
  const enabledFeatures = getEnabledFeaturesList(productionKey);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Activepieces</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Activepieces!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hello${productionKey.fullName ? ' ' + productionKey.fullName : ''},</p>
        
        <p style="font-size: 16px;">Congratulations! Your purchase is complete, and we're excited to have you on board. You now have two license keys:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #666;">Development License Key:</p>
          <code style="display: block; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 16px; font-weight: bold; color: #28a745; letter-spacing: 1px; word-break: break-all;">${developmentKey.key}</code>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">Use this key for development and testing environments.</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #666;">Production License Key:</p>
          <code style="display: block; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 16px; font-weight: bold; color: #667eea; letter-spacing: 1px; word-break: break-all;">${productionKey.key}</code>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">Use this key for your production environment.</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Your Plan Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Active Flows Limit:</strong> ${activeFlowsLimit || 'Unlimited'}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Expiry:</strong> Never (Subscribed)</li>
            <li style="padding: 8px 0;"><strong>Enabled Features:</strong> ${enabledFeatures}</li>
          </ul>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Activation Instructions:</h3>
          <p style="margin-bottom: 15px; font-size: 14px; color: #666;">You have two keys for different environments:</p>
          <div style="margin-bottom: 20px;">
            <p style="margin: 5px 0; font-weight: bold; color: #28a745;">Development Key (${developmentKey.key}):</p>
            <ul style="padding-left: 20px; margin-top: 10px;">
              <li style="margin-bottom: 8px;"><strong>Cloud:</strong> Use in a separate workspace for testing</li>
              <li style="margin-bottom: 8px;"><strong>Self-hosted:</strong> Set <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">AP_LICENSE_KEY=${developmentKey.key}</code> in your dev environment</li>
            </ul>
          </div>
          <div>
            <p style="margin: 5px 0; font-weight: bold; color: #667eea;">Production Key (${productionKey.key}):</p>
            <ul style="padding-left: 20px; margin-top: 10px;">
              <li style="margin-bottom: 8px;"><strong>Cloud:</strong> Navigate to <strong>Settings → License</strong> and activate</li>
              <li style="margin-bottom: 8px;"><strong>Self-hosted:</strong> Set <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">AP_LICENSE_KEY=${productionKey.key}</code> in your production environment</li>
            </ul>
          </div>
        </div>

        <div style="background: #d1ecf1; border: 1px solid #17a2b8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>💡 Pro Tip:</strong> Keep your license keys secure. We recommend storing them in environment variables or a secure secrets manager.</p>
        </div>

        <h3 style="color: #667eea;">Next Steps:</h3>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 8px;">Activate your licenses in both environments</li>
          <li style="margin-bottom: 8px;">Explore the documentation and tutorials</li>
          <li style="margin-bottom: 8px;">Join our community for tips and best practices</li>
          <li>Reach out to our support team if you need assistance</li>
        </ul>

        <p style="font-size: 16px;">Need help? We're here for you:</p>
        <p style="font-size: 14px;">
          📧 Priority Support: <a href="mailto:support@activepieces.com" style="color: #667eea;">support@activepieces.com</a><br>
          📚 Documentation: <a href="https://www.activepieces.com/docs" style="color: #667eea;">activepieces.com/docs</a><br>
          💬 Community: <a href="https://community.activepieces.com" style="color: #667eea;">community.activepieces.com</a>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} Activepieces. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

