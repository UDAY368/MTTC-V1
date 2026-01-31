# Deploying Flash Decks API (Railway)

If the frontend shows **"Route /api/flash-decks not found" (404)**, the Railway backend is running an older build that doesn’t include the flash-decks routes.

## Steps

### 1. Push the latest backend code

Ensure all backend changes (including `server.js`, `routes/flashCardDeckRoutes.js`, `routes/dayFlashCardDeckRoutes.js`, controllers, Prisma schema, etc.) are committed and pushed to the branch Railway deploys from (e.g. `main`).

```bash
git add backend/
git commit -m "Add flash-decks and day-flash-decks API"
git push origin main
```

### 2. Run migrations on the Railway database

The new schema adds `FlashCardDeck`, `FlashCardDeckCard`, and `DayFlashCardDeck`. Run migrations against the **Railway** database:

**Option A – From your machine (recommended)**  
Set `DATABASE_URL` (or `DATABASE_PUBLIC_URL`) in `backend/.env` to your Railway Postgres connection string, then:

```bash
cd backend
npm run prisma:migrate:add-flash-decks
# or: npx prisma migrate deploy
```

**Option B – From Railway**  
If your start command runs migrations before starting (e.g. `npm run start:deploy`), a new deploy will run migrations. Otherwise run the migrate command via Railway’s shell/CLI if available.

### 3. Redeploy the backend on Railway

- If Railway auto-deploys on push, wait for the new deployment after step 1.
- Otherwise, trigger a new deploy from the Railway dashboard (or CLI) for the backend service.

After a successful deploy and migrations, `POST https://meditation-training-be.up.railway.app/api/flash-decks` will be available and the 404 will stop.
