# Meditation-Optimized Color System

## Philosophy

This color system is designed for deep focus, calm awareness, and spiritual learning. Colors are chosen to reduce eye strain, minimize mental agitation, and support extended periods of focused attention during meditation quizzes.

---

## Color Palette

### Background Colors

#### **Deep Serenity** (Primary Background)
- **HEX**: `#0F1419`
- **HSL**: `210 25% 8%`
- **Purpose**: Main app background
- **Psychology**: Deep, grounding, reduces screen glare. Creates a sense of depth and calm focus.
- **Usage**: Root background, full-screen quiz mode

#### **Quiet Shadow** (Secondary Background)
- **HEX**: `#1A1F2E`
- **HSL**: `220 25% 14%`
- **Purpose**: Card backgrounds, elevated surfaces
- **Psychology**: Slightly lighter than primary, creates subtle hierarchy without harsh contrast.
- **Usage**: Cards, modals, sidebars

#### **Gentle Surface** (Tertiary Background)
- **HEX**: `#232938`
- **HSL**: `220 20% 18%`
- **Purpose**: Nested surfaces, input backgrounds
- **Psychology**: Provides depth without distraction.
- **Usage**: Input fields, dropdowns, nested cards

---

### Text Colors

#### **Soft Light** (Primary Text)
- **HEX**: `#E8EDF3`
- **HSL**: `210 20% 92%`
- **Purpose**: Main body text, headings
- **Psychology**: Soft white reduces eye strain. Warm undertone prevents harshness.
- **Usage**: All primary text content

#### **Muted Whisper** (Secondary Text)
- **HEX**: `#9CA3AF`
- **HSL**: `215 10% 65%`
- **Purpose**: Secondary text, descriptions, hints
- **Psychology**: Low contrast maintains focus on primary content.
- **Usage**: Descriptions, labels, helper text

#### **Subtle Hint** (Tertiary Text)
- **HEX**: `#6B7280`
- **HSL**: `215 8% 50%`
- **Purpose**: Disabled states, placeholders
- **Psychology**: Barely visible, doesn't compete for attention.
- **Usage**: Placeholders, disabled text

---

### Primary Accent (Spiritual Green)

#### **Inner Peace** (Primary)
- **HEX**: `#4ADE80`
- **HSL**: `142 76% 36%`
- **Purpose**: Primary actions, success states, correct answers
- **Psychology**: Green represents growth, harmony, and balance. Calming and positive without urgency.
- **Usage**: Primary buttons, correct answer indicators, success states

#### **Gentle Growth** (Primary Hover)
- **HEX**: `#5EEA94`
- **HSL**: `142 70% 45%`
- **Purpose**: Hover state for primary actions
- **Psychology**: Slightly brighter maintains engagement without agitation.
- **Usage**: Button hover states

#### **Deep Harmony** (Primary Dark)
- **HEX**: `#3BC96A`
- **HSL**: `142 80% 30%`
- **Purpose**: Active/pressed states
- **Psychology**: Deeper tone provides tactile feedback.
- **Usage**: Active buttons, selected states

---

### Secondary Accent (Calm Blue)

#### **Still Water** (Secondary)
- **HEX**: `#60A5FA`
- **HSL**: `213 95% 68%`
- **Purpose**: Secondary actions, navigation, links
- **Psychology**: Blue promotes calm, trust, and focus. Less urgent than green.
- **Usage**: Secondary buttons, navigation links, info states

#### **Light Breeze** (Secondary Hover)
- **HEX**: `#7AB8FF`
- **HSL**: `213 100% 75%`
- **Purpose**: Hover state for secondary actions
- **Usage**: Secondary button hover

---

### State Colors

#### **Warm Amber** (Warning - Timer Low)
- **HEX**: `#FBBF24`
- **HSL**: `43 96% 56%`
- **Purpose**: Low time warning (not urgent red)
- **Psychology**: Amber is alerting but not alarming. Maintains calm awareness.
- **Usage**: Timer when < 5 minutes remaining

#### **Soft Rose** (Error - Gentle)
- **HEX**: `#F87171`
- **HSL**: `0 90% 71%`
- **Purpose**: Wrong answers, errors
- **Psychology**: Soft red indicates mistake without harshness or shame.
- **Usage**: Incorrect answer indicators, gentle error messages

#### **Muted Border** (Separators)
- **HEX**: `#2D3748`
- **HSL**: `220 15% 22%`
- **Purpose**: Borders, dividers
- **Psychology**: Subtle separation without visual noise.
- **Usage**: Card borders, input borders, dividers

---

### Question States

#### **Answered** (Question Navigation)
- **HEX**: `#4ADE80` (Inner Peace)
- **Purpose**: Indicates answered question
- **Usage**: Question number badge when answered

#### **Current** (Active Question)
- **HEX**: `#60A5FA` (Still Water)
- **Purpose**: Currently viewing question
- **Usage**: Active question highlight

#### **Unanswered** (Default)
- **HEX**: `#6B7280` (Subtle Hint)
- **Purpose**: Not yet answered
- **Usage**: Unanswered question indicator

---

### Option States

#### **Default Option**
- Background: Transparent
- Border: `#2D3748` (Muted Border)
- Text: `#E8EDF3` (Soft Light)
- Hover: Background `#232938` (Gentle Surface)

#### **Selected Option**
- Background: `#232938` (Gentle Surface)
- Border: `#60A5FA` (Still Water)
- Text: `#E8EDF3` (Soft Light)

#### **Correct Answer** (Results)
- Background: `#1A3A2E` (Dark green tint)
- Border: `#4ADE80` (Inner Peace)
- Text: `#4ADE80` (Inner Peace)
- Icon: Checkmark in green

#### **Wrong Answer** (Results)
- Background: `#3A2A2A` (Dark red tint)
- Border: `#F87171` (Soft Rose)
- Text: `#F87171` (Soft Rose)
- Icon: X in soft rose

---

## Tailwind Configuration

```typescript
colors: {
  // Backgrounds
  background: {
    DEFAULT: 'hsl(210, 25%, 8%)',      // Deep Serenity
    secondary: 'hsl(220, 25%, 14%)',    // Quiet Shadow
    tertiary: 'hsl(220, 20%, 18%)',     // Gentle Surface
  },
  // Text
  foreground: {
    DEFAULT: 'hsl(210, 20%, 92%)',      // Soft Light
    muted: 'hsl(215, 10%, 65%)',        // Muted Whisper
    subtle: 'hsl(215, 8%, 50%)',        // Subtle Hint
  },
  // Primary (Green - Spiritual)
  primary: {
    DEFAULT: 'hsl(142, 76%, 36%)',      // Inner Peace
    hover: 'hsl(142, 70%, 45%)',        // Gentle Growth
    dark: 'hsl(142, 80%, 30%)',         // Deep Harmony
  },
  // Secondary (Blue - Calm)
  secondary: {
    DEFAULT: 'hsl(213, 95%, 68%)',      // Still Water
    hover: 'hsl(213, 100%, 75%)',       // Light Breeze
  },
  // States
  warning: {
    DEFAULT: 'hsl(43, 96%, 56%)',       // Warm Amber
  },
  destructive: {
    DEFAULT: 'hsl(0, 90%, 71%)',        // Soft Rose
  },
  border: {
    DEFAULT: 'hsl(220, 15%, 22%)',     // Muted Border
  },
}
```

---

## UI Usage Mapping

### Admin Panel
- **Background**: Deep Serenity
- **Cards**: Quiet Shadow
- **Primary Actions**: Inner Peace (green)
- **Secondary Actions**: Still Water (blue)
- **Text**: Soft Light
- **Borders**: Muted Border

### Quiz Interface
- **Background**: Deep Serenity (full-screen)
- **Question Cards**: Quiet Shadow
- **Selected Option**: Gentle Surface with Still Water border
- **Navigation Numbers**:
  - Answered: Inner Peace
  - Current: Still Water
  - Unanswered: Subtle Hint
- **Timer**:
  - Normal: Soft Light
  - Low (< 5 min): Warm Amber

### Results Screen
- **Background**: Deep Serenity
- **Score Display**: Inner Peace (green)
- **Correct Answers**: Dark green background, Inner Peace border
- **Wrong Answers**: Dark red background, Soft Rose border
- **Review Section**: Quiet Shadow cards

---

## DOs and DON'Ts

### ✅ DO:
- Use Deep Serenity as primary background
- Use Inner Peace (green) for positive states
- Use Still Water (blue) for navigation and secondary actions
- Maintain low contrast ratios (WCAG AA minimum)
- Use Warm Amber for warnings (not red)
- Use Soft Rose for errors (not harsh red)
- Apply Gentle Surface for interactive elements
- Use Muted Border for all separators

### ❌ DON'T:
- Use pure white (#FFFFFF) - too harsh
- Use pure black (#000000) - too stark
- Use neon colors - too distracting
- Use aggressive reds - creates stress
- Use high contrast - causes eye strain
- Use bright yellows - too energetic
- Use multiple competing accents
- Use saturated purples - too stimulating

---

## Accessibility

- All text meets WCAG AA contrast ratios
- Color is never the only indicator (icons + color)
- Focus states are clearly visible
- Interactive elements have sufficient size (44x44px minimum)

---

## Implementation Notes

1. **Dark Mode Only**: This system is designed exclusively for dark mode
2. **Gradient Avoidance**: Avoid gradients - use solid colors for calm
3. **Animation**: Keep animations slow (300ms+) and subtle
4. **Shadows**: Use very subtle shadows or none at all
5. **Borders**: Always use Muted Border for consistency

---

## Color Psychology Summary

- **Deep Serenity (Dark Blue-Gray)**: Grounding, reduces glare, promotes focus
- **Inner Peace (Green)**: Growth, harmony, positive without urgency
- **Still Water (Blue)**: Calm, trust, focus, less urgent than green
- **Warm Amber**: Alerting without alarm, maintains awareness
- **Soft Rose**: Indicates mistake without harshness or shame
- **Soft Light (Text)**: Reduces eye strain, warm undertone prevents harshness

This color system creates a meditation-friendly environment that supports extended focus and calm learning.
