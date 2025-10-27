# Deployment Troubleshooting Guide

Quick solutions to common deployment issues on DigitalOcean.

---

## 🔴 Application Won't Start

### Symptom
PM2 shows status as "errored" or constantly restarting.

### Check
```bash
pm2 logs license-key-manager --err
```

### Common Causes & Solutions

**1. Module Not Found**
```
Error: Cannot find module 'next'
```
**Solution:**
```bash
cd /var/www/license-keys
rm -rf node_modules
npm install
pm2 restart license-key-manager
```

**2. Build Not Found**
```
Error: Could not find a production build
```
**Solution:**
```bash
npm run build
pm2 restart license-key-manager
```

**3. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID with actual number)
sudo kill -9 PID

# Restart
pm2 restart license-key-manager
```

**4. Environment Variables Missing**
```
Error: Missing environment variables
```
**Solution:**
```bash
# Check if file exists
ls -la .env.production

# View contents (be careful, contains secrets!)
cat .env.production

# If missing, create it
nano .env.production
# Add all required variables
```

---

## 🔴 502 Bad Gateway (Nginx Error)

### Symptom
Browser shows "502 Bad Gateway" when accessing your domain.

### Check
```bash
# Is app running?
pm2 status

# Can you access locally?
curl http://localhost:3000

# Check Nginx logs
sudo tail -20 /var/log/nginx/error.log
```

### Solutions

**1. Application Not Running**
```bash
pm2 restart license-key-manager
pm2 logs
```

**2. Wrong Port in Nginx Config**
```bash
sudo nano /etc/nginx/sites-available/license-keys
# Make sure proxy_pass is http://localhost:3000
sudo nginx -t
sudo systemctl restart nginx
```

**3. Nginx Not Running**
```bash
sudo systemctl status nginx
sudo systemctl start nginx
```

---

## 🔴 Can't Connect to Database

### Symptom
Application starts but shows errors when trying to create keys.

### Check
```bash
pm2 logs license-key-manager
# Look for Supabase connection errors
```

### Solutions

**1. Wrong Supabase URL**
```bash
nano .env.production
# Verify NEXT_PUBLIC_SUPABASE_URL
# Should be: https://yourproject.supabase.co
# NO trailing slash!
```

**2. Invalid API Keys**
```bash
# Go to Supabase Dashboard
# Settings → API
# Copy fresh keys
nano .env.production
# Update keys
pm2 restart license-key-manager
```

**3. Database Not Set Up**
- Go to Supabase SQL Editor
- Run the migration: `supabase/migrations/001_initial_schema.sql`
- Check if tables exist in Table Editor

---

## 🔴 SSL Certificate Issues

### Symptom
"Your connection is not private" or "Certificate error".

### Check
```bash
sudo certbot certificates
```

### Solutions

**1. Certificate Not Obtained**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**2. Domain Not Pointing to Server**
```bash
# Check DNS
nslookup yourdomain.com

# Should show your droplet IP
# If not, update DNS in your domain registrar
```

**3. Certificate Expired**
```bash
sudo certbot renew
sudo systemctl restart nginx
```

---

## 🔴 Site Unreachable

### Symptom
Can't access site at all - connection timeout or refused.

### Check
```bash
# Is Nginx running?
sudo systemctl status nginx

# Is firewall blocking?
sudo ufw status

# Can you ping the server?
ping your_droplet_ip
```

### Solutions

**1. Firewall Blocking**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

**2. Nginx Not Running**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

**3. Wrong Domain DNS**
- Check your domain's DNS settings
- Should point to your droplet's IP
- Wait 15-60 minutes for DNS propagation

---

## 🔴 Emails Not Sending

### Symptom
Keys are created but emails not received.

### Check
```bash
pm2 logs license-key-manager
# Look for email-related errors
```

### Solutions

**1. Wrong Webhook URL**
```bash
nano .env.production
# Verify EMAIL_WEBHOOK_URL
# Test the webhook manually:
curl -X POST https://cloud.activepieces.com/api/v1/webhooks/YOUR_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test","body":"Test"}'
```

**2. Activepieces Flow Not Running**
- Log into Activepieces
- Check your email flow is published (not draft)
- Check flow runs in the dashboard
- Test the trigger manually

**3. Wrong FROM_EMAIL**
```bash
nano .env.production
# Update FROM_EMAIL to match your verified domain
pm2 restart license-key-manager
```

---

## 🔴 Out of Memory

### Symptom
Application crashes randomly, PM2 restarts it frequently.

### Check
```bash
free -h
pm2 monit
htop
```

### Solutions

**1. Restart Application**
```bash
pm2 restart license-key-manager
```

**2. Add Swap Space**
```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**3. Upgrade Droplet**
- Go to DigitalOcean dashboard
- Resize droplet to higher tier
- Choose with more RAM (2GB or 4GB)

---

## 🔴 Permission Denied Errors

### Symptom
Can't write files, can't access directories.

### Check
```bash
ls -la /var/www/license-keys
```

### Solutions

**1. Fix Ownership**
```bash
sudo chown -R $USER:$USER /var/www/license-keys
```

**2. Fix Permissions**
```bash
chmod 755 /var/www/license-keys
chmod -R 755 /var/www/license-keys/app
chmod 600 /var/www/license-keys/.env.production
```

**3. Create Directories with Right Permissions**
```bash
mkdir -p logs
chmod 755 logs
```

---

## 🔴 Build Failures

### Symptom
`npm run build` fails with errors.

### Check
```bash
npm run build
# Read the error messages carefully
```

### Solutions

**1. TypeScript Errors**
```bash
# Check TypeScript config
cat tsconfig.json

# Try cleaning and rebuilding
rm -rf .next
npm run build
```

**2. Dependency Issues**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**3. Out of Disk Space**
```bash
df -h
# If low, clean up:
sudo apt autoremove -y
sudo apt clean
npm cache clean --force
```

---

## 🔴 Changes Not Reflecting

### Symptom
Made code changes but site still shows old version.

### Solutions

**1. Full Rebuild and Restart**
```bash
cd /var/www/license-keys
git pull origin main
npm install
rm -rf .next
npm run build
pm2 restart license-key-manager
```

**2. Clear Browser Cache**
- Press `Ctrl + Shift + R` (hard refresh)
- Or open in incognito mode

**3. Check PM2 is Using Correct Directory**
```bash
pm2 show license-key-manager
# Check "exec cwd" is correct
```

---

## 🔴 Database Connection Works Locally but Not in Production

### Solutions

**1. Check Environment Variables**
```bash
# Make sure production env file is named correctly
ls -la .env*
# Should see .env.production

# Verify PM2 is loading it
pm2 show license-key-manager
# Check env variables
```

**2. Restart with Environment**
```bash
pm2 delete license-key-manager
pm2 start ecosystem.config.js
```

---

## 📊 Diagnostic Commands

Run these to gather information:

```bash
# System Info
uname -a
cat /etc/os-release

# Resources
free -h
df -h
uptime

# Application
pm2 status
pm2 logs --lines 50
node --version
npm --version

# Services
sudo systemctl status nginx
sudo systemctl status pm2-deployer

# Network
curl http://localhost:3000
curl https://yourdomain.com
sudo netstat -tlnp | grep :3000

# Logs
tail -50 /var/www/license-keys/logs/error.log
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log

# Environment
cat .env.production | grep -v "KEY\|SECRET"  # Safe to share
```

---

## 🆘 Emergency Recovery

If everything is broken and you need to start fresh:

```bash
# Stop everything
pm2 stop all
sudo systemctl stop nginx

# Backup current code
cp -r /var/www/license-keys ~/license-keys-backup

# Clean start
cd /var/www/license-keys
rm -rf node_modules .next
npm install
npm run build

# Restart services
pm2 restart all
sudo systemctl start nginx

# Check logs
pm2 logs
```

---

## 🔍 Still Having Issues?

### Create a Debug Report

```bash
# Save this to a file
{
  echo "=== System Info ==="
  uname -a
  node --version
  npm --version
  
  echo -e "\n=== PM2 Status ==="
  pm2 status
  
  echo -e "\n=== Recent Logs ==="
  pm2 logs license-key-manager --lines 30 --nostream
  
  echo -e "\n=== Nginx Status ==="
  sudo systemctl status nginx
  
  echo -e "\n=== Nginx Error Log ==="
  sudo tail -20 /var/log/nginx/error.log
  
  echo -e "\n=== Disk Space ==="
  df -h
  
  echo -e "\n=== Memory ==="
  free -h
  
} > debug-report.txt

cat debug-report.txt
```

Send this report when asking for help.

---

## ✅ Prevention Tips

**1. Regular Monitoring**
```bash
# Check daily
pm2 status
pm2 logs --lines 20
```

**2. Keep Updated**
```bash
# Weekly
sudo apt update && sudo apt upgrade -y
```

**3. Monitor Resources**
```bash
# Watch for high usage
htop
pm2 monit
```

**4. Backup Regularly**
```bash
# Weekly backup
tar -czf ~/backup-$(date +%Y%m%d).tar.gz /var/www/license-keys
```

**5. Test Before Deploying**
```bash
# Always test locally first
npm run build
npm start
# Test in browser
# Then deploy to production
```

---

## 📞 Getting Help

**Before asking for help, provide:**

1. What you were trying to do
2. What happened instead
3. Error messages (exact text)
4. Output of diagnostic commands
5. What you've already tried

**Useful commands to include:**
```bash
pm2 logs --lines 50
sudo tail -50 /var/log/nginx/error.log
pm2 status
node --version
```

---

**Remember:** Most issues are due to:
- Wrong environment variables
- Wrong file permissions  
- Application not restarted after changes
- Services not running

Check these first! 🎯

