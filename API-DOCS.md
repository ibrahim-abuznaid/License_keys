# Activepieces License Key Manager — API Documentation

Base URL: `https://<your-domain>` (e.g. `https://plankton-app-cqrjv.ondigitalocean.app`)

---

## Authentication

The API uses two authentication methods depending on the endpoint:

| Method | Used by | How to provide |
|--------|---------|---------------|
| **Bearer Token** | External API endpoints (`/api/external/*`, `/api/cron/*`) | `Authorization: Bearer <API_SECRET_KEY>` header |
| **Session Cookie** | Dashboard endpoints (`/api/keys/*`, `/api/subscribers/*`, `/api/settings/*`) | Obtained via `POST /api/auth/login` |

---

## External API Endpoints

These endpoints are designed for third-party integrations (e.g. ActivePieces, Zapier). They require a Bearer token.

### POST /api/external/generate-key

Create a new license key with configurable preset and trial length.

**Auth:** Bearer token

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | Customer email (must contain `@`) |
| `fullName` | string | No | `null` | Customer full name |
| `companyName` | string | No | `null` | Company name |
| `numberOfEmployees` | string | No | `null` | Company size |
| `activeFlows` | number | No | `null` | Active flow limit |
| `goal` | string | No | `null` | Customer goal |
| `notes` | string | No | `null` | Internal notes |
| `sendEmail` | boolean | No | `true` | Send trial welcome email |
| `preset` | string | No | `"all"` | Feature preset: `minimal`, `business`, `enterprise`, `all`, or `embed` |
| `slackChannelId` | string | No | — | Slack channel ID for notifications |
| `valid_days` | number | No | `14` | Trial duration in days |

**Example:**

```bash
curl -X POST https://<your-domain>/api/external/generate-key \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "fullName": "John Doe",
    "companyName": "Acme Inc",
    "preset": "embed",
    "valid_days": 30,
    "slackChannelId": "C0123456789"
  }'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "key": "AP-XXXX-XXXX-XXXX-XXXX",
    "email": "customer@example.com",
    "keyType": "development",
    "isTrial": true,
    "expiresAt": "2026-05-09T00:00:00.000Z",
    "createdAt": "2026-04-09T00:00:00.000Z",
    "fullName": "John Doe",
    "companyName": "Acme Inc",
    "activeFlows": null,
    "preset": "embed"
  }
}
```

---

### GET /api/external/subscriber-settings

Fetch a subscriber's Slack channel configuration.

**Auth:** Bearer token

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Subscriber email |

**Example:**

```bash
curl "https://<your-domain>/api/external/subscriber-settings?email=customer@example.com" \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "email": "customer@example.com",
    "slackChannelId": "C0123456789"
  }
}
```

---

### PUT /api/external/subscriber-settings

Create or update a subscriber's Slack channel ID.

**Auth:** Bearer token

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Subscriber email |
| `slackChannelId` | string | Yes | Slack channel ID (pass `null` to clear) |

**Example:**

```bash
curl -X PUT https://<your-domain>/api/external/subscriber-settings \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "slackChannelId": "C0123456789"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "email": "customer@example.com",
    "slackChannelId": "C0123456789"
  }
}
```

---

## Cron Endpoint

### POST /api/cron/check-trials

Processes all trial keys and sends scheduled Slack notifications based on days relative to expiry. Called daily by a scheduled ActivePieces flow.

**Auth:** Bearer token

**Request body:** None (empty POST)

**Example:**

```bash
curl -X POST https://<your-domain>/api/cron/check-trials \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY"
```

**Response (200):**

```json
{
  "message": "Processed 12 trial keys against 4 schedule templates",
  "sent": 3,
  "results": [
    { "key": "AP-XXXX-...", "email": "user@example.com", "templateId": "trial_expiring_7d", "success": true }
  ]
}
```

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate with the dashboard.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `password` | string | Yes |

**Example:**

```bash
curl -X POST https://<your-domain>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "admin", "password": "secret" }'
```

**Response (200):**

```json
{ "success": true, "message": "Login successful" }
```

Sets an `auth_token` HTTP-only cookie for subsequent requests.

---

### GET /api/auth/check

Check if the current session is authenticated.

**Example:**

```bash
curl https://<your-domain>/api/auth/check \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{ "authenticated": true }
```

---

### POST /api/auth/logout

End the current session.

**Example:**

```bash
curl -X POST https://<your-domain>/api/auth/logout \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{ "success": true, "message": "Logout successful" }
```

---

## License Key Endpoints

All endpoints below require session authentication (cookie).

### GET /api/keys

List all license keys, optionally filtered by email search.

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Filter by email (case-insensitive partial match) |

**Example:**

```bash
curl "https://<your-domain>/api/keys?search=acme" \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{ "data": [ { "key": "AP-XXXX-...", "email": "...", "keyType": "development", ... } ] }
```

---

### POST /api/keys

Create a new license key from the dashboard.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | Customer email |
| `valid_days` | number \| null | No | `null` | Trial duration; `null` = subscribed (no expiry) |
| `fullName` | string | No | — | Customer name |
| `companyName` | string | No | — | Company name |
| `numberOfEmployees` | string | No | — | Company size |
| `goal` | string | No | — | Customer goal |
| `notes` | string | No | — | Internal notes |
| `preset` | string | No | `"business"` | Feature preset: `minimal`, `business`, `enterprise`, `all`, `embed` |
| `activeFlows` | number | No | `null` | Active flow limit |
| `slackChannelId` | string | No | — | Slack channel ID (stored in subscriber_settings) |
| `<featureFlag>` | boolean | No | — | Override any individual feature (e.g. `ssoEnabled: true`) |

**Example:**

```bash
curl -X POST https://<your-domain>/api/keys \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "valid_days": 14,
    "preset": "business",
    "fullName": "Jane Smith"
  }'
```

**Response (200):**

```json
{ "data": { "key": "AP-XXXX-...", "email": "customer@example.com", ... } }
```

---

### PUT /api/keys/[key]/edit

Update an existing license key. The `[key]` parameter is the license key value.

**Request body:** Any subset of fields from the license key. Common fields:

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Update email |
| `keyType` | string | `"development"` or `"production"` |
| `isTrial` | boolean | Trial flag |
| `expiresAt` | string \| null | Expiry date ISO string |
| `activeFlows` | number | Active flow limit |
| `fullName` | string | Customer name |
| `companyName` | string | Company name |
| `notes` | string | Internal notes |
| `slackChannelId` | string | Updates subscriber_settings |
| `<featureFlag>` | boolean | Any feature toggle |

**Example:**

```bash
curl -X PUT "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/edit" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Extended by sales team", "activeFlows": 50 }'
```

**Response (200):**

```json
{ "success": true, "data": { "key": "AP-XXXX-...", ... } }
```

---

### POST /api/keys/[key]/deal-closed

Convert a trial key to a subscribed key pair (development + production).

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `activeFlows` | number | No | inherited | Override active flow limit |
| `sendEmail` | boolean | No | `true` | Send deal-closed email |
| `subject` | string | No | — | Custom email subject (requires `htmlBody`) |
| `htmlBody` | string | No | — | Custom email HTML body |

**Example:**

```bash
curl -X POST "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/deal-closed" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "activeFlows": 100 }'
```

**Response (200):**

```json
{
  "data": {
    "developmentKey": { "key": "AP-XXXX-...", "keyType": "development", ... },
    "productionKey": { "key": "AP-YYYY-...", "keyType": "production", ... }
  }
}
```

---

### POST /api/keys/[key]/disable

Disable a license key by setting its expiry to today.

**Request body:** None

**Example:**

```bash
curl -X POST "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/disable" \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{ "data": { "key": "AP-XXXX-...", "expiresAt": "2026-04-09T00:00:00.000Z", ... } }
```

---

### POST /api/keys/[key]/extend

Extend a trial key's expiry date.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `additional_days` | number | Yes | Number of days to add (must be > 0) |

**Example:**

```bash
curl -X POST "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/extend" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "additional_days": 14 }'
```

**Response (200):**

```json
{ "data": { "key": "AP-XXXX-...", "expiresAt": "2026-05-07T...", ... } }
```

---

### POST /api/keys/[key]/reactivate

Reactivate a disabled or expired key.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `days` | number | No | `7` (trial) / unlimited (subscribed) | Days to reactivate for |

**Example:**

```bash
curl -X POST "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/reactivate" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "days": 14 }'
```

**Response (200):**

```json
{ "data": { "key": "AP-XXXX-...", "expiresAt": "2026-04-23T...", ... } }
```

---

### POST /api/keys/[key]/send-email

Send an email to the key holder.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | No | Custom subject (if omitted, sends default trial email) |
| `htmlBody` | string | No | Custom HTML body (required with `subject`) |

**Example (default trial email):**

```bash
curl -X POST "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/send-email" \
  -H "Cookie: auth_token=..."
```

**Example (custom email):**

```bash
curl -X POST "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/send-email" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "subject": "Your trial update", "htmlBody": "<h1>Hello!</h1>" }'
```

**Response (200):**

```json
{ "success": true }
```

---

### POST /api/keys/[key]/send-slack

Send a manual Slack message for a license key.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message text to send |

**Example:**

```bash
curl -X POST "https://<your-domain>/api/keys/AP-XXXX-XXXX-XXXX-XXXX/send-slack" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "message": "Follow up with this customer about their trial" }'
```

**Response (200):**

```json
{ "success": true }
```

---

## Subscriber Endpoints

### GET /api/subscribers

List all subscribers with aggregated key statistics. Supports search, status filter, and pagination.

**Auth:** Session cookie

**Query parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `search` | string | No | — | Search by email or key (partial match) |
| `status` | string | No | — | Filter: `trial`, `customer`, or `inactive` |
| `page` | number | No | `1` | Page number |
| `pageSize` | number | No | `10` | Items per page (max 100) |

**Example:**

```bash
curl "https://<your-domain>/api/subscribers?status=trial&page=1&pageSize=20" \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "email": "customer@example.com",
      "totalKeys": 2,
      "trialKeys": 1,
      "developmentKeys": 1,
      "productionKeys": 0,
      "activeKeys": 1,
      "latestCreatedAt": "2026-04-09T...",
      "hasActiveTrial": true,
      "fullName": "John Doe",
      "companyName": "Acme Inc",
      "status": "trial"
    }
  ],
  "meta": { "total": 42, "page": 1, "pageSize": 20, "totalPages": 3 }
}
```

---

### GET /api/users/[email]/keys

Fetch all license keys for a specific subscriber.

**Auth:** Session cookie

**Path parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `email` | string | URL-encoded subscriber email |

**Example:**

```bash
curl "https://<your-domain>/api/users/customer%40example.com/keys" \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{
  "success": true,
  "data": [ { "key": "AP-XXXX-...", "email": "customer@example.com", ... } ],
  "email": "customer@example.com"
}
```

---

### GET /api/subscribers/[email]/settings

Fetch subscriber settings (Slack channel ID).

**Auth:** Session cookie

**Example:**

```bash
curl "https://<your-domain>/api/subscribers/customer%40example.com/settings" \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{ "data": { "email": "customer@example.com", "slackChannelId": "C0123456789" } }
```

---

### PUT /api/subscribers/[email]/settings

Update subscriber settings.

**Auth:** Session cookie

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slackChannelId` | string | Yes | Slack channel ID (falsy clears it) |

**Example:**

```bash
curl -X PUT "https://<your-domain>/api/subscribers/customer%40example.com/settings" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "slackChannelId": "C0123456789" }'
```

**Response (200):**

```json
{ "data": { "email": "customer@example.com", "slackChannelId": "C0123456789", "updated_at": "..." } }
```

---

## Settings Endpoints

### GET /api/settings/notification-templates

List all notification templates.

**Auth:** Session cookie

**Response (200):**

```json
{
  "data": [
    {
      "id": "trial_started",
      "label": "Trial Started",
      "message": "New trial started for {{fullName}} ...",
      "enabled": true,
      "trigger_type": "action",
      "trigger_action": "key_created",
      "trigger_days": null,
      "updated_at": "..."
    }
  ]
}
```

---

### POST /api/settings/notification-templates

Create a new notification template.

**Auth:** Session cookie

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Template display name |
| `message` | string | Yes | Message template (supports `{{variables}}`) |
| `trigger_type` | string | Yes | `"action"` or `"schedule"` |
| `trigger_action` | string | Conditional | Required if `trigger_type` is `"action"`. One of: `key_created`, `key_edited`, `deal_closed`, `key_disabled`, `key_extended`, `key_reactivated` |
| `trigger_days` | number | Conditional | Required if `trigger_type` is `"schedule"`. Days relative to expiry (negative = before, 0 = on day, positive = after) |

**Example:**

```bash
curl -X POST https://<your-domain>/api/settings/notification-templates \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Trial Expiring in 1 Day",
    "message": "Trial for {{fullName}} expires tomorrow!",
    "trigger_type": "schedule",
    "trigger_days": -1
  }'
```

**Response (201):**

```json
{ "data": { "id": "trial_expiring_in_1_day", "label": "...", ... } }
```

---

### PUT /api/settings/notification-templates

Update an existing notification template.

**Auth:** Session cookie

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Template ID |
| `message` | string | No | Updated message |
| `enabled` | boolean | No | Enable/disable |
| `trigger_type` | string | No | `"action"` or `"schedule"` |
| `trigger_action` | string | No | Action trigger |
| `trigger_days` | number | No | Schedule trigger |

**Example:**

```bash
curl -X PUT https://<your-domain>/api/settings/notification-templates \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{ "id": "trial_started", "enabled": false }'
```

**Response (200):**

```json
{ "data": { "id": "trial_started", "enabled": false, ... } }
```

---

### DELETE /api/settings/notification-templates

Delete a notification template.

**Auth:** Session cookie

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Template ID to delete |

**Example:**

```bash
curl -X DELETE "https://<your-domain>/api/settings/notification-templates?id=trial_expiring_in_1_day" \
  -H "Cookie: auth_token=..."
```

**Response (200):**

```json
{ "success": true }
```

---

### GET /api/settings/cron-logs

Fetch the 50 most recent cron job execution logs.

**Auth:** Session cookie

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "ran_at": "2026-04-09T06:00:00.000Z",
      "trial_keys_processed": 12,
      "notifications_sent": 3,
      "schedule_templates_count": 4,
      "results": [
        { "key": "AP-XXXX-...", "email": "user@example.com", "templateId": "trial_expiring_7d", "success": true }
      ],
      "error": null,
      "duration_ms": 1523
    }
  ]
}
```

---

## Reference

### Feature Presets

| Preset | Description |
|--------|-------------|
| `minimal` | Basic features only — git sync, manage projects/pieces/templates, API keys, alerts, analytics, event streaming, flow issues |
| `business` | Adds SSO, audit log, custom appearance, project roles, global connections, tables |
| `enterprise` | Full feature set except custom domains — includes custom roles, environments, agents, secret managers, SCIM |
| `all` | Same as enterprise (all features except custom domains) |
| `embed` | Optimized for embedding — embedding enabled, custom appearance, manage projects/pieces/templates, API keys, alerts, analytics, global connections, tables, agents, flow issues |

### Available Template Variables

These variables can be used in notification template messages:

| Variable | Description |
|----------|-------------|
| `{{fullName}}` | Customer full name |
| `{{email}}` | Customer email |
| `{{companyName}}` | Company name |
| `{{expiresAt}}` | Expiry date (formatted) |
| `{{daysRemaining}}` | Days until expiry |
| `{{licenseKey}}` | License key value |

### Action Triggers

Available actions for action-based notification templates:

| Action | Fires when |
|--------|-----------|
| `key_created` | A new license key is created |
| `key_edited` | A license key is updated |
| `deal_closed` | A trial is converted to a subscription |
| `key_disabled` | A license key is disabled |
| `key_extended` | A trial key's expiry is extended |
| `key_reactivated` | A disabled/expired key is reactivated |

### Schedule Triggers

Schedule-based templates use `trigger_days` relative to the expiry date:

| `trigger_days` | Meaning |
|----------------|---------|
| `-7` | 7 days before expiry |
| `-3` | 3 days before expiry |
| `0` | On expiry day |
| `2` | 2 days after expiry |

### Error Responses

All endpoints return errors in a consistent format:

```json
{ "error": "Description of the error" }
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| `400` | Bad request (missing/invalid fields) |
| `401` | Unauthorized (invalid or missing auth) |
| `404` | Resource not found |
| `500` | Internal server error |
