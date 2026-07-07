# 10 — Frontend Dashboard Spec

## Goal

Build a functional web dashboard that lets users manage API access, credits, providers, and usage. Admins can moderate models/providers and inspect the network.

Visual design can be simple. Functional completeness matters more than aesthetics.

## Global layout

### Header

- Nuvonode Mesh logo text
- Current user email/display name
- Role badge if admin
- Logout button

### Sidebar

User navigation:

- Overview
- Projects
- API Keys
- Models
- Credits
- Usage
- Providers
- Settings

Admin navigation shown only for admins:

- Admin Overview
- Providers
- Provider Models
- Models
- Jobs
- Usage
- Wallets
- Audit Log

## Public pages

### `/`

Landing page for local/dev.

Content:

- Product summary
- "Open-source AI inference mesh"
- Buttons: Login, Register, GitHub
- V1 disclaimer: internal credits only, no cash payout

### `/register`

Fields:

- Display name
- Email
- Password
- Confirm password

On success:

- Create user
- Create default wallet with starting credits
- Redirect dashboard

### `/login`

Fields:

- Email
- Password

On success: store JWT and redirect dashboard.

## User dashboard pages

### `/dashboard`

Cards:

- Credit balance
- Reserved credits
- API calls last 24h
- Active projects
- Online providers owned by user
- Quick start curl command if user has API key

Warning card:

> V1 credits are internal usage credits only. They cannot be withdrawn or converted to cash.

Privacy card:

> Community-routed prompts may be processed on machines owned by community providers. Do not send secrets or sensitive data.

### `/dashboard/projects`

Table columns:

- Name
- Public ID
- Status
- Monthly credit limit
- Current month spend
- Created
- Actions

Actions:

- Create project
- Edit name
- Set monthly limit
- Delete project

Create form:

- Name required
- Monthly credit limit optional

### `/dashboard/api-keys`

Requires selected project.

Table columns:

- Name
- Prefix
- Status
- Last used
- Created
- Actions

Actions:

- Create key
- Revoke key

After create:

Show one-time plaintext key in `CopyBox`.

Message:

> Copy this key now. It will not be shown again.

### `/dashboard/models`

Cards/table:

- Display name
- Slug
- Context length
- Input credits/1K
- Output credits/1K
- Min VRAM
- Community allowed
- Status

Model detail:

- Description
- License notes
- Privacy suitability
- Example API request

### `/dashboard/credits`

Cards:

- Available credits
- Reserved credits
- Total earned as provider
- Total spent as API user

Ledger table:

- Date
- Type
- Amount
- Reserved delta
- Reason
- Reference

Permanent disclaimer at top:

> Credits are internal platform credits. They are not money, cannot be sold, cannot be withdrawn, and have no cash value in V1.

### `/dashboard/usage`

Filters:

- Project
- Model
- Date from/to
- Status

Table:

- Date
- Project
- Model
- Provider
- Input tokens
- Output tokens
- Cost credits
- Latency
- Status
- Job ID

### `/dashboard/providers`

List owned providers.

Table:

- Name
- Approval
- Status
- Trust level
- Last seen
- Online instances
- Credits earned
- Actions

Actions:

- Create provider
- View setup
- Rotate token
- Disable

### `/dashboard/providers/new`

Form:

- Name
- Region hint
- Allow auto model pull checkbox, default false

On create, show:

- One-time provider token
- Init command
- Install steps

Setup instructions:

```bash
# 1. Install Ollama and pull a supported model manually.
# 2. Download/build provider node.
nuvonode-provider init --server http://localhost:18080 --token <token> --name "Home RTX"
nuvonode-provider doctor
nuvonode-provider serve
```

### `/dashboard/providers/[id]`

Sections:

- Provider details
- Token status, rotate button
- Online/offline status
- Hardware reports
- Advertised models
- Approval status
- Recent jobs
- Earnings ledger

Provider model table:

- Runtime model name
- Mapped Nuvonode model
- Status
- Tokens/sec
- Latency
- Last seen

## Admin pages

### `/admin`

Cards:

- Total users
- Online providers
- Pending providers
- Pending model advertisements
- Requests last 24h
- Failed jobs last 24h
- Total internal credits granted/spent/earned

### `/admin/providers`

Table:

- Provider
- Owner
- Approval
- Status
- Trust level
- Last seen
- GPU
- Success rate
- Actions

Actions:

- Approve
- Reject
- Disable
- Set trust level
- View details

### `/admin/provider-models`

Pending advertisements.

Columns:

- Provider
- Runtime
- Runtime model name
- Suggested model mapping
- GPU VRAM
- Benchmark
- Status
- Actions

Actions:

- Map to model/version
- Approve
- Reject

### `/admin/models`

Model registry CRUD.

Fields:

- Slug
- Display name
- Family
- Modality
- Context length
- Default max output tokens
- Input credits per 1K
- Output credits per 1K
- Provider reward ratio
- Minimum VRAM MB
- Recommended VRAM MB
- License name
- License URL
- License notes
- Community allowed
- External only
- Status

### `/admin/jobs`

Job inspection.

Columns:

- Job ID
- Date
- Project
- User
- Model
- Provider
- Status
- Estimated cost
- Actual cost
- Error code
- Latency

### `/admin/wallets`

Wallet lookup by user email/public id.

Actions:

- Grant credits
- Remove credits
- Add correction with mandatory reason

Manual adjustment form must require:

- Wallet id
- Amount
- Reason
- Confirmation checkbox

### `/admin/audit-log`

Read-only audit table.

## Empty states

Every table needs a helpful empty state.

Example for API keys:

> No API keys yet. Create one to call Nuvonode models from your application.

## Error states

Show error message from API `error.message`. Also show request id if present.

## Loading states

Use simple skeleton or text:

> Loading...

## UI copy requirements

Do not say "earn money" in V1. Say:

- "earn internal credits"
- "provider credit rewards"
- "credits can be spent on model usage"

Do not say:

- "withdraw"
- "cash out"
- "payout"
- "income"
- "profit"

Except in documentation explaining that V1 does not support these.
