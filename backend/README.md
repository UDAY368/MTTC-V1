# Meditation Quiz Backend API

Backend API for Meditation Teacher Training Quiz Application built with Node.js, Express.js, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Option 1: Use Separate DB Variables (Recommended)**
Update the following in `.env`:
- `DB_HOST`: Database host (e.g., `localhost` or `postgres.railway.internal`)
- `DB_PORT`: Database port (default: `5432`)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: A secure random string for JWT signing
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS

**Option 2: Use Direct DATABASE_URL**
Alternatively, you can set `DATABASE_URL` directly:
- `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database?schema=public`)

**Note:** If both are set, `DATABASE_URL` takes precedence. The application will automatically construct `DATABASE_URL` from the separate variables if `DATABASE_URL` is not set.

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Create Admin User (Required for login)

Login uses the **Admin** table (`admins`) in the database. Create an admin so you can sign in:

```bash
npm run seed:admin
```

This creates an admin with:
- **Email:** `admin@example.com`
- **Password:** `admin123`

If an admin with that email already exists, the script will skip creation and print the credentials. After running it, you can log in at the frontend login page.

Alternatively, you can create an admin via Prisma Studio:
1. Run `npm run prisma:studio`
2. Open the `admins` table
3. Add a row with `email`, `password` (must be bcrypt-hashed), and optional `name`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin (protected)

### Courses (Protected)

- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Quizzes (Protected)

- `GET /api/quizzes` - Get all quizzes (optional: `?courseId=xxx`)
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create quiz (generates unique URL)
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz

### Questions (Protected)

- `GET /api/questions?quizId=xxx` - Get questions by quiz
- `GET /api/questions/:id` - Get question by ID
- `POST /api/questions` - Create question with options
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `PUT /api/questions/reorder` - Reorder questions

### Public Quiz Access (No Authentication)

- `GET /api/public/quiz/:uniqueUrl` - Get quiz by unique URL
- `POST /api/public/quiz/:uniqueUrl/start` - Start quiz attempt
- `POST /api/public/attempts/:attemptId/answers` - Submit answer
- `POST /api/public/attempts/:attemptId/submit` - Submit quiz (calculates score)
- `GET /api/public/attempts/:attemptId` - Get quiz results

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Railway Setup & New Database Migrations

**1. Set Railway Variables (Backend service)**

In Railway → your **backend** service → **Variables**, add:

| Variable | Value | Notes |
|---------|--------|--------|
| `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@postgres.railway.internal:5432/railway` | Use the **internal** URL from your Postgres service (Variables tab); copy from the linked Postgres service. |
| `FRONTEND_URL` | `https://your-app.vercel.app` or `http://localhost:3000` | Comma-separated for multiple origins. |
| `JWT_SECRET` | A long random string | e.g. `openssl rand -hex 32` |

Optional (Railway often sets these when you link Postgres): `PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGUSER`. The app uses `DATABASE_URL`; the others are for reference.

**2. Run migrations from your local machine (using public URL)**

Use this while you create all content locally; the public URL works from your machine. When you're done, you can switch the backend on Railway to use the internal `DATABASE_URL`.

1. **In `backend/.env`:** Leave `DATABASE_URL` commented out (or unset). Only `DATABASE_PUBLIC_URL` should be set to your Railway Postgres **public** URL (e.g. `trolley.proxy.rlwy.net:56539`).

2. **From the backend folder, run:**

```bash
cd backend
npm install
# Apply all migrations to the Railway DB (uses DATABASE_PUBLIC_URL from .env)
npm run prisma:migrate:deploy
# Optional: open Prisma Studio to view/edit data
npm run prisma:studio
# Optional: seed admin user so you can log in
# npm run seed:admin
```

3. **When you're done** creating content and want the deployed backend to use the internal URL: in Railway → backend service → **Variables**, set `DATABASE_URL` to the **internal** URL (e.g. `postgres.railway.internal:5432`). Leave `DATABASE_PUBLIC_URL` only for local use.

**Option B – Run migrations on every deploy (recommended)**

In Railway → backend service → **Settings** → **Deploy** → set **Start Command** to:

```bash
npm run start:deploy
```

This runs `prisma migrate deploy` (applies any pending migrations) then starts the server. Use this so new deploys always have an up-to-date schema.

**3. One-time migration for a brand-new DB**

If the database is empty and you have not run migrations yet:

- **Locally:** Run `npm run prisma:migrate:deploy` once (Option A above).
- **On Railway:** Set Start Command to `npm run start:deploy` and deploy once; the first deploy will apply all migrations.

**4. Verify**

- **Locally:** `npm run dev` then call `GET /api/public/courses` (or open the frontend). You should see `[]` or course data.
- **Railway:** After deploy, check logs for "✅ Database connected". Then call your backend URL `/health` and `/api/public/courses`.

### Deploy to Railway (summary)

1. **Variables:** Set `DATABASE_URL` (internal), `FRONTEND_URL`, `JWT_SECRET` in the backend service.
2. **Start Command:** `npm run start:deploy` so migrations run on each deploy.
3. **Logs:** On startup you’ll see "✅ Database connected" or "❌ Database connection failed".

## API Request/Response Examples

### Admin Login

**Request:**
```json
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "clx...",
      "email": "admin@example.com",
      "name": "Admin User"
    }
  }
}
```

### Create Quiz

**Request:**
```json
POST /api/quizzes
Headers: { "Authorization": "Bearer <token>" }
{
  "courseId": "clx...",
  "title": "Day 1 Quiz",
  "description": "Introduction to Meditation",
  "durationMinutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "id": "clx...",
    "title": "Day 1 Quiz",
    "uniqueUrl": "quiz-abc123xyz",
    "durationMinutes": 30,
    ...
  }
}
```

### Start Quiz Attempt

**Request:**
```json
POST /api/public/quiz/quiz-abc123xyz/start
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz attempt started",
  "data": {
    "attemptId": "clx...",
    "startedAt": "2026-01-24T10:00:00Z",
    "durationMinutes": 30,
    "totalQuestions": 10
  }
}
```

### Submit Answer

**Request:**
```json
POST /api/public/attempts/clx.../answers
{
  "questionId": "clx...",
  "optionIds": ["clx..."]  // Array for multiple choice
}
```

### Submit Quiz

**Request:**
```json
POST /api/public/attempts/clx.../submit
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "attemptId": "clx...",
    "score": 8,
    "totalQuestions": 10,
    "submittedAt": "2026-01-24T10:30:00Z",
    "questions": [
      {
        "id": "clx...",
        "text": "What is meditation?",
        "type": "SINGLE_CHOICE",
        "correctOptions": [...],
        "userSelectedOptions": [...],
        "isCorrect": true
      },
      ...
    ]
  }
}
```

## Security Features

1. **JWT Authentication**: All admin routes are protected with JWT tokens
2. **Server-Side Score Calculation**: Scores are calculated on the server, never on the client
3. **Answer Validation**: Answers are validated against quiz structure
4. **No Answer Leakage**: Correct answers are not exposed until quiz is submitted
5. **CORS Protection**: Configured to allow only frontend origin

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {} // Optional, for validation errors
}
```

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

## Notes

- Quiz unique URLs are generated automatically and are cryptographically secure
- Quiz attempts cannot be modified after submission
- Scores are calculated server-side to prevent tampering
- All timestamps are stored in UTC
