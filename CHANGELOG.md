# Changelog

## [1.1.0] - Activepieces Webhook Integration

### Changed
- **Email Service**: Replaced Resend with Activepieces webhook integration
- **Dependencies**: Removed `resend` package from dependencies
- **Email Delivery**: Now sends emails via HTTP POST to Activepieces webhook

### Added
- **New Environment Variable**: `EMAIL_WEBHOOK_URL` for webhook configuration
- **New Documentation**: `ACTIVEPIECES_EMAIL_FLOW.md` - Complete guide for setting up the email flow
- **Webhook Integration**: Direct integration with Activepieces for email sending

### Updated
- `lib/email-service.ts` - Now uses fetch API to send webhook requests
- `package.json` - Removed Resend dependency
- `README.md` - Updated email setup instructions
- `SETUP_GUIDE.md` - Updated with Activepieces webhook instructions
- `PROJECT_SUMMARY.md` - Updated tech stack and cost estimates
- `.env.example` - Updated environment variable template

### Migration Guide

If you have an existing installation using Resend:

1. **Update Dependencies**
   ```bash
   npm install
   ```

2. **Update Environment Variables**
   
   Remove:
   ```env
   RESEND_API_KEY=your_key_here
   ```
   
   Add:
   ```env
   EMAIL_WEBHOOK_URL=https://cloud.activepieces.com/api/v1/webhooks/plumehWOInBubDWJisYQA
   ```

3. **Set Up Activepieces Flow**
   - Follow the guide in `ACTIVEPIECES_EMAIL_FLOW.md`
   - Create a webhook trigger
   - Add email sending action (Gmail/SendGrid/SMTP)
   - Map webhook fields: `email`, `subject`, `body`

4. **Test Email Delivery**
   - Generate a test license key
   - Verify email is received
   - Check Activepieces flow execution logs

### Webhook Request Format

The system now sends emails by posting to your webhook with this format:

```json
{
  "email": "customer@example.com",
  "subject": "Your Activepieces license key is here",
  "body": "<html>...email HTML content...</html>"
}
```

### Benefits

✅ **Simpler Setup**: No separate email service account needed
✅ **Flexibility**: Use any email service in your Activepieces flow
✅ **Cost Effective**: Leverage existing Activepieces subscription
✅ **Unified Platform**: Everything in one place
✅ **Easy Switching**: Change email providers without code changes

---

## [1.0.0] - Initial Release

### Features
- License key generation with custom validity periods
- Feature presets (None, All, Business, Embed)
- Key management table with search
- Email delivery via Resend
- Trial key extension
- Deal closed workflow (dev + prod keys)
- Key disable functionality
- Complete documentation

### Tech Stack
- Next.js 14
- TypeScript
- Supabase (PostgreSQL)
- Resend (Email)
- Tailwind CSS

