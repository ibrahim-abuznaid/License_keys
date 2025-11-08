# DigitalOcean Deployment Login Fix

## The Problem

The login page doesn't work after deployment to DigitalOcean droplet. This is usually caused by:

1. ❌ Using `.env.local` in production (Next.js ignores this file in production)
2. ❌ Cookie security settings requiring HTTPS when you're using HTTP
3. ❌ Environment variables not being set correctly
4. ❌ App not running in production mode

## The Solution

### Step 1: Check Your Environment File

On your DigitalOcean droplet, the environment file should be named **`.env`** (NOT `.env.local`):

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Navigate to your app directory
cd /path/to/your/app

# Check if .env file exists
ls -la | grep env

# If you have .env.local, rename it to .env
mv .env.local .env
```

### Step 2: Verify Environment Variables

Make sure your `.env` file has the required variables:

```bash
# Edit the .env file
nano .env
```

It should contain:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# Node Environment
NODE_ENV=production
```

Save with `Ctrl + X`, then `Y`, then `Enter`.

### Step 3: Check Browser Console for Errors

Open your browser's Developer Tools (F12) and check the Console tab when you click login. Look for errors like:
- CORS errors
- Network errors
- Cookie errors

### Step 4: Check if You're Using HTTPS or HTTP

**Important:** If you're accessing your site via `http://` (not `https://`), the secure cookies won't work in production mode.

**Solutions:**
- **Option A (Recommended):** Set up HTTPS using Let's Encrypt/Certbot
- **Option B (Temporary):** Modify the cookie settings (see code fix below)

### Step 5: Rebuild and Restart Your App

After making changes, rebuild and restart:

```bash
# Stop the current process
pm2 stop all  # or kill the process if not using pm2

# Rebuild the app
npm run build

# Start in production mode
NODE_ENV=production npm start

# Or if using PM2:
pm2 start npm --name "license-keys" -- start
pm2 save
```

### Step 6: Check Server Logs

```bash
# If using PM2
pm2 logs

# Look for errors like:
# - "ADMIN_USERNAME or ADMIN_PASSWORD not set"
# - API errors
# - Cookie errors
```

## Code Fix: Make Cookies Work on HTTP

I've updated the auth file to make cookies work on both HTTP and HTTPS. The updated code adds a fallback for development/testing on HTTP.

## Quick Checklist

- [ ] Renamed `.env.local` to `.env` on the droplet
- [ ] Verified `ADMIN_USERNAME` and `ADMIN_PASSWORD` are in `.env`
- [ ] Checked `NODE_ENV=production` is set
- [ ] Rebuilt the app with `npm run build`
- [ ] Restarted the app with `npm start`
- [ ] Checked browser console for errors
- [ ] Checked server logs for errors
- [ ] Applied the code fix for HTTP support (see updated auth.ts)

## Testing

1. Open browser Developer Tools (F12) → Network tab
2. Try to log in
3. Look for the POST request to `/api/auth/login`
4. Check the response:
   - ✅ **200 OK** = Login succeeded, check cookies
   - ❌ **401 Unauthorized** = Wrong credentials
   - ❌ **500 Error** = Server error, check logs

5. Go to Application tab → Cookies
6. Look for `auth_session` cookie
7. If it's not there, the cookie isn't being set (HTTPS issue)

## Common Issues & Fixes

### Issue 1: "Invalid credentials" but password is correct
**Fix:** Environment variables not loaded. Check `.env` file and restart app.

### Issue 2: Login seems to work but redirects back to login
**Fix:** Cookie not being set. Usually HTTPS issue or cookie settings.

### Issue 3: Nothing happens when clicking login
**Fix:** Check browser console for JavaScript errors. API might not be reachable.

### Issue 4: App crashes on startup
**Fix:** Missing dependencies or build errors. Run `npm install` and `npm run build` again.

## Setting Up HTTPS (Recommended)

To properly secure your app, set up HTTPS:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# If you're using nginx as reverse proxy
sudo certbot --nginx -d yourdomain.com

# Follow the prompts and it will automatically configure HTTPS
```

## Need More Help?

If login still doesn't work, collect this information:

1. Output of: `cat .env | grep ADMIN` (to verify env vars are set)
2. Browser console errors (F12 → Console)
3. Server logs (if using PM2: `pm2 logs`)
4. Whether you're using HTTP or HTTPS
5. The response from `/api/auth/login` in Network tab

