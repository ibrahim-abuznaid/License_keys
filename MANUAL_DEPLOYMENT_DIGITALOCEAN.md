# Manual Deployment Guide - DigitalOcean Ubuntu Droplet

Complete step-by-step instructions for deploying the License Key Manager on a DigitalOcean Ubuntu droplet.

---

## Table of Contents
1. [Initial Server Setup](#initial-server-setup)
2. [Install Required Software](#install-required-software)
3. [Deploy the Application](#deploy-the-application)
4. [Configure Environment Variables](#configure-environment-variables)
5. [Set Up Process Manager (PM2)](#set-up-process-manager-pm2)
6. [Configure Nginx as Reverse Proxy](#configure-nginx-as-reverse-proxy)
7. [Set Up SSL Certificate](#set-up-ssl-certificate)
8. [Verify Deployment](#verify-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:
- A DigitalOcean droplet with Ubuntu 22.04 or 24.04
- Root or sudo access to the droplet
- A domain name pointing to your droplet's IP address (for SSL)
- Your Supabase credentials
- Your Activepieces webhook URL

---

## Initial Server Setup

### 1. Connect to Your Droplet

```bash
ssh root@your_droplet_ip
```

Replace `your_droplet_ip` with your actual droplet IP address.

### 2. Update System Packages

```bash
apt update
apt upgrade -y
```

This will update all packages to their latest versions. Press Enter when prompted.

### 3. Create a New User (Optional but Recommended)

```bash
adduser deployer
```

Set a strong password when prompted.

### 4. Grant Sudo Privileges

```bash
usermod -aG sudo deployer
```

### 5. Switch to New User

```bash
su - deployer
```

Now you're operating as the `deployer` user.

---

## Install Required Software

### 1. Install Node.js 18.x

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Verify Installation

```bash
node --version
npm --version
```

You should see Node v18.x.x and npm v9.x.x or higher.

### 3. Install Git

```bash
sudo apt install -y git
```

### 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

PM2 will keep your application running continuously and restart it if it crashes.

### 5. Install Nginx (Web Server)

```bash
sudo apt install -y nginx
```

### 6. Start and Enable Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

Verify it's running:

```bash
sudo systemctl status nginx
```

Press `q` to exit the status view.

---

## Deploy the Application

### 1. Create Application Directory

```bash
sudo mkdir -p /var/www/license-keys
sudo chown -R $USER:$USER /var/www/license-keys
cd /var/www/license-keys
```

### 2. Clone Your Repository

If your code is on GitHub:

```bash
git clone https://github.com/yourusername/License_keys.git .
```

**OR** if you need to upload from your local machine:

On your local machine:
```bash
# From your project directory
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ deployer@your_droplet_ip:/var/www/license-keys/
```

### 3. Install Dependencies

```bash
cd /var/www/license-keys
npm install
```

This will take a few minutes. Wait for it to complete.

### 4. Build the Application

```bash
npm run build
```

This creates an optimized production build. It may take 1-2 minutes.

---

## Configure Environment Variables

### 1. Create Production Environment File

```bash
nano .env.production
```

### 2. Add Your Environment Variables

Paste the following and replace with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email Webhook (Activepieces)
EMAIL_WEBHOOK_URL=https://cloud.activepieces.com/api/v1/webhooks/plumehWOInBubDWJisYQA

# Application Settings
NEXT_PUBLIC_APP_URL=https://yourdomain.com
FROM_EMAIL=noreply@yourdomain.com

# Node Environment
NODE_ENV=production
```

**Important**: 
- Replace `https://your-project.supabase.co` with your actual Supabase URL
- Replace all placeholder keys with your actual credentials
- Update `yourdomain.com` with your actual domain

### 3. Save and Exit

- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### 4. Set Proper Permissions

```bash
chmod 600 .env.production
```

This ensures only you can read the environment file.

---

## Set Up Process Manager (PM2)

### 1. Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

### 2. Add PM2 Configuration

Paste the following:

```javascript
module.exports = {
  apps: [{
    name: 'license-key-manager',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/license-keys',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/www/license-keys/logs/error.log',
    out_file: '/var/www/license-keys/logs/access.log',
    time: true
  }]
}
```

### 3. Save and Exit

- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### 4. Create Logs Directory

```bash
mkdir -p logs
```

### 5. Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

### 6. Save PM2 Configuration

```bash
pm2 save
```

### 7. Set PM2 to Start on Boot

```bash
pm2 startup
```

Copy and run the command that PM2 outputs (it will look like):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deployer --hp /home/deployer
```

### 8. Check Application Status

```bash
pm2 status
pm2 logs
```

Press `Ctrl + C` to exit logs view. Your app should now be running on port 3000.

---

## Configure Nginx as Reverse Proxy

### 1. Remove Default Nginx Configuration

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 2. Create New Configuration

```bash
sudo nano /etc/nginx/sites-available/license-keys
```

### 3. Add Nginx Configuration

Paste the following (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max body size for uploads
    client_max_body_size 10M;
}
```

### 4. Save and Exit

- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### 5. Enable the Configuration

```bash
sudo ln -s /etc/nginx/sites-available/license-keys /etc/nginx/sites-enabled/
```

### 6. Test Nginx Configuration

```bash
sudo nginx -t
```

You should see "syntax is ok" and "test is successful".

### 7. Restart Nginx

```bash
sudo systemctl restart nginx
```

### 8. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

Type `y` and press Enter when prompted.

---

## Set Up SSL Certificate

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

Replace `yourdomain.com` with your actual domain:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service (type `A`)
- Choose whether to share email with EFF (type `Y` or `N`)
- Choose option 2 (Redirect) to redirect HTTP to HTTPS

### 3. Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

This ensures certificates will auto-renew before expiration.

---

## Verify Deployment

### 1. Check Application Status

```bash
pm2 status
pm2 logs license-key-manager --lines 50
```

### 2. Test Local Connection

```bash
curl http://localhost:3000
```

You should see HTML output.

### 3. Test Through Nginx

```bash
curl http://yourdomain.com
```

### 4. Open in Browser

Navigate to `https://yourdomain.com`

You should see your License Key Manager application.

### 5. Test Key Generation

- Try generating a test license key
- Check if it appears in the table
- Verify data is saved in Supabase

---

## Useful PM2 Commands

### View All Applications

```bash
pm2 list
```

### View Logs

```bash
pm2 logs
pm2 logs license-key-manager
pm2 logs license-key-manager --lines 100
```

### Restart Application

```bash
pm2 restart license-key-manager
```

### Stop Application

```bash
pm2 stop license-key-manager
```

### Start Application

```bash
pm2 start license-key-manager
```

### Reload Application (Zero Downtime)

```bash
pm2 reload license-key-manager
```

### Monitor Resources

```bash
pm2 monit
```

Press `Ctrl + C` to exit.

### View Detailed Info

```bash
pm2 show license-key-manager
```

---

## Updating Your Application

When you need to deploy updates:

### 1. Pull Latest Changes

```bash
cd /var/www/license-keys
git pull origin main
```

### 2. Install New Dependencies (if any)

```bash
npm install
```

### 3. Rebuild Application

```bash
npm run build
```

### 4. Reload with PM2

```bash
pm2 reload license-key-manager
```

Or restart if reload doesn't work:

```bash
pm2 restart license-key-manager
```

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
pm2 logs license-key-manager --err
cat logs/error.log
```

**Common issues:**
- Wrong Node.js version: `node --version` (should be 18+)
- Missing dependencies: run `npm install` again
- Build failed: run `npm run build` and check for errors
- Environment variables missing: check `.env.production`

### Port 3000 Already in Use

**Find what's using the port:**
```bash
sudo lsof -i :3000
```

**Kill the process:**
```bash
sudo kill -9 PID_NUMBER
```

Then restart your app:
```bash
pm2 restart license-key-manager
```

### Nginx 502 Bad Gateway

**Check if app is running:**
```bash
pm2 status
curl http://localhost:3000
```

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Restart both services:**
```bash
pm2 restart license-key-manager
sudo systemctl restart nginx
```

### Can't Connect to Supabase

**Test connection:**
```bash
curl https://your-project.supabase.co/rest/v1/
```

**Check environment variables:**
```bash
cat .env.production
```

Make sure:
- URLs don't have trailing slashes
- Keys are complete and unmodified
- Variables are exported properly

### SSL Certificate Issues

**Check certificate status:**
```bash
sudo certbot certificates
```

**Renew certificate manually:**
```bash
sudo certbot renew
```

**Check Nginx configuration:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Out of Memory

**Check memory usage:**
```bash
free -h
pm2 monit
```

**Restart application:**
```bash
pm2 restart license-key-manager
```

**If persistent, upgrade your droplet or add swap:**
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Permission Denied Errors

**Fix ownership:**
```bash
sudo chown -R $USER:$USER /var/www/license-keys
```

**Fix permissions:**
```bash
chmod 755 /var/www/license-keys
chmod 600 .env.production
```

---

## Performance Optimization

### Enable Nginx Caching

Edit your Nginx config:
```bash
sudo nano /etc/nginx/sites-available/license-keys
```

Add before the `location /` block:
```nginx
# Cache settings
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### Enable Gzip Compression

Add to your Nginx server block:
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

Then restart Nginx:
```bash
sudo systemctl restart nginx
```

---

## Security Best Practices

### 1. Keep System Updated

```bash
sudo apt update && sudo apt upgrade -y
```

Run this weekly.

### 2. Configure Firewall Properly

```bash
sudo ufw status
```

Only ports 80, 443, and SSH should be open.

### 3. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
```

Find and change:
```
PermitRootLogin no
```

Restart SSH:
```bash
sudo systemctl restart ssh
```

### 4. Set Up Fail2Ban (Optional)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5. Regular Backups

Backup your application and database regularly:
```bash
# Create backup script
nano ~/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf ~/backups/license-keys-$DATE.tar.gz /var/www/license-keys
```

Make executable:
```bash
chmod +x ~/backup.sh
```

---

## Monitoring

### View System Resources

```bash
htop
```

Install if not available:
```bash
sudo apt install htop
```

### Monitor Nginx Access Logs

```bash
sudo tail -f /var/log/nginx/access.log
```

### Monitor Application Logs

```bash
pm2 logs --lines 100
```

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -h
```

---

## Support Checklist

If you need help, gather this information:

- [ ] PM2 status: `pm2 status`
- [ ] Application logs: `pm2 logs license-key-manager --lines 50`
- [ ] Nginx status: `sudo systemctl status nginx`
- [ ] Nginx error logs: `sudo tail -100 /var/log/nginx/error.log`
- [ ] System resources: `free -h && df -h`
- [ ] Node version: `node --version`
- [ ] Environment variables exist: `ls -la .env.production`

---

## Quick Reference Commands

```bash
# Application Management
pm2 status                          # Check status
pm2 restart license-key-manager     # Restart app
pm2 logs license-key-manager        # View logs
pm2 monit                          # Monitor resources

# System Services
sudo systemctl status nginx         # Check Nginx
sudo systemctl restart nginx        # Restart Nginx
sudo systemctl status pm2-deployer # Check PM2 service

# Logs
pm2 logs --lines 100               # App logs
sudo tail -f /var/log/nginx/error.log  # Nginx errors
sudo tail -f /var/log/nginx/access.log # Nginx access

# Updates
cd /var/www/license-keys
git pull origin main
npm install
npm run build
pm2 reload license-key-manager

# Security
sudo ufw status                    # Check firewall
sudo certbot renew                # Renew SSL
sudo apt update && sudo apt upgrade -y  # Update system
```

---

## Success Checklist

Your deployment is successful when:

- [✓] Application loads at `https://yourdomain.com`
- [✓] PM2 shows app as "online"
- [✓] Can generate license keys
- [✓] Keys appear in Supabase database
- [✓] Email delivery works
- [✓] SSL certificate is valid (green padlock in browser)
- [✓] Application survives server restart
- [✓] No errors in PM2 logs
- [✓] Nginx is properly configured

---

## Next Steps

After successful deployment:

1. **Test all features thoroughly**
2. **Set up monitoring** (optional: UptimeRobot, Pingdom)
3. **Configure database backups** in Supabase
4. **Document your domain and credentials** securely
5. **Share access with your team**
6. **Set up a staging environment** for testing updates

---

## Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review PM2 logs: `pm2 logs`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify environment variables are correct
5. Ensure Supabase and Activepieces services are working

---

**Congratulations!** 🎉 Your License Key Manager is now deployed and running on DigitalOcean!

