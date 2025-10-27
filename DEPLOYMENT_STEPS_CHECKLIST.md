# DigitalOcean Deployment - Quick Checklist

Use this checklist while deploying. Check off each step as you complete it.

---

## ✅ Phase 1: Server Setup

- [ ] SSH into droplet: `ssh root@YOUR_DROPLET_IP`
- [ ] Update system: `apt update && apt upgrade -y`
- [ ] Create user: `adduser deployer`
- [ ] Add sudo: `usermod -aG sudo deployer`
- [ ] Switch user: `su - deployer`

---

## ✅ Phase 2: Install Software

- [ ] Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs`
- [ ] Check versions: `node --version && npm --version`
- [ ] Install Git: `sudo apt install -y git`
- [ ] Install PM2: `sudo npm install -g pm2`
- [ ] Install Nginx: `sudo apt install -y nginx`
- [ ] Start Nginx: `sudo systemctl start nginx && sudo systemctl enable nginx`

---

## ✅ Phase 3: Deploy Application

- [ ] Create directory: `sudo mkdir -p /var/www/license-keys && sudo chown -R $USER:$USER /var/www/license-keys`
- [ ] Navigate: `cd /var/www/license-keys`
- [ ] Clone or upload code
- [ ] Install dependencies: `npm install`
- [ ] Build application: `npm run build`

---

## ✅ Phase 4: Environment Variables

- [ ] Create file: `nano .env.production`
- [ ] Add all variables (see main guide)
- [ ] Save: `Ctrl+X`, `Y`, `Enter`
- [ ] Set permissions: `chmod 600 .env.production`

---

## ✅ Phase 5: PM2 Setup

- [ ] Create config: `nano ecosystem.config.js`
- [ ] Add PM2 config (see main guide)
- [ ] Create logs: `mkdir -p logs`
- [ ] Start app: `pm2 start ecosystem.config.js`
- [ ] Save: `pm2 save`
- [ ] Auto-start: `pm2 startup` (run the command it outputs)
- [ ] Check status: `pm2 status && pm2 logs`

---

## ✅ Phase 6: Nginx Configuration

- [ ] Remove default: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Create config: `sudo nano /etc/nginx/sites-available/license-keys`
- [ ] Add nginx config (see main guide)
- [ ] Enable: `sudo ln -s /etc/nginx/sites-available/license-keys /etc/nginx/sites-enabled/`
- [ ] Test: `sudo nginx -t`
- [ ] Restart: `sudo systemctl restart nginx`
- [ ] Configure firewall: `sudo ufw allow 'Nginx Full' && sudo ufw allow OpenSSH && sudo ufw enable`

---

## ✅ Phase 7: SSL Certificate

- [ ] Install certbot: `sudo apt install -y certbot python3-certbot-nginx`
- [ ] Get certificate: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
- [ ] Follow prompts, choose option 2 (redirect)
- [ ] Test renewal: `sudo certbot renew --dry-run`

---

## ✅ Phase 8: Verification

- [ ] Check PM2: `pm2 status`
- [ ] Test local: `curl http://localhost:3000`
- [ ] Test domain: Open browser → `https://yourdomain.com`
- [ ] Generate test key
- [ ] Verify in Supabase
- [ ] Test email sending
- [ ] Check all features work

---

## 📝 Important Notes

**Environment Variables Needed:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EMAIL_WEBHOOK_URL=
NEXT_PUBLIC_APP_URL=
FROM_EMAIL=
NODE_ENV=production
```

**Common Commands:**
```bash
pm2 status                     # Check app status
pm2 logs                       # View logs
pm2 restart license-key-manager # Restart app
sudo systemctl restart nginx   # Restart Nginx
```

---

## 🚨 If Something Goes Wrong

1. Check logs: `pm2 logs license-key-manager`
2. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Verify app running: `curl http://localhost:3000`
4. Check environment: `cat .env.production`
5. Restart services: `pm2 restart license-key-manager && sudo systemctl restart nginx`

---

## ✅ Deployment Complete!

Once all steps are checked, your application is live at: `https://yourdomain.com`

**Next:**
- Test all features
- Monitor logs for first few hours
- Document credentials securely
- Share with team

---

**Need detailed instructions?** See `MANUAL_DEPLOYMENT_DIGITALOCEAN.md`

