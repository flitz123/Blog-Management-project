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

Scheduled posts publish every minute on a persistent Node server. Vercel uses the configured cron endpoint; set `CRON_SECRET` in the deployment environment and confirm the Vercel plan supports the configured schedule.

## Deployment

Import the repository once as a Vercel services project. The root [`vercel.json`](./vercel.json) deploys the Express `backend` service and Vite `frontend` service, exposing `/api/*` on the backend and all other paths on the frontend.

1. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `CRON_SECRET`, and optionally `CLIENT_URL` to the shared Vercel project environment. For local development, `CLIENT_URL` defaults to `http://localhost:5173`.
2. Do not set `VITE_API_URL` for the normal Vercel deployment; the frontend uses `/api` and Vercel routes it to the backend. For local development it falls back to `http://localhost:5000/api`.
3. Deploy and run `vercel dev` to test the frontend, backend, rewrites, and cron route together.

The root `vercel.json` defines the backend cron endpoint, which uses `CRON_SECRET` as a Bearer token. Vercel cron support must be available on the selected plan.
