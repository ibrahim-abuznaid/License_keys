# Quick Fix for DigitalOcean Droplet Login Issue

## What I Changed

I've updated the authentication code to:
1. **Work on HTTP by default** (no HTTPS required initially)
2. **Add debug logging** to help troubleshoot issues
3. **Make secure cookies optional** via environment variable

## 🚀 Quick Fix Steps

SSH into your droplet and run these commands:

### 1. Navigate to your app directory
```bash
cd /path/to/your/License_keys  # Change to your actual path
```

### 2. Check/Create your .env file
```bash
# If you have .env.local, rename it
if [ -f .env.local ]; then
  mv .env.local .env
  echo "✅ Renamed .env.local to .env"
fi

# Edit .env file
nano .env
```

### 3. Make sure your .env file has these:
```env
# Supabase (your existing values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# REQUIRED: Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password_here

# Optional: Only set to true when you have HTTPS
# USE_SECURE_COOKIES=false

# Set production mode
NODE_ENV=production
```

Save with: `Ctrl + X`, then `Y`, then `Enter`

### 4. Pull the latest code changes
```bash
git pull origin main
```

### 5. Install dependencies (if needed)
```bash
npm install
```

### 6. Rebuild the app
```bash
npm run build
```

### 7. Restart the app

**If using PM2:**
```bash
pm2 restart all
# Or if you need to start fresh:
pm2 delete all
pm2 start npm --name "license-keys" -- start
pm2 save
```

**If running directly with npm:**
```bash
# Find and kill the current process
ps aux | grep node
kill -9 <process_id>

# Start again
NODE_ENV=production npm start &
```

**If using a service (systemd):**
```bash
sudo systemctl restart your-app-name
```

### 8. Check the logs for debug info
```bash
# If using PM2:
pm2 logs --lines 50

# If using systemd:
sudo journalctl -u your-app-name -f

# Look for messages like:
# - "Setting auth cookie: { secure: false, ... }"
# - "Validating credentials: ..."
# - "Credentials valid: true/false"
```

### 9. Test the login

1. Open browser and go to your site
2. Open Developer Tools (F12) → Console tab
3. Try to log in
4. Check the console for any errors
5. Check the Network tab for the `/api/auth/login` request

## Debugging

### Check if environment variables are loaded:
```bash
# On your droplet, start a Node REPL in your app directory
cd /path/to/your/app
node

# Then in the Node console:
require('dotenv').config({ path: '.env' })
console.log(process.env.ADMIN_USERNAME)
console.log(process.env.ADMIN_PASSWORD ? 'Password is set' : 'Password NOT set')
```

Press `Ctrl+D` to exit.

### Check server logs:
```bash
# PM2 logs
pm2 logs --lines 100

# Look for:
# ✅ "Credentials valid: true" - Login should work
# ❌ "Credentials valid: false" - Wrong password/username
# ❌ "ADMIN_USERNAME or ADMIN_PASSWORD not set" - Env vars not loaded
```

### Test the API directly:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Should return: {"success":true,"message":"Login successful"}
# Or: {"error":"Invalid credentials"}
```

## Common Issues

### Issue: "ADMIN_USERNAME or ADMIN_PASSWORD not set"
**Solution:** 
- Make sure `.env` file exists (not `.env.local`)
- Restart the app after creating/editing `.env`
- Check file permissions: `chmod 600 .env`

### Issue: Login redirects back to login page
**Solution:**
- Check browser cookies (F12 → Application → Cookies)
- Look for `auth_session` cookie
- If missing, check server logs for cookie errors

### Issue: "Cannot find module" errors
**Solution:**
```bash
rm -rf .next
npm install
npm run build
```

## After It Works

Once login works, you can optionally set up HTTPS and enable secure cookies:

1. Set up HTTPS with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

2. Update `.env` to enable secure cookies:
```env
USE_SECURE_COOKIES=true
```

3. Rebuild and restart:
```bash
npm run build
pm2 restart all
```

## Still Having Issues?

Check these in browser Developer Tools (F12):

1. **Console tab:** JavaScript errors
2. **Network tab:** 
   - Find `/api/auth/login` request
   - Check Status (should be 200)
   - Check Response body
3. **Application tab → Cookies:**
   - Look for `auth_session` cookie
   - Check its value, expiry, and secure flag

Then check server logs on the droplet for the debug messages I added.

