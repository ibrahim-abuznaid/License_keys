# Setup Guide - Activepieces License Key Manager

This guide will walk you through setting up the license key manager from scratch.

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages:
- Next.js 14
- React 18
- TypeScript
- Supabase client
- Tailwind CSS
- date-fns (date formatting)
- nanoid (key generation)

### Step 2: Set Up Supabase Database

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization or create a new one
4. Set project name: `activepieces-license-keys`
5. Set a strong database password (save it somewhere safe!)
6. Choose a region close to your users
7. Wait for project to be created (~2 minutes)

#### 2.2 Run Database Migration

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click "New Query"
3. Open `supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

This creates:
- `license_keys` table
- `key_history` table
- Necessary indexes for performance
- Enum types for status, deployment, key type
- Row Level Security policies

#### 2.3 Get Supabase Credentials

1. Click **Settings** (gear icon) in the left sidebar
2. Click **API**
3. Copy the following:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys", keep this SECRET!)

### Step 3: Set Up Email Webhook (Activepieces)

The system uses Activepieces webhooks to send emails. You need to have an Activepieces flow that:
1. Receives a webhook with `email`, `subject`, and `body` fields
2. Sends an email using the Gmail/SendGrid/SMTP piece

Your webhook URL is already configured in the code:
`https://cloud.activepieces.com/api/v1/webhooks/plumehWOInBubDWJisYQA`

If you need to change this or create a new webhook flow:
1. Log into your Activepieces dashboard
2. Create a new flow with a Webhook trigger
3. Add an email sending piece (Gmail, SendGrid, SMTP, etc.)
4. Map the webhook fields: `email` → To, `subject` → Subject, `body` → HTML Body
5. Copy your webhook URL

### Step 4: Configure Environment Variables

#### 4.1 Create .env.local File

In the project root, create a file named `.env.local`:

```bash
touch .env.local
```

#### 4.2 Add Configuration

Open `.env.local` and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Email Webhook (Activepieces)
EMAIL_WEBHOOK_URL=https://cloud.activepieces.com/api/v1/webhooks/plumehWOInBubDWJisYQA

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
FROM_EMAIL=noreply@yourdomain.com
```

Replace:
- `https://xxxxx.supabase.co` with your Supabase project URL
- `your_anon_key_here` with your Supabase anon key
- `your_service_role_key_here` with your Supabase service role key
- `EMAIL_WEBHOOK_URL` with your Activepieces webhook URL (default is already set)
- `noreply@yourdomain.com` with your sending email address (used in email templates)

### Step 5: Test the Setup

#### 5.1 Start Development Server

```bash
npm run dev
```

You should see:
```
- Local:        http://localhost:3000
- Ready in X.Xs
```

#### 5.2 Open the Application

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the License Key Manager dashboard

#### 5.3 Create a Test License Key

1. Fill out the form:
   - **Email**: Use your own email for testing
   - **Deployment**: Choose "Cloud"
   - **Valid for**: Leave as 14 days
   - **Features**: Select "Business" preset
   - **Send Email**: Check this box
2. Click "Generate License Key"
3. Check your email inbox for the trial key email

#### 5.4 Verify Database

1. Go to Supabase dashboard
2. Click **Table Editor**
3. Select `license_keys` table
4. You should see your newly created key

### Step 6: Test Key Management Features

Try each action:

1. **Search**: Search for your key by email
2. **Extend Key**: Click "+Days" and add 7 days
3. **Send Email**: Click "Email" to resend the trial email
4. **Deal Closed**: Click "Close" and enter a flow limit (e.g., 1000)
   - This creates a production key and sends welcome email
5. **Disable Key**: Click "Disable" to deactivate a key

### Step 7: Production Deployment

#### Option A: Deploy to Vercel (Recommended)

1. Push your code to GitHub (excluding .env.local)
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - Click "Environment Variables"
   - Add all variables from your `.env.local`
6. Click "Deploy"
7. Wait for deployment to complete
8. Your app is live!

#### Option B: Deploy to Other Platforms

The app can run on any platform that supports Next.js:
- **Railway**: Automatic deployment from GitHub
- **Render**: Web service with automatic deploys
- **DigitalOcean App Platform**: Container-based deployment
- **AWS Amplify**: Serverless deployment
- **Docker**: Use provided Dockerfile

### Step 8: Verify Email Webhook

1. Test the webhook by generating a license key
2. Check your Activepieces flow execution logs
3. Verify email was sent successfully
4. If needed, update `EMAIL_WEBHOOK_URL` in environment variables with your own webhook

## Troubleshooting

### Migration Already Partially Run

**Error**: `constraint "key_history_key_id_fkey" for relation "key_history" already exists`

**Solution**:
The migration was partially run before. Clean the database and re-run:

1. In Supabase SQL Editor, run this first:
```sql
DROP TABLE IF EXISTS key_history CASCADE;
DROP TABLE IF EXISTS license_keys CASCADE;
DROP TYPE IF EXISTS deployment_type CASCADE;
DROP TYPE IF EXISTS key_status CASCADE;
DROP TYPE IF EXISTS key_type CASCADE;
DROP FUNCTION IF EXISTS update_expired_keys();
```

2. Then run the full migration from `001_initial_schema.sql` again

### Database Connection Issues

**Error**: `Failed to fetch license keys`

**Solutions**:
- Check Supabase URL and keys in `.env.local`
- Verify Supabase project is active (not paused)
- Check network/firewall settings

### Email Not Sending

**Error**: `Failed to send email`

**Solutions**:
- Verify EMAIL_WEBHOOK_URL is correct
- Check your Activepieces flow is active and published
- Test the webhook directly using curl or Postman
- Check Activepieces flow execution logs for errors
- Ensure the email sending piece in your flow is properly configured

### Build Errors

**Error**: `Module not found` or TypeScript errors

**Solutions**:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Environment Variables Not Loading

**Solutions**:
- Restart dev server after changing `.env.local`
- Check file is named exactly `.env.local` (not `.env`)
- Verify no typos in variable names

## Common Questions

### Q: Can I use a different webhook URL or email service?

Yes! The system sends email data to an Activepieces webhook. You can:
1. Update `EMAIL_WEBHOOK_URL` in your environment variables to point to a different webhook
2. Modify the Activepieces flow to use any email service (Gmail, SendGrid, Mailgun, AWS SES, etc.)
3. Or replace the webhook implementation in `lib/email-service.ts` with a direct API call to your email service

### Q: How do I add authentication?

The app currently has no authentication. To add:
1. Use NextAuth.js or Auth0
2. Protect API routes with middleware
3. Add user session management
4. Update RLS policies in Supabase

### Q: Can I customize the email templates?

Yes! Edit `lib/email-service.ts` and modify the HTML templates. You can also:
- Use React Email for JSX templates
- Store templates in database
- Build a visual template editor

### Q: How do I backup the database?

Supabase provides automatic backups on paid plans. For manual backups:
1. Use Supabase dashboard → Database → Backups
2. Or export with pg_dump:
```bash
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

### Q: What's the rate limit?

Current limits:
- **Activepieces Email**: Depends on your email service in the flow
- **Supabase Free**: 500MB database, 2GB bandwidth
- **Vercel Free**: 100GB bandwidth

Scale to paid plans as needed.

## Next Steps

1. ✅ Set up Supabase
2. ✅ Configure Resend
3. ✅ Test locally
4. ✅ Deploy to production
5. 📊 Monitor usage
6. 🔐 Add authentication (recommended)
7. 🚀 Customize for your needs

## Support

Need help? Contact:
- **Technical Issues**: support@activepieces.com
- **Documentation**: Check README.md
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Activepieces**: [activepieces.com/docs](https://activepieces.com/docs)

---

Happy license key managing! 🎉

