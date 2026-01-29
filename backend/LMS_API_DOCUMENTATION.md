# LMS API Documentation

This document describes the new API endpoints added for the Learning Management System (LMS) extension.

---

## Days API

### Get All Days for a Course
```
GET /api/days?courseId=xxx
```
**Query Parameters:**
- `courseId` (required): Course ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "day-id",
      "courseId": "course-id",
      "title": "Day 1",
      "description": "Optional description",
      "order": 1,
      "createdAt": "2026-01-25T...",
      "updatedAt": "2026-01-25T...",
      "_count": {
        "resources": 5,
        "dayQuizzes": 2
      }
    }
  ]
}
```

### Get Single Day with All Resources
```
GET /api/days/:id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "day-id",
    "title": "Day 1",
    "description": "...",
    "order": 1,
    "course": {
      "id": "course-id",
      "name": "Course Name"
    },
    "resources": [
      // All resources with nested data
    ],
    "dayQuizzes": [
      // All attached quizzes
    ]
  }
}
```

### Create Day
```
POST /api/days
```
**Body:**
```json
{
  "courseId": "course-id",
  "title": "Day 1",
  "description": "Optional description"
}
```

### Update Day
```
PUT /api/days/:id
```
**Body:**
```json
{
  "title": "Updated Day 1",
  "description": "Updated description"
}
```

### Delete Day
```
DELETE /api/days/:id
```

### Reorder Days
```
PUT /api/days/reorder
```
**Body:**
```json
{
  "dayIds": ["day-id-1", "day-id-2", "day-id-3"]
}
```

---

## Resources API

### Get All Resources for a Day
```
GET /api/resources?dayId=xxx
```
**Query Parameters:**
- `dayId` (required): Day ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "resource-id",
      "dayId": "day-id",
      "type": "VIDEO",
      "title": "Introduction Video",
      "order": 1,
      "isVisible": true,
      "videoUrl": "https://youtube.com/...",
      "noteParagraphs": [],
      "flashCards": []
    }
  ]
}
```

### Get Single Resource
```
GET /api/resources/:id
```

### Create Resource

#### VIDEO Resource
```
POST /api/resources
```
**Body:**
```json
{
  "dayId": "day-id",
  "type": "VIDEO",
  "title": "Introduction Video",
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

#### NOTES Resource
```
POST /api/resources
```
**Body:**
```json
{
  "dayId": "day-id",
  "type": "NOTES",
  "title": "Day 1 Notes",
  "noteParagraphs": [
    {
      "heading": "Section 1",
      "content": "Paragraph content here..."
    },
    {
      "heading": null,
      "content": "Another paragraph..."
    }
  ]
}
```

#### FLASH_CARDS Resource
```
POST /api/resources
```
**Body:**
```json
{
  "dayId": "day-id",
  "type": "FLASH_CARDS",
  "title": "Key Terms",
  "flashCards": [
    {
      "question": "What is meditation?",
      "answer": "Meditation is..."
    },
    {
      "question": "What is mindfulness?",
      "answer": "Mindfulness is..."
    }
  ]
}
```

#### SHORT_QUESTIONS Resource
```
POST /api/resources
```
**Body:**
```json
{
  "dayId": "day-id",
  "type": "SHORT_QUESTIONS",
  "title": "Quick Q&A",
  "question": "What is the purpose of this course?",
  "answer": "To train meditation teachers..."
}
```

#### ASSIGNMENT Resource
```
POST /api/resources
```
**Body:**
```json
{
  "dayId": "day-id",
  "type": "ASSIGNMENT",
  "title": "Day 1 Assignment",
  "assignmentQuestion": "Write a reflection on..."
}
```

### Update Resource
```
PUT /api/resources/:id
```
**Body:** (varies by resource type, same structure as create)

### Delete Resource
```
DELETE /api/resources/:id
```

### Toggle Resource Visibility
```
PUT /api/resources/:id/visibility
```
**Body:**
```json
{
  "isVisible": false
}
```

### Reorder Resources
```
PUT /api/resources/reorder
```
**Body:**
```json
{
  "resourceIds": ["resource-id-1", "resource-id-2", "resource-id-3"]
}
```

---

## Day-Quiz API

### Get All DayQuizzes for a Day
```
GET /api/day-quizzes?dayId=xxx
```
**Query Parameters:**
- `dayId` (required): Day ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dayquiz-id",
      "dayId": "day-id",
      "quizId": "quiz-id",
      "order": 1,
      "isVisible": true,
      "quiz": {
        "id": "quiz-id",
        "title": "Day 1 Quiz",
        "uniqueUrl": "meditation-day-1-quiz-abc123",
        "durationMinutes": 30,
        "isActive": true
      }
    }
  ]
}
```

### Get Single DayQuiz
```
GET /api/day-quizzes/:id
```

### Attach Quiz to Day
```
POST /api/day-quizzes
```
**Body:**
```json
{
  "dayId": "day-id",
  "quizId": "quiz-id"
}
```

### Update DayQuiz
```
PUT /api/day-quizzes/:id
```
**Body:**
```json
{
  "isVisible": false
}
```

### Detach Quiz from Day
```
DELETE /api/day-quizzes/:id
```

### Reorder DayQuizzes
```
PUT /api/day-quizzes/reorder
```
**Body:**
```json
{
  "dayQuizIds": ["dayquiz-id-1", "dayquiz-id-2", "dayquiz-id-3"]
}
```

---

## Updated Course API

The existing Course API endpoints now include `days` in their responses:

### Get All Courses
```
GET /api/courses
```
**Response now includes:**
```json
{
  "success": true,
  "data": [
    {
      "id": "course-id",
      "name": "Course Name",
      "quizzes": [...],
      "days": [
        {
          "id": "day-id",
          "title": "Day 1",
          "order": 1,
          "createdAt": "..."
        }
      ]
    }
  ]
}
```

### Get Course by ID
```
GET /api/courses/:id
```
**Response now includes:**
```json
{
  "success": true,
  "data": {
    "id": "course-id",
    "name": "Course Name",
    "quizzes": [...],
    "days": [
      {
        "id": "day-id",
        "title": "Day 1",
        "order": 1,
        "_count": {
          "resources": 5,
          "dayQuizzes": 2
        }
      }
    ]
  }
}
```

---

## Authentication

All endpoints (except public quiz endpoints) require admin authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Notes

1. **Ordering**: All `order` fields are integers starting from 1. Use reorder endpoints to update ordering.

2. **Visibility**: Both `Resource` and `DayQuiz` have `isVisible` fields. Hidden items won't appear to end users.

3. **Resource Types**: The `type` field must be one of:
   - `VIDEO`
   - `NOTES`
   - `FLASH_CARDS`
   - `SHORT_QUESTIONS`
   - `ASSIGNMENT`

4. **Quiz Attachment**: Quizzes are attached to Days via the `DayQuiz` junction table, not as Resources. This allows:
   - Multiple quizzes per Day
   - Reusing the same quiz across multiple Days
   - Independent visibility and ordering per Day

5. **Cascade Deletion**: 
   - Deleting a Course deletes all Days
   - Deleting a Day deletes all Resources and DayQuizzes
   - Deleting a Resource deletes all NoteParagraphs and FlashCards
