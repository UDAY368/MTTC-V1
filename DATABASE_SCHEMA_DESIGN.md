# Database Schema Design - Meditation Quiz Application

## Overview
This document explains the Prisma database schema design for the Meditation Teacher Training Quiz Application.

---

## Entity Relationships

```
Course (1) ──< (Many) Quiz (1) ──< (Many) Question (1) ──< (Many) Option
                                                              │
                                                              │
QuizAttempt (1) ──< (Many) UserAnswer ──> (Many) Option
                │
                └──> (Many) Question
```

---

## Core Entities

### 1. **Course**
- Represents a meditation course/program (e.g., "Meditation Teacher Training Program")
- **Fields:**
  - `id`: Unique identifier (CUID)
  - `name`: Course name
  - `description`: Optional course description
  - `createdAt` / `updatedAt`: Timestamps

- **Relations:**
  - Has many `Quiz` records

---

### 2. **Quiz**
- Represents a quiz within a course (e.g., "Day 1 Quiz", "Day 2 Quiz")
- **Fields:**
  - `id`: Unique identifier (CUID)
  - `courseId`: Foreign key to Course
  - `title`: Quiz title (e.g., "Day 1 Quiz")
  - `description`: Optional quiz description
  - `durationMinutes`: Quiz duration in minutes (for countdown timer)
  - `uniqueUrl`: **Unique public URL slug** (e.g., "meditation-day-1-quiz-abc123")
    - This is the key field that allows users to access quizzes without login
    - Must be unique across all quizzes
  - `isActive`: Whether quiz is currently active
  - `createdAt` / `updatedAt`: Timestamps

- **Relations:**
  - Belongs to one `Course`
  - Has many `Question` records
  - Has many `QuizAttempt` records

- **Indexes:**
  - Indexed on `courseId` for fast course-based queries
  - Indexed on `uniqueUrl` for fast public URL lookups

---

### 3. **Question**
- Represents a question within a quiz
- **Fields:**
  - `id`: Unique identifier (CUID)
  - `quizId`: Foreign key to Quiz
  - `text`: Question text/content
  - `type`: `QuestionType` enum
    - `SINGLE_CHOICE`: Radio button (one answer)
    - `MULTIPLE_CHOICE`: Checkbox (multiple answers)
  - `order`: Order of question in quiz (1, 2, 3...)
  - `createdAt` / `updatedAt`: Timestamps

- **Relations:**
  - Belongs to one `Quiz`
  - Has many `Option` records
  - Has many `UserAnswer` records

- **Indexes:**
  - Indexed on `quizId` for fast quiz-based queries
  - Composite index on `[quizId, order]` for ordered question retrieval

---

### 4. **Option**
- Represents an answer option for a question
- **Fields:**
  - `id`: Unique identifier (CUID)
  - `questionId`: Foreign key to Question
  - `text`: Option text/content
  - `isCorrect`: Boolean flag indicating if this is a correct answer
  - `order`: Order of option (1, 2, 3...)
  - `createdAt` / `updatedAt`: Timestamps

- **Relations:**
  - Belongs to one `Question`
  - Has many `UserAnswer` records (many-to-many through UserAnswer)

- **Indexes:**
  - Indexed on `questionId` for fast question-based queries
  - Composite index on `[questionId, order]` for ordered option retrieval

---

## Quiz Attempt & Scoring

### 5. **QuizAttempt**
- Represents a user's attempt at taking a quiz
- **Fields:**
  - `id`: Unique identifier (CUID)
  - `quizId`: Foreign key to Quiz
  - `uniqueUrl`: The quiz URL used for this attempt (for tracking/analytics)
  - `startedAt`: When the attempt started (auto-set on creation)
  - `submittedAt`: When the attempt was submitted (null until submitted)
  - `score`: Calculated score (null until submitted)
    - **Backend calculates this** - never trust frontend
  - `totalQuestions`: Total questions in quiz at time of attempt (snapshot)
  - `isSubmitted`: Boolean flag for quick filtering
  - `createdAt` / `updatedAt`: Timestamps

- **Relations:**
  - Belongs to one `Quiz`
  - Has many `UserAnswer` records

- **Indexes:**
  - Indexed on `quizId` for fast quiz-based queries
  - Indexed on `uniqueUrl` for analytics
  - Indexed on `submittedAt` for filtering submitted attempts

---

### 6. **UserAnswer**
- Represents a user's answer to a question
- **Design Pattern:**
  - For **single choice** questions: One `UserAnswer` record per question
  - For **multiple choice** questions: Multiple `UserAnswer` records per question (one per selected option)

- **Fields:**
  - `id`: Unique identifier (CUID)
  - `attemptId`: Foreign key to QuizAttempt
  - `questionId`: Foreign key to Question
  - `optionId`: Foreign key to Option (the option the user selected)
  - `createdAt`: Timestamp

- **Relations:**
  - Belongs to one `QuizAttempt`
  - Belongs to one `Question`
  - Belongs to one `Option`

- **Constraints:**
  - **Unique constraint** on `[attemptId, questionId, optionId]` to prevent duplicate selections
  - This ensures a user can't select the same option twice for the same question

- **Indexes:**
  - Indexed on `attemptId`, `questionId`, and `optionId` for fast queries

---

## Admin Authentication (Future)

### 7. **Admin**
- Represents admin users who can create/manage courses and quizzes
- **Fields:**
  - `id`: Unique identifier (CUID)
  - `email`: Unique email address
  - `password`: Hashed password (using bcrypt)
  - `name`: Optional admin name
  - `createdAt` / `updatedAt`: Timestamps

- **Note:** JWT authentication will be implemented in the backend API layer

---

## Design Decisions

### 1. **Unique URL System**
- Each `Quiz` has a `uniqueUrl` field that serves as the public access point
- Users can access quizzes via: `/quiz/{uniqueUrl}` without authentication
- This enables the "no login required" user experience

### 2. **Score Calculation**
- `score` is stored in `QuizAttempt` and calculated **server-side only**
- Never trust frontend calculations for security
- Score is null until quiz is submitted

### 3. **Question Ordering**
- Both `Question` and `Option` have `order` fields for consistent display
- Composite indexes ensure fast ordered retrieval

### 4. **Cascade Deletes**
- Deleting a `Course` cascades to `Quiz`
- Deleting a `Quiz` cascades to `Question`, `Option`, and `QuizAttempt`
- Deleting a `QuizAttempt` cascades to `UserAnswer`
- This maintains referential integrity

### 5. **Multiple Choice Handling**
- Multiple choice questions are handled by creating multiple `UserAnswer` records
- Each selected option gets its own `UserAnswer` record
- Backend can query all `UserAnswer` records for a question to determine user's selections

### 6. **Extensibility**
- Schema is designed to support future features:
  - Certificates (can add `Certificate` model linked to `QuizAttempt`)
  - Payments (can add `Payment` model)
  - User accounts (can add `User` model and link to `QuizAttempt`)
  - Analytics (all necessary indexes and relations are in place)

---

## Next Steps

1. Set up PostgreSQL database
2. Configure `DATABASE_URL` in environment variables
3. Run `npx prisma migrate dev` to create database tables
4. Generate Prisma Client with `npx prisma generate`

---

## Security Considerations

- **Quiz Tampering Prevention:**
  - All score calculations happen server-side
  - User answers are stored immediately (can't be modified after submission)
  - `submittedAt` timestamp prevents late modifications

- **URL Security:**
  - `uniqueUrl` should be generated using cryptographically secure random strings
  - Consider adding rate limiting on quiz access endpoints
