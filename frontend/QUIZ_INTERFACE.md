# User Quiz Interface

## Overview

The user-facing quiz interface provides a calm, focused experience for taking meditation teacher training quizzes. It's designed for extended periods of deep focus with minimal distractions.

## Features

### Full-Screen Quiz Mode
- Immersive layout with no navigation distractions
- Left panel: Question navigation and timer
- Right panel: Current question and options
- Prevents navigation away during active quiz

### Question Navigation
- Visual grid showing all questions
- Color-coded states:
  - **Current**: Blue (Still Water) - Currently viewing
  - **Answered**: Green (Inner Peace) - Has been answered
  - **Unanswered**: Gray (Subtle Hint) - Not yet answered
- Click any number to jump to that question

### Timer
- Global countdown timer in minutes:seconds format
- **Normal state**: Soft Light text
- **Low time warning** (< 5 minutes): Warm Amber text
- Auto-submits when timer reaches zero

### Answer Selection
- **Single Choice**: Radio button behavior (one answer)
- **Multiple Choice**: Checkbox behavior (multiple answers)
- Answers are saved automatically when selected
- Visual feedback on selected options

### Results Screen
- Score display (X out of total)
- Percentage correct
- Review each question with:
  - Correct answer (green highlight)
  - User's answer (green if correct, red if wrong)
  - Question text
- Retake quiz option

## Color Usage

### Backgrounds
- **Main Background**: Deep Serenity (`#0F1419`)
- **Cards**: Quiet Shadow (`#1A1F2E`)
- **Selected Options**: Gentle Surface (`#232938`)

### States
- **Answered Questions**: Inner Peace green (`#4ADE80`)
- **Current Question**: Still Water blue (`#60A5FA`)
- **Unanswered**: Subtle Hint gray (`#6B7280`)
- **Correct Answer**: Green with dark green background
- **Wrong Answer**: Soft Rose (`#F87171`) with dark red background
- **Timer Warning**: Warm Amber (`#FBBF24`)

## User Flow

1. **Landing Page**: User accesses quiz via unique URL
   - Shows course name, quiz title, duration, question count
   - "Start Quiz" button

2. **Quiz Active**: Full-screen quiz interface
   - Left: Navigation and timer
   - Right: Current question
   - Bottom: Previous/Next/Submit buttons
   - Answers auto-save on selection

3. **Auto-Submit**: When timer reaches zero
   - All answers submitted automatically
   - Redirects to results screen

4. **Results**: Score and review
   - Shows score prominently
   - Lists all questions with correct/user answers
   - "Retake Quiz" button to start over

## Technical Details

### Route
- `/quiz/[uniqueUrl]` - Dynamic route for quiz access

### API Integration
- Uses public API endpoints (no authentication)
- `GET /api/public/quiz/:uniqueUrl` - Load quiz
- `POST /api/public/quiz/:uniqueUrl/start` - Start attempt
- `POST /api/public/attempts/:attemptId/answers` - Submit answer
- `POST /api/public/attempts/:attemptId/submit` - Submit quiz
- `GET /api/public/attempts/:attemptId` - Get results

### Navigation Prevention
- Uses `beforeunload` event to warn users
- Prevents accidental navigation during active quiz
- Disabled after submission

### Timer Implementation
- Calculates remaining time from start timestamp
- Updates every second
- Auto-submits at zero

## Accessibility

- Keyboard navigation supported
- Clear focus states
- Sufficient color contrast
- Screen reader friendly
- Large touch targets (44x44px minimum)

## Performance

- Smooth animations (300ms transitions)
- Optimized re-renders
- Efficient state management
- Auto-save doesn't block UI
