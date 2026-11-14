# Blog Management System

## Features

- Reader, author, and admin roles with protected authoring and administration routes
- Account registration, sign-in, profile editing, and password changes
- Draft, published, scheduled, and archived posts, including revision history
- Search, categories, tags, SEO titles/descriptions/slugs, and post view counts
- Markdown posts with image, video, and PDF uploads through signed Cloudinary uploads
- Likes, named guest or registered-user comments, replies, and admin moderation
- Admin overview, user role management, account removal, and category management

## Local Setup

1. Create a Supabase project and open its **SQL Editor**.
2. Run the schema in [`backend/supabase/schema.sql`](./backend/supabase/schema.sql) to create the application tables and indexes.
3. In `backend`, install dependencies and copy `.env.example` to `.env`. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project's API settings. The service-role key is for the backend only; never put it in frontend environment variables or commit it.
4. Set unique values for `JWT_SECRET` and `CRON_SECRET`. Configure the `ADMIN_EMAIL` and `ADMIN_PASSWORD` seed credentials.
5. Run `npm run seed` once in `backend` to create or update the admin account, then run `npm run dev`.
6. In `frontend`, install dependencies, copy `.env.example` to `.env`, and run `npm run dev`.

The backend requires Node.js 22 or newer. Existing data in MongoDB is not copied automatically; export and migrate it separately if you need to keep it.

The backend listens on port `5000` and the Vite frontend on port `5173` by default. Set `CLIENT_URL` to the frontend origin. Row-level security is enabled on the application tables; the backend uses its server-only service-role key to access them. Never expose that key to the browser or commit `.env` files.

## Optional Services

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable in-editor media uploads. Without these values, posts can still use externally hosted media URLs. Uploads are limited to common image formats, MP4/WebM/MOV video, and PDF, up to 20 MB per file.

Scheduled posts publish through the daily Vercel cron configuration in [vercel.json](./vercel.json). Once per day at midnight UTC, Vercel calls the protected `/api/cron/publish-scheduled` endpoint with `CRON_SECRET`. Posts whose scheduled time has passed are published, so scheduled publication may be delayed until the next daily run.


## Deployment on Vercel

The root [`vercel.json`](./vercel.json) deploys the repository as one services project:

- `backend`: Express service rooted at `backend`.
- `frontend`: Vite static service rooted at `frontend`.
- `/api/(.*)` is routed to `backend`.
- All other paths are routed to `frontend`.

1. Import the repository into Vercel. In **Project Settings → Build and Deployment → Root Directory**, use the repository root (clear `frontend`; do not set `frontend` or `backend`). The root `vercel.json` needs both folders and the root-level `api` entry point.
2. Vercel does not read your local `backend/.env`. In **Project Settings → Environment Variables**, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and `CRON_SECRET` for Production (and Preview if you test preview deployments). Use the Supabase project URL and server-only service-role key; generate new, strong secrets for `JWT_SECRET` and `CRON_SECRET`. Add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `CLOUDINARY_*` values if needed.
3. For this single-project deployment, leave `VITE_API_URL` unset so the frontend uses the same-origin `/api` routes. If it is set to a local URL such as `http://localhost:5000/api`, production builds now fall back to `/api`. Do not add the Supabase service-role key to any `VITE_*` variable.
4. Deploy, then check `https://<your-vercel-domain>/api/health`. Registration and sign-in require the response to report `"status":"ok"`; if it reports a configuration error, verify the Vercel environment variables and redeploy. On the Hobby plan, Vercel invokes `/api/cron/publish-scheduled` once daily at midnight UTC and authenticates it with the project `CRON_SECRET`. Upgrade to Pro for more frequent cron runs.
5. Redeploy after changing environment variables.
6. Run `npm run seed` locally with the deployed environment values before using the configured admin account.

Do not reuse secrets that were committed previously. Vercel's cron schedule requires a supported account plan, so check the project dashboard if cron invocations do not appear.

### Deploying the backend as a separate Vercel project

If the backend has its own Vercel project, set its **Root Directory** to `backend`. The [`backend/vercel.json`](./backend/vercel.json) install command is relative to that directory. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` in that backend project's environment variables before deploying.

For a separately deployed frontend, set `VITE_API_URL` in the frontend project's environment variables to the backend deployment URL ending in `/api` (for example, `https://your-backend.vercel.app/api`) and redeploy the frontend. Without this setting, production builds use same-origin `/api`, as in the single-project setup above.
