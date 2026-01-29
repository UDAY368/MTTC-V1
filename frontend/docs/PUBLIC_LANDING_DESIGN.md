# User-Facing Landing & Course Experience — Design & Structure

**Course:** Meditation Teacher Training Program  
**Design:** Premium, calm, spiritual, modern, minimal, dark-first.

---

## 1. Page Routing

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Redirects to `/home` | Public |
| `/home` | **Landing page** (user-facing default) | Public |
| `/login` | Admin login → `/dashboard` | Public entry |
| `/dashboard/*` | Admin panel (existing) | Protected |
| `/course/[courseId]` | **About Course** (from “About Course” on landing) | Public |
| `/course/[courseId]/learn` | **Course View** (consumption, from “View Course”) | Public |
| `/quiz/[uniqueUrl]` | Public quiz (existing) | Public |

**Default behaviour:** `http://localhost:3000/` and `http://localhost:3000/home` show the landing. `http://localhost:3000/login` is the admin entry.

---

## 2. Component Structure

All paths relative to `src/`.

### 2.1 Landing Page (`/home`)

```
app/home/page.tsx
  → imports from components/landing/
```

**Components:** `components/landing/`

| Component | Responsibility |
|-----------|-----------------|
| `Header.tsx` | Sticky header: Logo (left), “Dhayana Dharma Ashramam”, caption “Athma Vidye Asalina Vidya”. Minimal, calm. |
| `HeroSection.tsx` | Hero: Pathriji image, “Meditation Teacher Training Course”, “By Enlight Spiritual Science Academy”, Ramu_Master (side/overlay). Spiritual invitation, calm entrance (fade + slide). |
| `CourseCardSection.tsx` | Premium course card: name, short description, duration, instructor, “By Enlight Spiritual Science Academy”, “About Course” CTA. Glassmorphism, soft elevation, hover, rounded. |

**Assets (from `frontend/Asserts` — spec says `frontend/Assets`):**
- Logo: `LOGO.png`
- Pathriji: `Pathriji.jpeg`
- Ramu_Master: `Ramu_Master.jpeg`
- Course_1: `Course_1.jpeg` (used on About Course)

Use only these; no external placeholders.

---

### 2.2 About Course Page (`/course/[courseId]`)

```
app/course/[courseId]/page.tsx
  → imports from components/landing/ (Header) + components/course-about/
```

**Components:** `components/course-about/`

| Component | Responsibility |
|-----------|-----------------|
| `AboutCourseHeader.tsx` | Optional minimal header / back to home |
| `AboutCourseHero.tsx` | Course name, detailed description, duration, Course_1 image |
| `KeyHighlights.tsx` | Icon + text per highlight, clean and scannable |
| `InstructorSection.tsx` | Ramu_Master image, name, “About Instructor” (respectful, authoritative) |
| `SyllabusSection.tsx` | Accordion: module title + content, smooth expand/collapse, clear hierarchy |
| `AboutCourseCTA.tsx` | “View Course” → `/course/[courseId]/learn` |

---

### 2.3 Course View Page (`/course/[courseId]/learn`)

```
app/course/[courseId]/learn/page.tsx
  → imports CourseViewLayout from components/course-view/
```

**Components:** `components/course-view/`

| Component | Responsibility |
|-----------|-----------------|
| `CourseViewLayout.tsx` | Three-panel shell: left sidebar, center content, right rail. Toggles for sidebar/rail. |
| `DaySidebar.tsx` | Left: list of days (Day 1, Day 2, …), active state, optional collapse. |
| `ContentViewer.tsx` | Center: selected resource content. Respects admin resource order. Transitions between resources. |
| `ResourceRail.tsx` | Right: resource-type icons (Video, Notes, Flash Cards, Short Questions, Assignments, Quizzes) + tooltips. Optional collapse. |

**Default behaviour:** First day open, first resource open and shown in center.

**Data:**  
- Course + days: existing API (e.g. `/courses/:id` or equivalent).  
- Per-day resources + order: from day detail API.  
- No page reloads; state-driven, keyboard-friendly.

---

## 3. Shared / UX

- **Layouts:** Optional `app/home/layout.tsx` for user-facing (e.g. no dashboard chrome). Course routes can share a minimal layout or use root.
- **Animations:** Framer Motion, duration 0.3–0.5s, easeOut. No bounce/shake/aggressive motion.
- **UI base:** Tailwind + ShadCN where it fits; custom components for spiritual/premium tone.
- **Assets:** All images from `frontend/Asserts` (LOGO, Pathriji, Ramu_Master, Course_1). If you add `frontend/Assets`, align paths and doc.

---

## 4. Implementation Order (Strict)

1. **STEP 1 (this doc):** Routing + component structure — **DONE**
2. **STEP 2:** Landing Page UI (Header, Hero, CourseCard)
3. **STEP 3:** About Course UI (Hero, Highlights, Instructor, Syllabus, CTA)
4. **STEP 4:** Course View layout (three panels, DaySidebar, ResourceRail, ContentViewer)
5. **STEP 5:** Premium UX polish (animations, focus, keyboard, transitions)

After each step: **STOP**, short rationale, **wait for confirmation** before the next.

---

## 5. File Tree (Target)

```
src/
├── app/
│   ├── page.tsx                    → redirect /home
│   ├── home/
│   │   └── page.tsx                → Landing
│   ├── login/
│   │   └── page.tsx                → Admin login (unchanged)
│   ├── course/
│   │   └── [courseId]/
│   │       ├── page.tsx            → About Course
│   │       └── learn/
│   │           └── page.tsx        → Course View
│   └── dashboard/                  → (existing)
├── components/
│   ├── ui/                         → (existing ShadCN)
│   ├── landing/
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   └── CourseCardSection.tsx
│   ├── course-about/
│   │   ├── AboutCourseHero.tsx
│   │   ├── KeyHighlights.tsx
│   │   ├── InstructorSection.tsx
│   │   ├── SyllabusSection.tsx
│   │   └── AboutCourseCTA.tsx
│   └── course-view/
│       ├── CourseViewLayout.tsx
│       ├── DaySidebar.tsx
│       ├── ContentViewer.tsx
│       └── ResourceRail.tsx
└── lib/
    └── ... (existing api, auth, etc.)
```

Assets (project root): `Asserts/` — LOGO.png, Pathriji.jpeg, Ramu_Master.jpeg, Course_1.jpeg.
