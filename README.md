# Gallery Grid

Next.js gallery with a rotating grid, Cloudinary integration, weather, PWA caching, and a stable image list.

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Do not commit `.env.local`.

Without Cloudinary credentials the site still uses its built-in legacy image catalogue. Set the variables below to add images from Cloudinary:

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=gallery
OPENWEATHER_API_KEY=
```

## Image sources

- The existing catalogue stays available in its current List order.
- Images in the Cloudinary Media Library asset folder `gallery` are appended to List from newest to oldest.
- Home and Cloud Grid shuffle the combined catalogue and avoid duplicate visible images.

The gallery refreshes its server cache every five minutes. The webhook endpoint is optional and is not required for using a Cloudinary Free account.

## Deploy to Vercel

Import the Git repository into Vercel, then set every variable from `.env.example` in **Project Settings → Environment Variables**.

Legacy bookmark routes redirect to the new Next.js routes:

- `/index.html` → `/`
- `/pages/cloud-grid.html` → `/cloud-grid`
- `/pages/list.html` → `/list`
- `/pages/small-grid.html` → `/small-grid`

## Checks

```sh
npx tsc --noEmit
npm run build
```
