# DigitalOcean App Platform Deployment Guide

Complete guide for deploying the License Key Manager to DigitalOcean's App Platform (PaaS).

---

## Why App Platform vs Droplet?

### App Platform (PaaS) ✅ **Recommended for this app**
- ✅ Zero server management
- ✅ Automatic SSL certificates
- ✅ Auto-deploy from GitHub
- ✅ Built-in CI/CD
- ✅ Automatic scaling
- ✅ Simpler setup (no SSH, Nginx, PM2)
- ✅ Cost-effective for small apps ($5-12/month)

### Droplet (IaaS)
- ⚙️ Full server control
- ⚙️ Manual configuration required
- ⚙️ Better for complex multi-service apps
- ⚙️ More flexible but requires DevOps knowledge

---

## Prerequisites

Before you begin, ensure you have:
- [ ] DigitalOcean account (sign up at [digitalocean.com](https://digitalocean.com))
- [ ] GitHub account with your code pushed
- [ ] Supabase project set up
- [ ] Supabase credentials ready (URL, Anon Key, Service Role Key)
- [ ] Activepieces webhook URL

---

## Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

If your code isn't on GitHub yet:

```bash
# Initialize git repository (if not done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit for DigitalOcean deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/License_keys.git
git branch -M main
git push -u origin main
```

> **Important**: Make sure `.env.local` is in `.gitignore` (don't commit secrets!)

### Step 2: Create App Platform App

#### Option A: Using the DigitalOcean Dashboard (Recommended)

1. **Log in to DigitalOcean**
   - Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Click **Create** → **Apps**

2. **Connect GitHub Repository**
   - Choose **GitHub** as the source
   - Click **Manage Access** to authorize DigitalOcean
   - Select your **License_keys** repository
   - Choose **main** branch
   - **Auto-Deploy**: Enable ✅ (deploys automatically on git push)
   - Click **Next**

3. **Configure Resources**
   - App Platform will auto-detect it's a Next.js app
   - Verify these settings:
     - **Type**: Web Service
     - **Environment**: Node.js
     - **Build Command**: `npm run build`
     - **Run Command**: `npm start`
     - **HTTP Port**: `3000`
   - Click **Next**

4. **Set Environment Variables** ⚠️ **CRITICAL**
   
   Click **Edit** next to your web service, then go to **Environment Variables**:

   Add each of these variables:

   | Key | Value | Encrypted? |
   |-----|-------|------------|
   | `NODE_ENV` | `production` | No |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Yes ✅ |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key | Yes ✅ |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key | Yes ✅ |
   | `EMAIL_WEBHOOK_URL` | Your Activepieces webhook URL | Yes ✅ |
   | `ADMIN_USERNAME` | Your admin username | Yes ✅ |
   | `ADMIN_PASSWORD` | Your admin password | Yes ✅ |
   | `NEXT_PUBLIC_APP_URL` | `${APP_URL}` | No |
   | `FROM_EMAIL` | `noreply@yourdomain.com` | No |

   > **Tip**: Use `${APP_URL}` for `NEXT_PUBLIC_APP_URL` - it auto-populates with your app's URL

   Click **Save**

5. **Choose Plan**
   - For this app, **Basic (512MB RAM, $5/month)** is sufficient
   - You can upgrade later if needed
   - Click **Next**

6. **Review and Launch**
   - Review all settings
   - Give your app a name (e.g., `license-key-manager`)
   - Choose a region (e.g., **New York** for US East)
   - Click **Create Resources**

#### Option B: Using App Spec YAML (Advanced)

1. Update the `.do/app.yaml` file in your repository:
   - Replace `yourusername/License_keys` with your GitHub repo
   - Commit and push the file

2. In DigitalOcean:
   - Click **Create** → **Apps**
   - Choose **Import from App Spec**
   - Upload or paste the content of `.do/app.yaml`
   - Proceed with the wizard

### Step 3: Wait for Deployment

- **First build** takes 3-5 minutes
- You'll see build logs in real-time
- Watch for errors (usually related to environment variables)

**Build Stages:**
1. ✅ Pulling code from GitHub
2. ✅ Installing dependencies (`npm install`)
3. ✅ Building Next.js app (`npm run build`)
4. ✅ Starting server (`npm start`)
5. ✅ Health check passed

### Step 4: Access Your Application

Once deployment succeeds:

1. **Get Your URL**
   - You'll see a URL like: `https://license-key-manager-xxxxx.ondigitalocean.app`
   - Click to open your app

2. **Test Basic Functionality**
   - Open the login page
   - Try logging in with your admin credentials
   - Generate a test license key
   - Check if data appears in Supabase

### Step 5: Set Up Custom Domain (Optional)

If you have a custom domain (e.g., `keys.yourdomain.com`):

1. **In App Platform Dashboard**
   - Go to **Settings** → **Domains**
   - Click **Add Domain**
   - Enter your domain: `keys.yourdomain.com`

2. **Configure DNS**
   - DigitalOcean will show you DNS records to add
   - Go to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare)
   - Add the CNAME record:
     ```
     CNAME  keys  license-key-manager-xxxxx.ondigitalocean.app
     ```

3. **Wait for Verification**
   - DNS propagation takes 15 minutes to 24 hours
   - App Platform automatically provisions SSL certificate
   - ✅ Your app will be accessible at `https://keys.yourdomain.com`

---

## Environment Variables Reference

Here's what each environment variable does:

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (⚠️ keep secret!) | Supabase Dashboard → Settings → API |
| `EMAIL_WEBHOOK_URL` | Activepieces webhook for emails | Your Activepieces flow webhook |
| `ADMIN_USERNAME` | Admin login username | Choose your own |
| `ADMIN_PASSWORD` | Admin login password | Choose a strong password |

### Auto-Generated Variables

| Variable | Description |
|----------|-------------|
| `${APP_URL}` | Automatically populated with your app's URL |
| `NODE_ENV` | Set to `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FROM_EMAIL` | Email sender address | `noreply@yourdomain.com` |

---

## Updating Your Application

App Platform automatically deploys when you push to GitHub!

### Automatic Deployment (Recommended)

```bash
# Make your changes locally
git add .
git commit -m "Your update message"
git push origin main
```

That's it! App Platform will:
1. Detect the push
2. Build your app
3. Run tests (if configured)
4. Deploy automatically
5. Notify you via email

### Manual Deployment

If auto-deploy is disabled:

1. Go to your App Platform dashboard
2. Click **Create Deployment**
3. Choose the branch to deploy
4. Click **Deploy**

---

## Monitoring and Logs

### View Application Logs

1. Go to your app in DigitalOcean dashboard
2. Click **Runtime Logs**
3. See real-time application output

**Filter logs:**
- All logs
- Error logs only
- Application logs
- Build logs

### View Build Logs

1. Go to **Deployments** tab
2. Click on any deployment
3. See complete build log

### Monitor Performance

1. Go to **Insights** tab
2. View metrics:
   - Request count
   - Response time
   - Error rate
   - CPU usage
   - Memory usage

---

## Troubleshooting

### Build Fails

**Error: "Module not found" or "Cannot find package"**
```bash
# Solution: Ensure package.json includes all dependencies
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

**Error: "Build command failed"**
- Check Build Logs in DigitalOcean
- Verify `npm run build` works locally
- Ensure Node.js version matches (18+)

### App Crashes on Startup

**Check Runtime Logs for errors:**

1. Missing environment variables
   - Go to Settings → Environment Variables
   - Ensure all required variables are set

2. Port binding error
   - Ensure your app listens on port `3000`
   - Or set `PORT` environment variable

### Can't Connect to Supabase

**Error: "Failed to fetch" or CORS errors**

1. **Check Supabase URL**
   - Must be HTTPS
   - No trailing slash
   - Example: `https://your-project.supabase.co`

2. **Check API Keys**
   - Verify keys are correct and complete
   - No extra spaces or quotes

3. **Check Supabase Settings**
   - Go to Supabase → Settings → API
   - Ensure API is enabled
   - Check if there are IP restrictions

### Login Doesn't Work

**Check these:**

1. **Environment Variables Set?**
   ```
   ADMIN_USERNAME
   ADMIN_PASSWORD
   ```

2. **Check Runtime Logs**
   - Look for authentication errors
   - Verify credentials in logs (without exposing password)

3. **Browser Console**
   - Open DevTools (F12)
   - Check Console for errors
   - Check Network tab for API responses

### Email Sending Fails

**Check:**

1. **Webhook URL is correct**
   - Test webhook manually with curl:
   ```bash
   curl -X POST https://cloud.activepieces.com/api/v1/webhooks/YOUR_WEBHOOK_ID \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","subject":"Test","body":"Test email"}'
   ```

2. **Activepieces Flow is Running**
   - Go to Activepieces dashboard
   - Ensure flow is published and active

3. **Check Runtime Logs**
   - Look for webhook errors
   - Verify request/response

### App is Slow or Unresponsive

1. **Check Insights Tab**
   - High CPU usage? → Upgrade plan
   - High memory usage? → Upgrade plan
   - Many errors? → Check logs

2. **Upgrade App Plan**
   - Go to Settings → Resources
   - Choose a larger plan (1GB RAM+)

---

## Cost Estimation

### Basic Plan (Sufficient for most use cases)
- **$5/month** (512MB RAM, 1 vCPU)
- Good for: < 10,000 requests/day
- Single instance

### Professional Plan (If you need more)
- **$12/month** (1GB RAM, 1 vCPU)
- Good for: < 50,000 requests/day
- Auto-scaling available

### Additional Costs
- **Custom Domain**: Free
- **SSL Certificate**: Free (auto-provisioned)
- **Bandwidth**: 1TB included, then $0.01/GB
- **Build Minutes**: Unlimited

> **Estimate**: For a typical internal license key manager, **$5/month** is sufficient.

---

## Security Best Practices

### 1. Use Environment Variables for Secrets
- ✅ Never commit `.env.local` to GitHub
- ✅ Always encrypt sensitive variables in App Platform
- ✅ Rotate secrets regularly

### 2. Enable GitHub Branch Protection
- Require pull request reviews
- Run tests before merging
- Protect the `main` branch

### 3. Set Up Authentication
Currently, the app has admin authentication. Consider:
- Adding IP whitelist in App Platform
- Implementing OAuth (Google, GitHub)
- Using Supabase Auth

### 4. Monitor Logs Regularly
- Check for failed login attempts
- Monitor API errors
- Set up alerts for critical errors

### 5. Keep Dependencies Updated
```bash
npm audit
npm update
```

Run monthly and deploy updates.

---

## Advanced Configuration

### Enable Auto-Scaling

1. Go to **Settings** → **Resources**
2. Increase **Instance Count** to multiple instances
3. App Platform will load-balance automatically

### Set Up Alerts

1. Go to **Settings** → **Alerts**
2. Configure alerts for:
   - High CPU usage (> 80%)
   - High memory usage (> 80%)
   - App crashes
   - Failed deployments

### Configure Build Settings

Edit `.do/app.yaml`:

```yaml
services:
  - name: web
    build_command: npm run build
    # Add custom build arguments
    dockerfile_path: Dockerfile  # If using Docker
```

### Add a Database (If migrating from Supabase)

App Platform can provision PostgreSQL:

1. Go to **Create** → **Database**
2. Choose **PostgreSQL**
3. Connect to your app
4. Access via `${DATABASE_URL}` environment variable

---

## Comparison: App Platform vs Droplet vs Vercel

| Feature | App Platform | Droplet | Vercel |
|---------|-------------|---------|--------|
| Setup Time | 10 minutes | 30-60 minutes | 5 minutes |
| Server Management | None | Full control | None |
| Auto-Scaling | Yes | Manual | Yes |
| SSL Certificate | Auto | Manual (Certbot) | Auto |
| GitHub Integration | Yes | Manual | Yes |
| Cost (small app) | $5/month | $6/month + setup | $0 (hobby) |
| Custom Domain | Free | Free | Free |
| Best For | Most apps | Complex apps | JAMstack apps |

---

## Success Checklist

Your deployment is successful when:

- [ ] App builds without errors
- [ ] Application loads at provided URL
- [ ] HTTPS works (green padlock)
- [ ] Login page works
- [ ] Can generate license keys
- [ ] Keys appear in Supabase
- [ ] Email sending works
- [ ] No errors in Runtime Logs
- [ ] Environment variables are set correctly
- [ ] Auto-deploy works on git push

---

## Common Questions

### Can I use the same database as my Droplet deployment?
Yes! Just use the same Supabase credentials in your environment variables.

### Can I migrate from Droplet to App Platform?
Yes, just:
1. Push your code to GitHub
2. Follow this guide
3. Update DNS to point to App Platform
4. Turn off Droplet

### How do I rollback a deployment?
1. Go to **Deployments** tab
2. Find the previous working deployment
3. Click **Redeploy**

### Can I SSH into App Platform?
No, App Platform is a PaaS. If you need SSH, use a Droplet instead.

### How do I download logs?
1. Go to **Runtime Logs**
2. Click **Download Logs**
3. Choose time range

---

## Quick Commands Reference

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Test production build
npm start
```

### Git Deployment
```bash
# Deploy to production (triggers auto-deploy)
git add .
git commit -m "Your changes"
git push origin main

# Check deployment status
# → Go to DigitalOcean App Platform dashboard
```

### Debug Commands (in Runtime Logs console)
```bash
# Check Node version
node --version

# Check environment variables (don't expose secrets!)
printenv | grep NEXT_

# Check app is running
curl http://localhost:3000
```

---

## Next Steps After Deployment

1. **Test All Features**
   - Login authentication
   - Key generation
   - Key management actions
   - Email delivery
   - Database persistence

2. **Set Up Monitoring**
   - Enable alerts in App Platform
   - Optional: Use external monitoring (UptimeRobot, Pingdom)

3. **Configure Custom Domain** (if applicable)
   - Add DNS records
   - Wait for SSL provisioning

4. **Document Your Setup**
   - Save environment variables securely (password manager)
   - Document any customizations
   - Share access with team

5. **Set Up Backups**
   - Supabase handles database backups
   - Your code is backed up in GitHub
   - Download logs regularly

---

## Getting Help

### DigitalOcean Support
- Documentation: [docs.digitalocean.com/products/app-platform](https://docs.digitalocean.com/products/app-platform/)
- Community: [digitalocean.com/community](https://www.digitalocean.com/community/)
- Support: [cloud.digitalocean.com/support](https://cloud.digitalocean.com/support)

### Application Issues
- Check Runtime Logs first
- Review Build Logs for build issues
- Test locally: `npm run build && npm start`
- Check Supabase status
- Verify Activepieces webhook

---

## Summary: Why App Platform is Great for This App

✅ **Your Next.js app is perfect for App Platform because:**
- No complex server configuration needed
- Automatic HTTPS and domain management
- Built-in CI/CD from GitHub
- Predictable costs
- Scales automatically if you grow
- Less maintenance than a Droplet

✅ **Deploy once, forget about servers!**

---

**Congratulations!** 🎉 Your License Key Manager is now deployed on DigitalOcean App Platform!

Your app is now:
- ✅ Live on the internet with HTTPS
- ✅ Auto-deploying from GitHub
- ✅ Automatically scaling
- ✅ Monitored and backed up
- ✅ Ready for production use!

