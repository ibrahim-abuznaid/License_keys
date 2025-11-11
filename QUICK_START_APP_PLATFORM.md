# Quick Start: Deploy to DigitalOcean App Platform

**Time to deploy: ~10 minutes** ⚡

---

## Prerequisites ✅

- [ ] GitHub account
- [ ] DigitalOcean account
- [ ] Code pushed to GitHub
- [ ] Supabase credentials ready
- [ ] Activepieces webhook URL

---

## 5-Step Deployment

### 1️⃣ Push to GitHub (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/License_keys.git
git push -u origin main
```

### 2️⃣ Create App in DigitalOcean

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click **Create** → **Apps**
3. Choose **GitHub** → Select your repository
4. Click **Next**

### 3️⃣ Configure Build Settings

Auto-detected settings (verify):
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: `3000`

Click **Next**

### 4️⃣ Add Environment Variables ⚠️ IMPORTANT

Click **Edit** → **Environment Variables**, add:

```
NODE_ENV = production
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
EMAIL_WEBHOOK_URL = your_webhook_url
ADMIN_USERNAME = admin
ADMIN_PASSWORD = your_password
NEXT_PUBLIC_APP_URL = ${APP_URL}
FROM_EMAIL = noreply@yourdomain.com
```

✅ Mark all secrets as **Encrypted**

Click **Save** → **Next**

### 5️⃣ Choose Plan and Deploy

- Select **Basic ($5/mo)** plan
- Choose region (e.g., New York)
- Click **Create Resources**

---

## ⏱️ Wait 3-5 Minutes

Watch the build logs. When you see:
```
✓ Build successful
✓ Health check passed
✓ Deployment live
```

Your app is ready! 🎉

---

## 🧪 Test Your Deployment

1. Click the provided URL (e.g., `https://your-app.ondigitalocean.app`)
2. Try logging in
3. Generate a test license key
4. Verify it appears in Supabase

---

## 🚀 Next Steps

### Auto-Deploy Setup (Already Enabled!)
Every `git push` triggers automatic deployment:

```bash
git add .
git commit -m "Update features"
git push origin main
# → Automatically deploys! ✨
```

### Add Custom Domain (Optional)

1. **In App Platform**: Settings → Domains → Add Domain
2. **In DNS Provider**: Add CNAME record:
   ```
   CNAME  keys  your-app.ondigitalocean.app
   ```
3. **Wait**: SSL auto-provisions in 15-60 minutes

---

## 🐛 Common Issues

### Build Fails
- Check if `npm run build` works locally
- Verify all dependencies in `package.json`
- Check Build Logs in DigitalOcean

### App Crashes
- Check Runtime Logs
- Verify all environment variables are set
- Ensure values don't have extra spaces/quotes

### Can't Login
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
- Look for errors in Runtime Logs
- Check browser console (F12)

### Supabase Connection Fails
- Verify URLs have no trailing slashes
- Check API keys are complete
- Test Supabase dashboard is accessible

---

## 📊 Monitor Your App

**View Logs:**
- Dashboard → Your App → **Runtime Logs**

**View Metrics:**
- Dashboard → Your App → **Insights**

**View Deployments:**
- Dashboard → Your App → **Deployments**

---

## 💰 Cost

- **Basic Plan**: $5/month (512MB RAM)
- **Bandwidth**: 1TB included
- **SSL**: Free
- **Domain**: Free

**Total: $5/month** for most use cases

---

## 📚 Full Documentation

For detailed guide, see: **DIGITALOCEAN_APP_PLATFORM_GUIDE.md**

---

## ✅ Success Checklist

- [ ] App builds successfully
- [ ] App accessible via HTTPS
- [ ] Login works
- [ ] Can generate keys
- [ ] Keys saved to Supabase
- [ ] Emails sending
- [ ] No errors in logs

---

## 🆘 Need Help?

1. **Check**: `DIGITALOCEAN_APP_PLATFORM_GUIDE.md` (troubleshooting section)
2. **Logs**: Runtime Logs in DigitalOcean dashboard
3. **Support**: [DigitalOcean Community](https://digitalocean.com/community)

---

**That's it! Your app is live!** 🎉

App Platform vs Droplet:
- ✅ **Easier**: No SSH, Nginx, PM2 configuration
- ✅ **Faster**: 10 min vs 60 min setup
- ✅ **Automatic**: SSL, deployments, scaling
- ✅ **Cheaper**: $5/mo vs $6/mo + DevOps time

**Recommendation**: Use App Platform for this application! 🚀

