# ZyroCORP US BPO Website — V1

A responsive static frontend plus Cloudflare Worker API and D1 lead database scaffold.

## What's included
- `public/`: responsive one-page marketing website, calculator, lead enquiry form, favicon.
- `worker/index.js`: `GET /api/health` and `POST /api/leads` endpoints.
- `schema.sql`: D1 lead table and indexes.
- `wrangler.toml`: Cloudflare Worker + static assets + D1 binding configuration.

## Important launch safeguards
- This is a TEST build. Do not attach the Zyro International production domain.
- Do not publish claims such as ISO 27001 certification, guaranteed 24/7/365 coverage, guaranteed <60-second answering, or guaranteed savings unless ZyroCORP has evidence and approved service commitments.
- Calculator inputs are illustrative assumptions, not an offer or quote.
- The admin link is intentionally a placeholder. No admin dashboard or public lead-list endpoint is included. Add admin only behind Cloudflare Access and role-based authorization.
- The lead form stores data only after D1 is configured. Until then it returns a clear configuration error; it does not pretend a lead was saved.

## Deploy with GitHub + Cloudflare
Recommended: create a NEW GitHub repository, for example `zyrocorp-us-bpo-v1`, and a NEW Cloudflare Worker project. Keep the current Zyro International and earlier ZYROCORP projects untouched.

### 1. Create D1 database
```bash
npx wrangler d1 create zyrocorp-leads
```
Copy the returned database ID into `wrangler.toml` at `database_id`.

### 2. Create the table
```bash
npx wrangler d1 execute zyrocorp-leads --remote --file=./schema.sql
```

### 3. Configure allowed origin
Set Worker variable `ALLOWED_ORIGINS` to the exact test origin, e.g. `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev`. Add the final custom domain only after launch approval. If you use a preview domain, include that exact origin too.

Optional webhook:
```bash
npx wrangler secret put LEAD_NOTIFY_WEBHOOK
```
Use a private CRM/automation webhook. Never put webhook tokens in frontend JavaScript or GitHub.

### 4. Deploy
```bash
npm install -D wrangler
npx wrangler deploy
```
The Worker serves files from `public/` and routes `/api/*` to the API. Check:
- `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/`
- `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/health`

### 5. Test lead submission
Submit the website form using a test email. Then verify the row:
```bash
npx wrangler d1 execute zyrocorp-leads --remote --command="SELECT id, created_at, full_name, company, service, status FROM leads ORDER BY created_at DESC LIMIT 10;"
```
Do not use real customer data during initial testing.

## Data and security notes
- Validate and minimize collected data.
- Configure Cloudflare rate limiting / Turnstile before public launch.
- Restrict CORS with `ALLOWED_ORIGINS`.
- Add a privacy notice, retention/deletion policy and a secure internal process for lead access.
- Do not create a public endpoint to list leads.
- Before production, add server-side rate limiting/abuse controls, Turnstile verification, notification retries/logging, and admin authentication via Cloudflare Access.
- Confirm data-processing, cross-border transfer and client contract requirements with qualified counsel before handling US customer end-user data.

## V1 QA checklist
- [ ] Desktop, tablet and mobile layout
- [ ] Navigation and section links
- [ ] Savings calculator at 1, 3, 10 and 20 agents
- [ ] Required fields and invalid email validation
- [ ] API health endpoint
- [ ] Valid form submission saved to D1
- [ ] Empty honeypot accepted; filled honeypot ignored
- [ ] Disallowed Origin rejected
- [ ] No secrets in frontend or repository
- [ ] Privacy notice and final commercial claims approved
