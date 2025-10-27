# Activepieces License Key Manager

A comprehensive web application for generating, managing, and delivering license keys for Activepieces Business and Embed plans. Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Features

### 🔑 Key Generation
- **Quick Generation**: Generate license keys instantly with customizable parameters
- **Feature Presets**: Choose from predefined feature sets (None, All, Business, Embed)
- **Custom Features**: Manually select individual features with checkboxes
- **Flexible Validity**: Set custom trial periods (default: 14 days)
- **Deployment Options**: Support for both Cloud and Self-Hosted deployments
- **Automatic Email Delivery**: Optional email sending upon key creation

### 📊 Key Management
- **Comprehensive Table View**: See all license keys with detailed information
- **Smart Search**: Find keys by customer email or domain
- **Real-time Status**: Track key status (Active, Disabled, Expired)
- **Key Types**: Differentiate between Trial, Development, and Production keys
- **Activation Tracking**: Monitor when keys are activated

### ⚡ Key Actions
- **Extend Trial**: Add additional days to trial licenses (default: 7 days)
- **Deal Closed**: Convert trial keys to development + create production keys
- **Disable Key**: Deactivate keys when needed
- **Resend Email**: Send key delivery email again
- **Automatic Emails**: Welcome emails sent when deals are closed

### 📧 Email Delivery
- **Beautiful Templates**: Professional, responsive email templates
- **Trial Emails**: Instructions for activating trial keys
- **Welcome Emails**: Production + development keys with full details
- **Deployment-Specific**: Different instructions for Cloud vs Self-Hosted

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Email**: Activepieces Webhook
- **Styling**: Tailwind CSS
- **Key Generation**: NanoID

## Project Structure

```
license-key-manager/
├── app/
│   ├── api/
│   │   └── keys/
│   │       ├── route.ts                    # GET all keys, POST create key
│   │       └── [id]/
│   │           ├── extend/route.ts         # POST extend key
│   │           ├── deal-closed/route.ts    # POST close deal
│   │           ├── disable/route.ts        # POST disable key
│   │           └── send-email/route.ts     # POST send email
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── KeyGenerationForm.tsx               # Key creation form
│   └── KeyManagementTable.tsx              # Key management table
├── lib/
│   ├── supabase.ts                         # Supabase client setup
│   ├── types.ts                            # TypeScript type definitions
│   ├── key-generator.ts                    # License key generation logic
│   └── email-service.ts                    # Email sending functions
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql          # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works fine)
- Activepieces account with email sending flow configured

### 1. Clone and Install

```bash
git clone <repository-url>
cd License_keys
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL migration
5. Get your project credentials from **Settings → API**:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep this secret!)

### 3. Set Up Email Webhook (Activepieces)

The system uses your Activepieces webhook to send emails:
1. The webhook URL is already configured: `https://cloud.activepieces.com/api/v1/webhooks/plumehWOInBubDWJisYQA`
2. Ensure you have an Activepieces flow that:
   - Receives webhook with fields: `email`, `subject`, `body`
   - Sends email using Gmail/SendGrid/SMTP piece
3. If you need a different webhook, update `EMAIL_WEBHOOK_URL` in `.env.local`

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Webhook (Activepieces)
EMAIL_WEBHOOK_URL=https://cloud.activepieces.com/api/v1/webhooks/plumehWOInBubDWJisYQA

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
FROM_EMAIL=noreply@yourdomain.com
```

> **Important**: Never commit `.env.local` to version control. Use `.env.example` as a template.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm start
```

## Database Schema

### `license_keys` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `key` | TEXT | License key (unique, format: AP-XXXX-XXXX-XXXX-XXXX) |
| `customer_email` | TEXT | Customer email address |
| `deployment` | ENUM | 'cloud' or 'self-hosted' |
| `key_type` | ENUM | 'trial', 'development', or 'production' |
| `status` | ENUM | 'active', 'disabled', or 'expired' |
| `features` | JSONB | Enabled features as key-value pairs |
| `created_at` | TIMESTAMP | Creation timestamp |
| `activated_at` | TIMESTAMP | Activation timestamp (nullable) |
| `expires_at` | TIMESTAMP | Expiration timestamp (nullable) |
| `active_flows_limit` | INTEGER | Flow limit for paid plans (nullable) |
| `notes` | TEXT | Additional notes (nullable) |
| `created_by` | TEXT | Creator identifier (nullable) |

### `key_history` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `key_id` | UUID | Foreign key to license_keys |
| `action` | TEXT | Action performed (created, extended, disabled, etc.) |
| `performed_by` | TEXT | User who performed the action |
| `performed_at` | TIMESTAMP | Action timestamp |
| `details` | JSONB | Additional action details |

## Available Features

The system supports the following features that can be enabled/disabled:

- **Templates**: Access to template library
- **Pieces Management**: Custom pieces management
- **SSO**: Single Sign-On integration
- **Audit Logs**: Detailed audit logging
- **Advanced Analytics**: Advanced analytics and reporting
- **Priority Support**: Priority customer support
- **Custom Branding**: White-label branding
- **Embed SDK**: Embed SDK for integration
- **API Access**: Full API access
- **Webhooks**: Webhook support

### Feature Presets

- **None**: No features enabled
- **All**: All features enabled
- **Business**: All features except Embed SDK
- **Embed**: Embed SDK, Templates, Pieces Management

## API Endpoints

### GET `/api/keys`
Get all license keys with optional search.

**Query Parameters:**
- `search` (optional): Filter by email

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "key": "AP-XXXX-XXXX-XXXX-XXXX",
      "customer_email": "customer@example.com",
      "deployment": "cloud",
      "key_type": "trial",
      "status": "active",
      "features": { "templates": true, "sso": true },
      "created_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-01-15T00:00:00Z",
      ...
    }
  ]
}
```

### POST `/api/keys`
Create a new license key.

**Request Body:**
```json
{
  "customer_email": "customer@example.com",
  "deployment": "cloud",
  "features": ["templates", "sso", "api_access"],
  "valid_days": 14
}
```

### POST `/api/keys/[id]/extend`
Extend a license key.

**Request Body:**
```json
{
  "additional_days": 7
}
```

### POST `/api/keys/[id]/deal-closed`
Mark deal as closed, convert trial to development and create production key.

**Request Body:**
```json
{
  "active_flows_limit": 1000
}
```

### POST `/api/keys/[id]/disable`
Disable a license key.

### POST `/api/keys/[id]/send-email`
Send trial key email to customer.

## Email Templates

### Trial Key Email
Sent when a new trial key is generated:
- License key display
- Trial period details
- Enabled features list
- Activation instructions (Cloud or Self-Hosted)
- Support contact information

### Deal Closed Email
Sent when a deal is closed:
- Development key (converted from trial)
- Production key (newly generated)
- Plan details (flow limits, features)
- Activation instructions for both keys
- Next steps guidance

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t license-key-manager .
docker run -p 3000:3000 --env-file .env.local license-key-manager
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to version control
2. **Service Role Key**: Only use the Supabase service role key on the server side
3. **RLS Policies**: Configure Row Level Security in Supabase for production
4. **Authentication**: Add authentication for the admin dashboard (currently public)
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Email Validation**: Validate email addresses before sending

## Future Enhancements

- [ ] Admin authentication (Auth0, NextAuth.js)
- [ ] Bulk key generation
- [ ] Key usage analytics
- [ ] CSV/Excel export functionality
- [ ] Advanced filtering (by date range, status, etc.)
- [ ] Key renewal notifications
- [ ] API key generation for programmatic access
- [ ] Webhook events for key lifecycle
- [ ] Multi-language email templates
- [ ] Custom email template editor

## Support

For issues or questions:
- Documentation: Check SETUP_GUIDE.md
- Activepieces: [activepieces.com/docs](https://activepieces.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)

## License

Private - Activepieces Internal Tool

---

Built with ❤️ for the Activepieces Sales Team
