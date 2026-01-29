# LMS Schema Extension - Design Documentation

## Overview
This document explains the Prisma database schema extension for transforming the Quiz Application into a full Learning Management System (LMS).

---

## Entity Relationships

```
Course (1) ──< (Many) Day (1) ──< (Many) Resource
                              │
                              └──< (Many) DayQuiz ──> (Many) Quiz

Resource (1) ──< (Many) NoteParagraph  (for NOTES type)
Resource (1) ──< (Many) FlashCard      (for FLASH_CARDS type)
```

---

## New Entities

### 1. **Day**
Represents a lesson module within a Course (e.g., "Day 1", "Day 2", "Day 3").

**Fields:**
- `id`: Unique identifier (CUID)
- `courseId`: Foreign key to Course
- `title`: Day title (e.g., "Day 1")
- `description`: Optional day description
- `order`: Order of day within course (1, 2, 3...)
- `createdAt` / `updatedAt`: Timestamps

**Relations:**
- Belongs to one `Course`
- Has many `Resource` records
- Has many `DayQuiz` records (many-to-many with Quizzes)

**Indexes:**
- Indexed on `courseId` for fast course-based queries
- Composite index on `[courseId, order]` for ordered day retrieval

---

### 2. **Resource**
Polymorphic entity representing any content item within a Day.

**Resource Types:**
- `VIDEO`: Video URL (YouTube/Vimeo/external)
- `NOTES`: Multiple paragraphs with headings
- `FLASH_CARDS`: Flip cards (question/answer pairs)
- `SHORT_QUESTIONS`: Simple Q&A pairs
- `ASSIGNMENT`: Assignment question

**Fields:**
- `id`: Unique identifier (CUID)
- `dayId`: Foreign key to Day
- `type`: ResourceType enum (discriminator)
- `title`: Optional title for the resource
- `order`: Order within the day (for drag-and-drop reordering)
- `isVisible`: Toggle visibility for end users (default: true)
- `createdAt` / `updatedAt`: Timestamps

**Type-Specific Fields:**
- `videoUrl`: For VIDEO type (YouTube/Vimeo/external URL)
- `question` / `answer`: For SHORT_QUESTIONS type
- `assignmentQuestion`: For ASSIGNMENT type

**Relations:**
- Belongs to one `Day`
- Has many `NoteParagraph` records (for NOTES type)
- Has many `FlashCard` records (for FLASH_CARDS type)

**Indexes:**
- Indexed on `dayId` for fast day-based queries
- Composite index on `[dayId, order]` for ordered resource retrieval
- Composite index on `[dayId, type]` for type-based filtering

---

### 3. **NoteParagraph**
Represents a single paragraph within a NOTES resource.

**Fields:**
- `id`: Unique identifier (CUID)
- `resourceId`: Foreign key to Resource (NOTES type)
- `heading`: Optional heading for this paragraph
- `content`: Paragraph content
- `order`: Order within the notes resource
- `createdAt` / `updatedAt`: Timestamps

**Relations:**
- Belongs to one `Resource` (NOTES type only)

**Indexes:**
- Indexed on `resourceId` for fast resource-based queries
- Composite index on `[resourceId, order]` for ordered paragraph retrieval

---

### 4. **FlashCard**
Represents a single flip card within a FLASH_CARDS resource.

**Fields:**
- `id`: Unique identifier (CUID)
- `resourceId`: Foreign key to Resource (FLASH_CARDS type)
- `question`: Front of card
- `answer`: Back of card
- `order`: Order within the flash cards resource
- `createdAt` / `updatedAt`: Timestamps

**Relations:**
- Belongs to one `Resource` (FLASH_CARDS type only)

**Indexes:**
- Indexed on `resourceId` for fast resource-based queries
- Composite index on `[resourceId, order]` for ordered card retrieval

---

### 5. **DayQuiz**
Junction table for many-to-many relationship between Day and Quiz.

**Purpose:**
- Allows attaching multiple quizzes to a single Day
- Allows reusing the same quiz across multiple Days
- Maintains quiz ordering and visibility per Day

**Fields:**
- `id`: Unique identifier (CUID)
- `dayId`: Foreign key to Day
- `quizId`: Foreign key to Quiz
- `order`: Order of quiz within the day
- `isVisible`: Toggle visibility for end users (default: true)
- `createdAt` / `updatedAt`: Timestamps

**Relations:**
- Belongs to one `Day`
- Belongs to one `Quiz`

**Constraints:**
- Unique constraint on `[dayId, quizId]` to prevent duplicate quiz attachments

**Indexes:**
- Indexed on `dayId` for fast day-based queries
- Composite index on `[dayId, order]` for ordered quiz retrieval
- Indexed on `quizId` for fast quiz-based queries

---

## Updated Existing Entities

### **Course**
- **Added Relation:** `days Day[]` - Has many Days

### **Quiz**
- **Added Relation:** `dayQuizzes DayQuiz[]` - Many-to-many with Days (via DayQuiz junction)

---

## Design Decisions

### 1. **Polymorphic Resource Pattern**
Resources use a type discriminator (`ResourceType` enum) with type-specific fields. This approach:
- Keeps the schema simple and queryable
- Avoids multiple tables for each resource type
- Maintains referential integrity
- Allows easy extension for future resource types

### 2. **Separate Tables for Complex Resources**
- `NoteParagraph` and `FlashCard` are separate tables because they contain multiple items per resource
- This allows proper ordering and management of individual items
- Keeps the Resource table clean and focused

### 3. **DayQuiz Junction Table**
- Quizzes are handled separately via `DayQuiz` junction table (not as a Resource type)
- This allows:
  - Reusing existing quizzes across multiple Days
  - Maintaining quiz logic unchanged
  - Independent ordering and visibility per Day
  - Multiple quizzes per Day

### 4. **Ordering Strategy**
- Both `Day` and `Resource` have `order` fields for drag-and-drop reordering
- Composite indexes on `[parentId, order]` ensure efficient ordered queries
- Order values are integers (1, 2, 3...) that can be updated during reordering

### 5. **Visibility Toggle**
- Both `Resource` and `DayQuiz` have `isVisible` boolean fields
- Allows admins to hide/show resources without deletion
- Default is `true` (visible) for better UX

### 6. **Cascade Deletion**
- All relations use `onDelete: Cascade` to maintain data integrity
- Deleting a Course deletes all Days
- Deleting a Day deletes all Resources and DayQuizzes
- Deleting a Resource deletes all NoteParagraphs and FlashCards

---

## Migration Notes

When running `prisma migrate dev`:
1. New tables will be created: `days`, `resources`, `note_paragraphs`, `flash_cards`, `day_quizzes`
2. New enum will be created: `ResourceType`
3. Existing `courses` and `quizzes` tables will be updated with new relations
4. No data loss - all existing Course and Quiz data remains intact

---

## Query Examples

### Get all Days for a Course (ordered)
```prisma
const days = await prisma.day.findMany({
  where: { courseId: "course-id" },
  orderBy: { order: "asc" },
  include: {
    resources: {
      where: { isVisible: true },
      orderBy: { order: "asc" }
    },
    dayQuizzes: {
      where: { isVisible: true },
      orderBy: { order: "asc" },
      include: { quiz: true }
    }
  }
});
```

### Get a Day with all visible resources
```prisma
const day = await prisma.day.findUnique({
  where: { id: "day-id" },
  include: {
    resources: {
      where: { isVisible: true },
      orderBy: { order: "asc" },
      include: {
        noteParagraphs: { orderBy: { order: "asc" } },
        flashCards: { orderBy: { order: "asc" } }
      }
    },
    dayQuizzes: {
      where: { isVisible: true },
      orderBy: { order: "asc" },
      include: { quiz: true }
    }
  }
});
```

---

## Next Steps

After schema extension:
1. Run `prisma migrate dev` to create migration
2. Generate Prisma client: `prisma generate`
3. Update backend APIs (Step 2)
4. Update admin frontend (Step 3)
