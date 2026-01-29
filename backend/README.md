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

### 4. Create Admin User (Optional)

You can create an admin user using Prisma Studio or by running a script. For now, you can use Prisma Studio to manually create an admin:

1. Run `npm run prisma:studio`
2. Navigate to `admins` table
3. Create a new admin with:
   - `email`: Your admin email
   - `password`: Use bcrypt to hash your password (or create a script)

Or create a script to seed admin:

```javascript
// scripts/seedAdmin.js
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database.js';

const email = 'admin@example.com';
const password = 'admin123';
const hashedPassword = await bcrypt.hash(password, 10);

await prisma.admin.create({
  data: {
    email,
    password: hashedPassword,
    name: 'Admin User',
  },
});

console.log('Admin created successfully');
```

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

### Deploy to Railway (or similar)

1. **Environment variables** (in Railway dashboard):
   - `DATABASE_URL`: Set automatically if you add a PostgreSQL plugin; otherwise use your Postgres URL.
   - `FRONTEND_URL`: Your frontend URL (e.g. `https://your-app.vercel.app`). For multiple origins use comma-separated: `https://app.com,http://localhost:3000`.
   - `JWT_SECRET`: A secure random string.

2. **Run migrations on deploy** so the `courses` table exists. Set the **Start Command** to:
   ```bash
   npm run start:deploy
   ```
   This runs `prisma migrate deploy` then starts the server. If you see 500 on `/api/public/courses`, check Railway logs for "Database connection failed" or "Database error" and ensure migrations have been applied.

3. **Logs**: On startup the server logs "✅ Database connected" or "❌ Database connection failed" to help debug.

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
