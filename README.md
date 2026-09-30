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

1. In `backend`, install dependencies and copy `.env.example` to `.env`.
2. Set `MONGO_URI` to the Atlas connection string, and set unique values for `JWT_SECRET` and `CRON_SECRET`. Configure the `ADMIN_EMAIL` and `ADMIN_PASSWORD` seed credentials.
3. In MongoDB Atlas, open **Network Access** and add the current machine's public IP address. An IP allowlist change is made in Atlas; it does not normally require changing `MONGO_URI`. If the database username or password changed, update the URI and URL-encode reserved characters in the credentials.
4. Run `npm run seed` once in `backend` to create or update the admin account, then run `npm run dev`.
5. In `frontend`, install dependencies, copy `.env.example` to `.env`, and run `npm run dev`.

The backend listens on port `5000` and the Vite frontend on port `5173` by default. Set `CLIENT_URL` to the frontend origin. Never commit `.env` files or use an unrestricted Atlas IP allowlist in production.

## Optional Services

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable in-editor media uploads. Without these values, posts can still use externally hosted media URLs. Uploads are limited to common image formats, MP4/WebM/MOV video, and PDF, up to 20 MB per file.

Scheduled posts publish every minute on a persistent Node server. Vercel uses the configured cron endpoint; set `CRON_SECRET` in the deployment environment and confirm the Vercel plan supports the configured schedule.

## Deployment

Set the backend environment variables in the hosting provider, including `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and `CRON_SECRET`. Set frontend `VITE_API_URL` to the deployed API base URL ending in `/api`. The `backend/vercel.json` cron job requires a Vercel deployment with cron support.