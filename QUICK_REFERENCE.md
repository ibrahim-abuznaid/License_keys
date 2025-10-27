# Quick Reference Card - Sales Team

## 🚀 Quick Start

1. Open: [http://localhost:3000](http://localhost:3000) (or your production URL)
2. Fill in customer details in the form
3. Click "Generate License Key"
4. Key automatically emailed to customer!

## 📋 Feature Presets Explained

| Preset | Use Case | Features Included |
|--------|----------|-------------------|
| **Business** | Most common for Enterprise plans | All features EXCEPT Embed SDK |
| **Embed** | For customers embedding Activepieces | Embed SDK, Templates, Pieces Management |
| **All** | Premium/special deals | Every single feature |
| **None** | Custom selection | Manually pick features |

## 🎯 Common Scenarios

### Scenario 1: New Trial Request
1. Enter customer email
2. Select deployment type (Cloud or Self-Hosted)
3. Choose "Business" preset
4. Keep default 14 days
5. ✅ Check "Send trial key email"
6. Click Generate

### Scenario 2: Extend Existing Trial
1. Search for customer email in the table
2. Click "+Days" button
3. Enter days to add (default: 7)
4. Done! Customer notified if needed

### Scenario 3: Deal Closed! 🎉
1. Find the customer's trial key
2. Click "Close" button
3. Enter Active Flows Limit (e.g., 1000)
4. Confirm
5. System automatically:
   - Converts trial → development key
   - Creates new production key
   - Sends welcome email with both keys

### Scenario 4: Send Email Again
1. Find the customer's key
2. Click "Email" button
3. Email sent immediately via webhook!

### Scenario 5: Disable Key
1. Find the key to disable
2. Click "Disable" button
3. Confirm action
4. Key immediately deactivated

## 🔍 Search Tips

- **Search by email**: `john@company.com`
- **Search by domain**: `@company.com`
- **Search by partial**: `john` or `company`

## 📊 Table Columns Explained

| Column | What It Means |
|--------|---------------|
| **Email** | Customer's email address |
| **Key** | The license key (AP-XXXX-XXXX-XXXX-XXXX) |
| **Type** | Trial / Development / Production |
| **Status** | Active / Disabled / Expired |
| **Deployment** | Cloud or Self-Hosted |
| **Created** | When key was generated |
| **Expires** | When trial ends (empty for paid) |

## 🏷️ Status Badges

- 🟢 **ACTIVE**: Key is working and valid
- 🔴 **DISABLED**: Key has been manually disabled
- 🟡 **EXPIRED**: Trial period ended

## 🔑 Key Types

- 🔵 **TRIAL**: Initial trial key (14 days default)
- 🟣 **DEVELOPMENT**: For dev/staging (from closed deal)
- 🟦 **PRODUCTION**: For production use (from closed deal)

## 💡 Pro Tips

1. **Always search before creating**: Check if customer already has a key
2. **Extend generously**: Happy customers convert better
3. **Note deployment type**: Cloud vs Self-Hosted affects instructions
4. **Check spam folders**: Ask customers to check spam if they don't see email
5. **Keep keys secure**: Never share keys in public channels

## 📧 Email Templates

### Trial Email Includes:
- License key
- Trial period duration
- Enabled features list
- Step-by-step activation instructions
- Support contact info

### Welcome Email Includes:
- Development key (former trial)
- Production key (new)
- Flow limits
- Both activation instructions
- Next steps guidance

## ⚠️ Common Issues & Solutions

### Issue: "Customer didn't receive email"
**Solutions:**
1. Click "Email" button to resend
2. Ask customer to check spam folder
3. Verify email address spelling
4. Check Activepieces flow execution logs for status

### Issue: "Need to change features"
**Solution:** Generate a new key with correct features

### Issue: "Customer needs more time"
**Solution:** Use "+Days" to extend trial

### Issue: "Deal fell through"
**Solution:** Click "Disable" to deactivate the key

## 🎓 Training Scenarios

### Practice Exercise 1: Standard Trial
- Customer: sarah@techcorp.com
- Type: Cloud
- Plan: Business features
- Duration: 14 days

### Practice Exercise 2: Embed Trial
- Customer: dev@embedco.io
- Type: Self-Hosted
- Plan: Embed features
- Duration: 30 days (special request)

### Practice Exercise 3: Deal Closed
- Customer: john@enterprise.com (existing trial)
- Flow Limit: 5000
- Result: Dev + Prod keys created

## 📞 When to Escalate

Contact tech team if:
- System is down or not loading
- Keys aren't being generated
- Emails consistently failing
- Customer reports key not activating
- Need custom features not in presets

## 🔗 Useful Links

- **Dashboard**: [Your Production URL]
- **Supabase DB**: [Your Supabase Dashboard]
- **Email Logs**: [Activepieces Flow Logs]
- **Support Docs**: [Activepieces Docs]

## 🎯 Success Metrics

Track your performance:
- Keys generated per week
- Average trial duration
- Extension rate
- Conversion rate (trial → paid)
- Email delivery success

---

**Remember**: Speed matters! Generate keys quickly to keep momentum in sales conversations.

**Questions?** Ask in #sales-tools Slack channel

Last Updated: January 2024

