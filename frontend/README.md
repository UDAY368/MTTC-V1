# Meditation Quiz Frontend

Frontend application for Meditation Teacher Training Quiz Admin Panel built with Next.js, Tailwind CSS, and ShadCN UI.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI (custom components)
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Authentication**: JWT (stored in cookies)

## Features

- 🎨 **Dark Mode**: Calm, premium, spiritual design
- 🔐 **JWT Authentication**: Secure admin login
- 📚 **Course Management**: Create, update, delete courses
- 📝 **Quiz Management**: Create quizzes with dynamic questions
- ❓ **Question Builder**: Add single/multiple choice questions with options
- 🔗 **Unique Quiz URLs**: Auto-generated public URLs for quizzes
- ✨ **Smooth Animations**: Calm, non-distracting transitions

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `NEXT_PUBLIC_API_URL` to point to your backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── login/             # Login page
│   │   ├── dashboard/         # Admin dashboard
│   │   │   ├── courses/       # Course management
│   │   │   └── quizzes/       # Quiz management
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   └── ui/                # ShadCN UI components
│   ├── lib/
│   │   ├── api.ts            # Axios configuration
│   │   ├── auth.ts           # Authentication utilities
│   │   └── utils.ts          # Utility functions
│   └── middleware.ts        # Route protection
└── public/                    # Static assets
```

## Pages

### Login (`/login`)
- Admin authentication
- JWT token storage in cookies

### Dashboard (`/dashboard`)
- Overview statistics
- Quick navigation

### Courses (`/dashboard/courses`)
- List all courses
- Create new course
- Edit/delete courses

### Quizzes (`/dashboard/quizzes`)
- List all quizzes
- Filter by course
- Copy quiz URL
- Create/edit/delete quizzes

### Create Quiz (`/dashboard/quizzes/new`)
- Select course
- Set quiz details (title, description, duration)
- Dynamically add questions
- Configure question types (single/multiple choice)
- Add options and mark correct answers

## Design Philosophy

- **Calm & Premium**: Soft colors, gentle animations
- **Spiritual**: Peaceful, focused interface
- **Dark Mode**: Default dark theme for reduced eye strain
- **Non-Distracting**: Subtle animations, no aggressive colors
- **Meditation-Friendly**: Clean, minimal design

## Authentication Flow

1. User logs in at `/login`
2. JWT token stored in cookie (`admin_token`)
3. Middleware protects all `/dashboard/*` routes
4. Token sent in `Authorization` header for API calls
5. Auto-redirect to login on 401 errors

## API Integration

All API calls go through `src/lib/api.ts` which:
- Sets base URL from `NEXT_PUBLIC_API_URL`
- Automatically adds JWT token to requests
- Handles 401 errors (redirects to login)

## Building for Production

```bash
npm run build
npm start
```

## Notes

- All routes except `/login` are protected by middleware
- JWT tokens expire after 7 days (configured in backend)
- Quiz URLs are auto-generated and can be copied from the quiz list
- Questions can be added dynamically when creating/editing quizzes
