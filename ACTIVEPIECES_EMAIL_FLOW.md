# Setting Up Activepieces Email Flow

This guide shows you how to create an Activepieces flow to handle email sending for the License Key Manager.

## Overview

The License Key Manager sends email data to your Activepieces webhook with this structure:

```json
{
  "email": "customer@example.com",
  "subject": "Your Activepieces Cloud license key is here",
  "body": "<html>...email HTML content...</html>"
}
```

Your Activepieces flow will receive this webhook and send the email using your preferred email service.

## Step-by-Step Flow Setup

### Step 1: Create New Flow

1. Log into your Activepieces dashboard at [cloud.activepieces.com](https://cloud.activepieces.com)
2. Click **"Create Flow"** or **"+ New Flow"**
3. Name it: **"License Key Email Sender"**

### Step 2: Add Webhook Trigger

1. For the trigger, select **"Webhook"**
2. Copy the generated webhook URL
   - It looks like: `https://cloud.activepieces.com/api/v1/webhooks/YOUR_WEBHOOK_ID`
3. This is your `EMAIL_WEBHOOK_URL` - save it for your `.env.local` file

### Step 3: Add Email Sending Action

Choose one of these email services:

#### Option A: Gmail (Easiest for Testing)

1. Click **"+ Add Step"** → **"Action"**
2. Search for and select **"Gmail"**
3. Choose **"Send Email"** action
4. Connect your Gmail account (OAuth)
5. Configure the action:
   - **To**: `{{trigger.body.email}}`
   - **Subject**: `{{trigger.body.subject}}`
   - **Body Type**: HTML
   - **Body**: `{{trigger.body.body}}`
6. Optional fields:
   - **From Name**: "Activepieces"
   - **Reply To**: Your support email

#### Option B: SendGrid (Production Recommended)

1. Click **"+ Add Step"** → **"Action"**
2. Search for and select **"SendGrid"**
3. Choose **"Send Email"** action
4. Add your SendGrid API key (get from sendgrid.com)
5. Configure the action:
   - **From Email**: `noreply@yourdomain.com`
   - **From Name**: "Activepieces"
   - **To Email**: `{{trigger.body.email}}`
   - **Subject**: `{{trigger.body.subject}}`
   - **Content Type**: text/html
   - **Content Value**: `{{trigger.body.body}}`

#### Option C: SMTP (Any Email Provider)

1. Click **"+ Add Step"** → **"Action"**
2. Search for and select **"SMTP"**
3. Choose **"Send Email"** action
4. Configure SMTP settings:
   - **Host**: Your SMTP server (e.g., smtp.gmail.com)
   - **Port**: 587 (TLS) or 465 (SSL)
   - **Username**: Your email
   - **Password**: Your email password or app password
5. Configure the email:
   - **From**: `noreply@yourdomain.com`
   - **To**: `{{trigger.body.email}}`
   - **Subject**: `{{trigger.body.subject}}`
   - **HTML Body**: `{{trigger.body.body}}`

#### Option D: Mailgun

1. Click **"+ Add Step"** → **"Action"**
2. Search for and select **"Mailgun"**
3. Choose **"Send Email"** action
4. Add your Mailgun API key and domain
5. Configure the action:
   - **From**: `noreply@yourdomain.com`
   - **To**: `{{trigger.body.email}}`
   - **Subject**: `{{trigger.body.subject}}`
   - **HTML**: `{{trigger.body.body}}`

### Step 4: Test Your Flow

1. Click **"Test Flow"** in the top right
2. Or use this curl command to test the webhook:

```bash
curl -X POST https://cloud.activepieces.com/api/v1/webhooks/YOUR_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@example.com",
    "subject": "Test Email from License Manager",
    "body": "<h1>Test Email</h1><p>This is a test email from the license key manager.</p>"
  }'
```

3. Check that you received the test email
4. Check the flow execution logs in Activepieces to see if it ran successfully

### Step 5: Publish Your Flow

1. If the test worked, click **"Publish"** in the top right
2. The flow is now active and ready to receive webhooks
3. Copy your webhook URL again if needed

### Step 6: Update Your License Manager

1. Open your `.env.local` file in the License Key Manager project
2. Update or add this line:
   ```env
   EMAIL_WEBHOOK_URL=https://cloud.activepieces.com/api/v1/webhooks/YOUR_WEBHOOK_ID
   ```
3. Replace `YOUR_WEBHOOK_ID` with your actual webhook ID
4. Restart your development server: `npm run dev`

## Example Complete Flow

Here's what your flow should look like:

```
┌─────────────────────────────┐
│  Trigger: Webhook           │
│  Receives: email, subject,  │
│  body fields                │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Action: Send Email         │
│  (Gmail/SendGrid/SMTP)      │
│                             │
│  To: {{trigger.body.email}} │
│  Subject: {{trigger.body    │
│           .subject}}        │
│  Body: {{trigger.body.body}}│
└─────────────────────────────┘
```

## Troubleshooting

### Flow Not Receiving Webhooks

**Check:**
- Flow is published (not in draft mode)
- Webhook URL in `.env.local` matches your flow's webhook URL
- No typos in the webhook URL
- Restart your dev server after changing `.env.local`

### Emails Not Sending

**Check:**
- Email service is properly authenticated
- Test the flow manually in Activepieces dashboard
- Check flow execution logs for errors
- Verify email service credentials (API key, SMTP password, etc.)
- Check spam folder for test emails

### Gmail "Less Secure Apps" Error

If using Gmail SMTP:
1. Enable 2-factor authentication on your Google account
2. Generate an "App Password" at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the app password instead of your regular password

### HTML Not Rendering

**Check:**
- Body Type is set to "HTML" (not "Text")
- In SendGrid, Content Type is "text/html"
- The HTML is being passed correctly with `{{trigger.body.body}}`

## Advanced Configuration

### Add Email Logging

Add a **"Data Store"** or **"Google Sheets"** action after sending email to log all sent emails:

1. Add step after email sending
2. Select **"Data Store" → "Add to Store"** or **"Google Sheets" → "Add Row"**
3. Log fields:
   - Email sent to
   - Subject
   - Timestamp
   - Success/Failure status

### Add Error Handling

Add a **"Code"** step to handle errors:

```javascript
export function code(inputs) {
  try {
    // Your email sending logic
    return { success: true };
  } catch (error) {
    // Log error or send notification
    console.error('Email failed:', error);
    return { success: false, error: error.message };
  }
}
```

### Add Reply-To Email

Most email pieces support a "Reply To" field. Set it to:
- `support@activepieces.com` for customer support
- Or dynamically based on email type

### Add CC/BCC

To CC yourself on all license key emails:
- **CC**: `sales@yourdomain.com`
- Useful for tracking all generated keys

## Testing Checklist

Before going live, test:

- [ ] Trial key email sends successfully
- [ ] Welcome email (deal closed) sends successfully
- [ ] HTML renders correctly in received emails
- [ ] Links in emails work
- [ ] Images display (if any)
- [ ] Email arrives within 10 seconds
- [ ] Flow execution logs show success
- [ ] Error handling works (test with invalid email)

## Production Considerations

### For Gmail
- Free tier: 500 emails/day limit
- Not recommended for high-volume production
- Use for development/testing only

### For SendGrid
- Free tier: 100 emails/day
- Paid plans: From $19.95/month (50,000 emails)
- Reliable delivery and analytics
- **Recommended for production**

### For Mailgun
- Free tier: 5,000 emails/month
- Paid plans: From $35/month
- Good deliverability
- Alternative to SendGrid

### For SMTP
- Depends on your email provider
- May have daily limits
- Good for self-hosted solutions

## Support

Need help with your Activepieces flow?
- Activepieces Docs: [activepieces.com/docs](https://activepieces.com/docs)
- Community: [community.activepieces.com](https://community.activepieces.com)
- Gmail Setup: [support.google.com/mail](https://support.google.com/mail)
- SendGrid Docs: [sendgrid.com/docs](https://sendgrid.com/docs)

---

Once your flow is set up and tested, you're ready to start generating license keys! 🎉

