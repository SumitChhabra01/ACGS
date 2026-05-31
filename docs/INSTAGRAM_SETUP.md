# Connect Instagram (@cineai_diaries) to AICOS

> **Why you can't connect with just a handle:** Instagram's API only lets an app
> read accounts **you own/manage**, and only **Business/Creator** accounts, using a
> **Meta access token** + the account's **IG Business Account ID** — never the `@handle`.
> This guide gets you those credentials. It takes ~20–30 minutes, one time.

What you'll be able to do after this:
- Pull all your posts + their reach/likes/comments/saves
- See engagement rate, best posting time/day, best format
- Get automated growth recommendations (fed into the content engine)

---

## Step 0 — Check / fix your account type (5 min)

1. Open Instagram app → your profile → **☰ menu** → **Settings and privacy**.
2. Go to **Account type and tools** → **Switch to professional account**.
3. Choose **Creator** (or **Business**). Either works for the API.

If it already says "Professional / Creator / Business", you're good.

## Step 1 — Link to a Facebook Page (5 min)

The Graph API reads Instagram **through** a Facebook Page. The Page can be brand new and empty.

1. Create a Page: <https://www.facebook.com/pages/create> (name it anything, e.g. "CineAI Diaries").
2. Link it to Instagram: in the IG app → **Settings** → **Account type and tools** →
   **Sharing to other apps** / **Page** → connect your new Facebook Page.
   - (Alternatively from the Page: **Settings → Linked accounts → Instagram → Connect**.)

## Step 2 — Create a Meta Developer App (5 min)

1. Go to <https://developers.facebook.com/apps> and log in.
2. **Create App** → use case **"Other"** → type **Business** → name it (e.g. "AICOS").
3. In the app dashboard, **Add product → Instagram Graph API** (and **Facebook Login** if prompted).

## Step 3 — Get an access token (5 min)

Fastest path for a single admin (your own account):

1. Open the **Graph API Explorer**: <https://developers.facebook.com/tools/explorer/>
2. Top-right: select your **App**.
3. Click **Generate Access Token** / **Get User Access Token**.
4. Add these permissions (scopes), then generate:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
5. Approve the popup (pick your Page + Instagram account). Copy the token.

> This token is **short-lived (~1 hour)**. For automation, exchange it for a
> **long-lived token (~60 days)** — see "Long-lived token" below.

## Step 4 — Put the token in AICOS (2 min)

In the project root `.env` (never commit it):

```
META_ACCESS_TOKEN=PASTE_YOUR_TOKEN_HERE
# Leave this blank — AICOS will auto-discover it from your linked Page:
IG_BUSINESS_ACCOUNT_ID=
```

## Step 5 — Verify the connection

```bash
cd services
.venv\Scripts\activate
python run.py ig-verify
```

Expected output:
```json
{ "connected": true, "page": "CineAI Diaries", "ig_user_id": "1784...", "username": "cineai_diaries" }
```

Copy the `ig_user_id` into `.env` as `IG_BUSINESS_ACCOUNT_ID` (optional, but saves an API call each run).

## Step 6 — Pull your posts + insights

```bash
python run.py ig-sync       # raw media + insights
python run.py analytics     # engagement rate, best time/day, growth recommendations
```

---

## Long-lived token (for the daily automation)

Short-lived tokens expire in ~1h. Exchange for a ~60-day token:

```
https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=YOUR_META_APP_ID
  &client_secret=YOUR_META_APP_SECRET
  &fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
```

Put `META_APP_ID` / `META_APP_SECRET` in `.env`, call that URL, and store the returned
long-lived token as `META_ACCESS_TOKEN`. For GitHub Actions, also add it under
**Repo → Settings → Secrets and variables → Actions** as `META_ACCESS_TOKEN`
(and `IG_BUSINESS_ACCOUNT_ID`). The daily `agents-analytics` workflow uses them.

> Phase 3 will add an in-dashboard "Connect Instagram" button (Facebook Login OAuth)
> so you won't touch the Graph Explorer or tokens manually. For now this manual
> path gets you live data fastest.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `No Instagram Business Account linked to any Page` | Account isn't Business/Creator, or not linked to the Page (Steps 0–1). |
| `(#10) Application does not have permission` | Re-generate token with `instagram_manage_insights` + `pages_read_engagement`. |
| `Error validating access token ... expired` | Token expired — get a long-lived token (above). |
| Insights empty for old posts | Instagram only returns insights for recent media / Business accounts. |

## What's still manual vs automated
- **Reading** posts + insights: fully automated once the token is set. ✅
- **Posting** (publishing new content): separate Graph API permission
  (`instagram_content_publish`) — wired in Phase 3 behind the same app. Until then,
  AICOS drafts content for your approval and you post the approved piece.
