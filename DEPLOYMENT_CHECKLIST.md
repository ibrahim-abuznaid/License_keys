# Deployment Checklist

Use this checklist to ensure everything is properly configured before going live.

## Pre-Deployment

### Database Setup
- [ ] Supabase project created
- [ ] Database migration executed successfully
- [ ] Tables visible in Table Editor (license_keys, key_history)
- [ ] Sample key created and visible in database
- [ ] RLS policies configured (if using authentication)

### Email Service Setup
- [ ] Activepieces flow created for email sending
- [ ] Webhook trigger configured
- [ ] Email sending piece added (Gmail/SendGrid/SMTP)
- [ ] Webhook URL saved to EMAIL_WEBHOOK_URL
- [ ] Test email sent successfully
- [ ] Email appears professional and formatted correctly

### Environment Configuration
- [ ] `.env.local` created (for local development)
- [ ] All required environment variables set
- [ ] Variables tested and working locally
- [ ] Sensitive keys not committed to git
- [ ] `.env.example` updated with current structure

### Local Testing
- [ ] `npm install` runs without errors
- [ ] `npm run dev` starts successfully
- [ ] Application loads at http://localhost:3000
- [ ] Can generate a license key
- [ ] Key appears in database
- [ ] Email sent and received
- [ ] Search functionality works
- [ ] Extend key action works
- [ ] Deal closed action works
- [ ] Disable key action works
- [ ] Resend email action works (Send Email button)

## Production Deployment

### Code Preparation
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] No linter errors: `npm run lint`
- [ ] Production build successful: `npm run build`
- [ ] Git repository clean and pushed

### Platform Setup (Vercel Example)
- [ ] Account created on hosting platform
- [ ] Repository connected
- [ ] Build settings configured
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] Node.js version set (18.x or higher)

### Production Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] `RESEND_API_KEY` added
- [ ] `NEXT_PUBLIC_APP_URL` updated to production URL
- [ ] `FROM_EMAIL` set to verified domain email
- [ ] All variables encrypted/secured by platform

### Production Testing
- [ ] Deployment successful
- [ ] Application accessible via production URL
- [ ] Generate test license key
- [ ] Verify key in Supabase
- [ ] Test email delivery (check inbox)
- [ ] Test all CRUD operations
- [ ] Test on mobile devices
- [ ] Test in different browsers (Chrome, Firefox, Safari)

### Email Configuration
- [ ] Activepieces flow is published (not draft)
- [ ] Email service in flow is properly configured
- [ ] FROM_EMAIL set appropriately in environment
- [ ] Email templates render correctly
- [ ] Links in emails work correctly
- [ ] No typos in email content
- [ ] Support email is correct

### Security Checklist
- [ ] Service role key only used server-side
- [ ] No sensitive data in client-side code
- [ ] CORS configured if needed
- [ ] Rate limiting considered (if high traffic)
- [ ] SSL/HTTPS enabled
- [ ] Environment variables not exposed

## Post-Deployment

### Monitoring Setup
- [ ] Error tracking configured (optional: Sentry)
- [ ] Analytics configured (optional: Plausible, Google Analytics)
- [ ] Uptime monitoring set up
- [ ] Email delivery monitoring (Activepieces flow logs)
- [ ] Database usage monitoring (Supabase dashboard)

### Documentation
- [ ] README.md reviewed and accurate
- [ ] SETUP_GUIDE.md shared with team
- [ ] QUICK_REFERENCE.md shared with sales team
- [ ] Production URL documented
- [ ] Admin credentials documented (if auth added)

### Team Onboarding
- [ ] Sales team trained on using the system
- [ ] Demo session conducted
- [ ] Quick reference card distributed
- [ ] Support channel created (#sales-tools)
- [ ] Escalation process defined

### Operational Readiness
- [ ] Backup strategy defined
- [ ] Recovery process documented
- [ ] Support email monitored
- [ ] Runbook created for common issues
- [ ] On-call person designated

## Scale Considerations

### When to Upgrade Plans

#### Supabase Free → Pro
Upgrade when:
- [ ] Database size approaching 500MB
- [ ] Need more than 2GB bandwidth/month
- [ ] Require daily backups
- [ ] Need more than 50,000 monthly active users

#### Email Service (in Activepieces Flow)
Upgrade when:
- [ ] Email volume exceeds your service's free tier
- [ ] Need dedicated IP or advanced features
- [ ] Require better deliverability
- [ ] Need detailed analytics

#### Vercel Hobby → Pro
Upgrade when:
- [ ] Bandwidth exceeds 100GB/month
- [ ] Need team collaboration
- [ ] Require password protection
- [ ] Need advanced analytics

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor email delivery rate
- [ ] Review new license keys

### Weekly
- [ ] Review database growth
- [ ] Check disk space
- [ ] Update expired keys status
- [ ] Review usage metrics

### Monthly
- [ ] Update dependencies: `npm outdated`
- [ ] Review and archive old keys
- [ ] Check service costs vs. plan limits
- [ ] Backup database

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Feature usage analysis
- [ ] User feedback review

## Emergency Contacts

```
Technical Lead: _______________
DevOps: _______________
Sales Manager: _______________
Support Team: _______________

Supabase Support: support@supabase.com
Activepieces Support: support@activepieces.com
Vercel Support: support@vercel.com
```

## Rollback Plan

If deployment fails:

1. **Immediate Actions**
   - [ ] Revert to previous deployment in hosting platform
   - [ ] Check error logs for specific issues
   - [ ] Notify team of rollback

2. **Diagnosis**
   - [ ] Review recent code changes
   - [ ] Check environment variables
   - [ ] Verify external services (Supabase, Activepieces webhook)
   - [ ] Test locally with production settings

3. **Resolution**
   - [ ] Fix identified issues
   - [ ] Test thoroughly in staging
   - [ ] Document the issue and fix
   - [ ] Redeploy when stable

## Success Criteria

Deployment is successful when:
- [✓] Application is accessible and loads quickly
- [✓] All features work as expected
- [✓] Emails are being delivered reliably
- [✓] Database operations are fast
- [✓] No critical errors in logs
- [✓] Team can use the system confidently

## Post-Launch Review

Schedule a review meeting 1 week after launch:
- [ ] Gather user feedback
- [ ] Review metrics and usage
- [ ] Identify pain points
- [ ] Plan improvements
- [ ] Celebrate success! 🎉

---

**Remember**: It's better to launch late and stable than early and broken.

Take your time with each checklist item. Your future self will thank you!

