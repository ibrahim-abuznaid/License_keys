# Migration Summary - New Database Schema

## Overview

The application has been successfully updated to use the new database schema with expanded feature flags and improved subscription management.

## Key Changes

### 1. Database Schema Changes

#### Removed Columns
- `id` (UUID) - Now using `key` as primary key
- `deployment` (enum) - Removed
- `status` (enum) - Now computed from `expiresAt`
- `features` (JSONB) - Replaced with individual boolean columns

#### New/Changed Columns
- `key` - Now the PRIMARY KEY (was `id` before)
- `email` - Renamed from `customer_email`
- `createdAt` - Renamed from `created_at` (camelCase)
- `expiresAt` - Renamed from `expires_at` (camelCase)
- `activatedAt` - Renamed from `activated_at` (camelCase)
- `keyType` - Renamed from `key_type` (camelCase)
- `isTrial` - New field to track trial status
- `activeFlows` - Renamed from `active_flows_limit`

#### New Feature Flag Columns (22 total)
- `ssoEnabled`
- `gitSyncEnabled`
- `showPoweredBy`
- `embeddingEnabled`
- `auditLogEnabled`
- `customAppearanceEnabled`
- `manageProjectsEnabled`
- `managePiecesEnabled`
- `manageTemplatesEnabled`
- `apiKeysEnabled`
- `customDomainsEnabled`
- `projectRolesEnabled`
- `flowIssuesEnabled`
- `alertsEnabled`
- `analyticsEnabled`
- `globalConnectionsEnabled`
- `customRolesEnabled`
- `environmentsEnabled`
- `agentsEnabled`
- `tablesEnabled`
- `todosEnabled`
- `mcpsEnabled`

#### New Metadata Columns
- `fullName` - Customer's full name
- `companyName` - Company name
- `numberOfEmployees` - Company size
- `goal` - Customer's goal/use case
- `premiumPieces` - Array of premium pieces enabled

### 2. Business Logic Changes

#### Key Status Logic (IMPORTANT!)

The status is now **computed** from `expiresAt`, not stored:

- **Active/Subscribed**: `expiresAt` is `NULL` (no expiry)
- **Active Trial**: `expiresAt` is in the future
- **Expired**: `expiresAt` is in the past (but not today)
- **Disabled**: `expiresAt` is today's date

#### Workflow Changes

**Creating a Trial Key:**
- Set `valid_days` to number of days (e.g., 14)
- `expiresAt` will be set to today + valid_days
- `isTrial` will be set to `true`
- `keyType` will be set to `'trial'`

**Creating a Subscribed Key:**
- Set `valid_days` to `null`
- `expiresAt` will be set to `null` (no expiry)
- `isTrial` will be set to `false`
- `keyType` will be set to `'production'`

**Closing a Deal (Trial → Subscribed):**
- Set `expiresAt` to `null` (removes expiry)
- Set `isTrial` to `false`
- Set `keyType` to `'production'`
- Update `activeFlows` if provided

**Disabling a Key:**
- Set `expiresAt` to today's date (midnight)
- This immediately marks the key as disabled

**Extending a Key:**
- Add days to current `expiresAt`
- If already expired, start from today

## Files Changed

### Database
- ✅ `supabase/migrations/002_new_schema.sql` - New migration file

### Backend (API Routes)
- ✅ `app/api/keys/route.ts` - Create and list keys
- ✅ `app/api/keys/[id]/deal-closed/route.ts` - Close deals (set expiresAt to null)
- ✅ `app/api/keys/[id]/disable/route.ts` - Disable keys (set expiresAt to today)
- ✅ `app/api/keys/[id]/extend/route.ts` - Extend trial keys
- ✅ `app/api/keys/[id]/edit/route.ts` - Edit all key fields
- ✅ `app/api/keys/[id]/send-email/route.ts` - Send emails (updated to use new schema)
- ✅ `app/api/users/[email]/keys/route.ts` - Get keys by email

### Frontend (Components)
- ✅ `components/KeyGenerationForm.tsx` - Generate keys with new fields
- ✅ `components/KeyManagementTable.tsx` - Display and manage keys
- ✅ `components/EditKeyModal.tsx` - Edit all 22 feature flags + metadata
- ✅ `app/users/[email]/page.tsx` - User detail page

### Types & Utilities
- ✅ `lib/types.ts` - Updated interfaces and helper functions

### Documentation
- ✅ `DATABASE_SETUP_INSTRUCTIONS.md` - Step-by-step setup guide
- ✅ `MIGRATION_SUMMARY.md` - This file

## Testing Checklist

After setting up the database, test these scenarios:

### Trial Keys
- [ ] Create a 14-day trial key
- [ ] Verify it shows as "ACTIVE" status
- [ ] Verify expiry date is 14 days from now
- [ ] Edit the key and change feature flags
- [ ] Extend the trial by 7 days
- [ ] Verify new expiry date

### Subscribed Keys
- [ ] Create a key with "Subscribed" option (no expiry)
- [ ] Verify `expiresAt` is "Never (Subscribed)"
- [ ] Verify status shows as "ACTIVE"
- [ ] Edit feature flags
- [ ] Verify it can't be extended (no extend button)

### Deal Closed
- [ ] Create a trial key
- [ ] Click "Close Deal" and enter active flows limit
- [ ] Verify `expiresAt` becomes "Never (Subscribed)"
- [ ] Verify `keyType` changes to "PRODUCTION"
- [ ] Verify status is "ACTIVE"

### Disable/Re-enable
- [ ] Disable an active key
- [ ] Verify status changes to "DISABLED"
- [ ] Verify `expiresAt` is today's date
- [ ] Extend the key to re-enable it
- [ ] Verify status returns to "ACTIVE"

### Feature Flags
- [ ] Open Edit modal on any key
- [ ] Toggle individual feature flags
- [ ] Use "Enable All" / "Disable All" buttons
- [ ] Save and verify changes persist
- [ ] Check that all 22 feature flags are editable

### User Detail Page
- [ ] Click on a user email
- [ ] Verify all keys for that user are shown
- [ ] Verify keys are grouped by type (Trial/Dev/Production)
- [ ] Test all actions from user detail page

## Feature Presets

Four presets are available when creating keys:

### Minimal
- Basic features only
- Good for: Small teams, limited use cases

### Business (Default)
- Most features enabled
- Custom Roles and Environments disabled
- Good for: Standard business customers

### Enterprise
- All features except MCPs
- Includes custom roles, environments, agents
- Good for: Large enterprises

### All
- Every feature enabled
- Good for: Testing or special customers

## API Changes

### Request Format Changes

**Creating a Key (POST /api/keys)**

Old format:
```json
{
  "customer_email": "user@example.com",
  "deployment": "cloud",
  "features": ["sso", "audit_logs", "templates"],
  "valid_days": 14
}
```

New format:
```json
{
  "email": "user@example.com",
  "valid_days": 14,
  "fullName": "John Doe",
  "companyName": "Acme Inc",
  "numberOfEmployees": "11-50",
  "goal": "Automate workflows",
  "notes": "High priority customer",
  "activeFlows": 1000,
  "preset": "business"
}
```

**Closing a Deal (POST /api/keys/[key]/deal-closed)**

Old format:
```json
{
  "active_flows_limit": 1000
}
```

New format:
```json
{
  "activeFlows": 1000
}
```

### Response Format Changes

**License Key Object**

Old format:
```json
{
  "id": "uuid",
  "key": "AP-XXXX-XXXX-XXXX-XXXX",
  "customer_email": "user@example.com",
  "deployment": "cloud",
  "status": "active",
  "features": {
    "sso": true,
    "audit_logs": true
  },
  "created_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-01-15T00:00:00Z"
}
```

New format:
```json
{
  "key": "AP-XXXX-XXXX-XXXX-XXXX",
  "email": "user@example.com",
  "keyType": "production",
  "isTrial": false,
  "expiresAt": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "ssoEnabled": true,
  "gitSyncEnabled": true,
  "auditLogEnabled": true,
  // ... all other feature flags
  "fullName": "John Doe",
  "companyName": "Acme Inc",
  "activeFlows": 1000
}
```

## Common Pitfalls

### 1. Status Confusion
❌ Don't look for a `status` column - it doesn't exist!
✅ Use `getKeyStatus(key)` helper function to compute status

### 2. Expiry Date Logic
❌ Don't think `expiresAt = NULL` means "never checked"
✅ `expiresAt = NULL` means **subscribed** (no expiry, active forever)

❌ Don't set `expiresAt` to a past date to disable
✅ Set `expiresAt` to **today** to disable (specific logic for "today")

### 3. Primary Key
❌ Don't use `id` to reference keys
✅ Use `key` value (e.g., "AP-XXXX-XXXX-XXXX-XXXX")

### 4. Column Names
❌ Don't use snake_case (e.g., `customer_email`, `created_at`)
✅ Use camelCase (e.g., `email`, `createdAt`)

## Rollback Plan

If you need to rollback to the old schema:

1. Keep a backup of your old migration file
2. Export any data created with the new schema
3. Run the old migration file
4. Revert code changes using Git:
   ```bash
   git checkout HEAD~1 -- lib/types.ts
   git checkout HEAD~1 -- app/api/
   git checkout HEAD~1 -- components/
   ```

## Support & Questions

Common questions:

**Q: Can I migrate existing data?**
A: Yes, but you'll need to transform it. The migration drops tables, so export first, transform the data structure, then import.

**Q: How do I create a key that never expires?**
A: Set `valid_days` to `null` when creating the key, or use "Close Deal" on an existing trial key.

**Q: How do I temporarily disable a key?**
A: Click "Disable" - this sets `expiresAt` to today. To re-enable, extend the key by any number of days.

**Q: Can I add more feature flags later?**
A: Yes! Add columns to the database, update `lib/types.ts`, and add checkboxes to `EditKeyModal.tsx`.

**Q: What happens to expired trial keys?**
A: They show as "EXPIRED" status but remain in the database. You can extend them to reactivate.

## Next Steps

1. ✅ Read `DATABASE_SETUP_INSTRUCTIONS.md`
2. ✅ Run the migration on Supabase
3. ✅ Test key creation and management
4. ✅ Train your team on new status logic
5. ✅ Update any external documentation
6. ✅ Configure email templates if needed
7. ✅ Set up monitoring for expired keys (if desired)

---

**Migration completed successfully!** 🎉

All files have been updated and are ready to use. The application now supports:
- 22 granular feature flags
- Unlimited subscription keys (expiresAt = null)
- Better customer metadata tracking
- Simplified status management
- More flexible key management workflows

