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

export async function sendTrialKeyEmail({ to, licenseKey }: SendTrialKeyEmailParams) {
  const deploymentType = licenseKey.deployment === 'cloud' ? 'Cloud' : 'Self-Hosted';
  const subject = `Your Activepieces ${deploymentType} license key is here`;
  
  const enabledFeatures = Object.entries(licenseKey.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ') || 'None';

  const expiryDate = licenseKey.expires_at 
    ? new Date(licenseKey.expires_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Not set';

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
        <p style="font-size: 16px;">Hello,</p>
        
        <p style="font-size: 16px;">Thank you for your interest in Activepieces! Your ${deploymentType.toLowerCase()} trial license key is ready.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #666;">Your License Key:</p>
          <code style="display: block; background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; color: #667eea; letter-spacing: 1px; word-break: break-all;">${licenseKey.key}</code>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Trial Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Deployment:</strong> ${deploymentType}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong> ${expiryDate}</li>
            <li style="padding: 8px 0;"><strong>Enabled Features:</strong> ${enabledFeatures}</li>
          </ul>
        </div>

        ${licenseKey.deployment === 'cloud' ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Activation Instructions (Cloud):</h3>
          <ol style="padding-left: 20px;">
            <li style="margin-bottom: 10px;">Log in to your Activepieces cloud dashboard at <a href="https://cloud.activepieces.com" style="color: #667eea;">cloud.activepieces.com</a></li>
            <li style="margin-bottom: 10px;">Navigate to <strong>Settings → License</strong></li>
            <li style="margin-bottom: 10px;">Enter your license key and click <strong>Activate</strong></li>
            <li>You're all set! Start building your automation flows.</li>
          </ol>
        </div>
        ` : `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Activation Instructions (Self-Hosted):</h3>
          <ol style="padding-left: 20px;">
            <li style="margin-bottom: 10px;">Add the license key to your environment variables:
              <code style="display: block; background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 8px;">AP_LICENSE_KEY=${licenseKey.key}</code>
            </li>
            <li style="margin-bottom: 10px;">Restart your Activepieces instance</li>
            <li style="margin-bottom: 10px;">The license will be automatically activated on startup</li>
            <li>Check the admin panel to verify activation status</li>
          </ol>
        </div>
        `}

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>⚠️ Note:</strong> This is a trial license key. If you need to extend your trial or have any questions, please contact our sales team.</p>
        </div>

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

export async function sendDealClosedEmail({ 
  to, 
  developmentKey, 
  productionKey, 
  activeFlowsLimit 
}: SendDealClosedEmailParams) {
  const deploymentType = developmentKey.deployment === 'cloud' ? 'Cloud' : 'Self-Hosted';
  const subject = `Welcome to Activepieces ${deploymentType} - Your Production License`;
  
  const enabledFeatures = Object.entries(productionKey.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ') || 'None';

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
        <p style="font-size: 16px;">Hello,</p>
        
        <p style="font-size: 16px;">Congratulations! Your purchase is complete, and we're excited to have you on board. Here are your license keys for ${deploymentType.toLowerCase()} deployment:</p>
        
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
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Deployment:</strong> ${deploymentType}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Active Flows Limit:</strong> ${activeFlowsLimit}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Expiry:</strong> Never (Perpetual)</li>
            <li style="padding: 8px 0;"><strong>Enabled Features:</strong> ${enabledFeatures}</li>
          </ul>
        </div>

        ${developmentKey.deployment === 'cloud' ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Activation Instructions (Cloud):</h3>
          <ol style="padding-left: 20px;">
            <li style="margin-bottom: 10px;">Log in to your Activepieces cloud dashboard</li>
            <li style="margin-bottom: 10px;">Navigate to <strong>Settings → License</strong></li>
            <li style="margin-bottom: 10px;">Enter your production license key and click <strong>Activate</strong></li>
            <li>Your development key can be used in a separate workspace/instance</li>
          </ol>
        </div>
        ` : `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Activation Instructions (Self-Hosted):</h3>
          <ol style="padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>For Production:</strong> Add the production key to your environment:
              <code style="display: block; background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 8px;">AP_LICENSE_KEY=${productionKey.key}</code>
            </li>
            <li style="margin-bottom: 10px;"><strong>For Development:</strong> Add the development key to your dev environment:
              <code style="display: block; background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 8px;">AP_LICENSE_KEY=${developmentKey.key}</code>
            </li>
            <li style="margin-bottom: 10px;">Restart your Activepieces instances</li>
            <li>Verify activation in the admin panel</li>
          </ol>
        </div>
        `}

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

