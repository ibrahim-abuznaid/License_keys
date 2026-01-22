import { LicenseKey } from './types';

const webhookUrl = process.env.EMAIL_WEBHOOK_URL || 'https://cloud.activepieces.com/api/v1/webhooks/plumehWOInBubDWJisYQA';
const fromEmail = process.env.FROM_EMAIL || 'noreply@activepieces.com';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendTrialKeyEmailParams {
  to: string;
  licenseKey: LicenseKey;
}

interface SendDealClosedEmailParams {
  to: string;
  developmentKey: LicenseKey;
  productionKey: LicenseKey;
  activeFlowsLimit: number;
}

// Helper function to get enabled features from the new schema
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
  if (key.alertsEnabled) features.push('Alerts');
  if (key.analyticsEnabled) features.push('Analytics');
  if (key.globalConnectionsEnabled) features.push('Global Connections');
  if (key.customRolesEnabled) features.push('Custom Roles');
  if (key.environmentsEnabled) features.push('Environments');
  if (key.tablesEnabled) features.push('Tables');
  
  return features.length > 0 ? features.join(', ') : 'None';
}

export async function sendTrialKeyEmail({ to, licenseKey }: SendTrialKeyEmailParams) {
  const subject = `Your Activepieces license key is here`;
  
  const enabledFeatures = getEnabledFeaturesList(licenseKey);

  const expiryDate = licenseKey.expiresAt 
    ? new Date(licenseKey.expiresAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Never (Subscribed)';

  const html = `
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

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: to,
        subject: subject,
        body: html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send trial key email:', error);
    return { success: false, error };
  }
}

// Generic function to send custom email
interface SendCustomEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

export async function sendCustomEmail({ to, subject, htmlBody }: SendCustomEmailParams) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: to,
        subject: subject,
        body: htmlBody,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send custom email:', error);
    return { success: false, error };
  }
}

export async function sendDealClosedEmail({ 
  to, 
  developmentKey, 
  productionKey, 
  activeFlowsLimit 
}: SendDealClosedEmailParams) {
  const subject = `Welcome to Activepieces - Your Production License`;
  
  const enabledFeatures = getEnabledFeaturesList(productionKey);

  const html = `
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

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: to,
        subject: subject,
        body: html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send deal closed email:', error);
    return { success: false, error };
  }
}

