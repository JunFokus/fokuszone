

# FokusZone Premium UI Overhaul

A complete visual and structural redesign transforming FokusZone into a premium, dark-themed SaaS AI education platform inspired by Solvely.ai, ChatGPT, and Notion AI.

## Scope Summary

This is a full-scale redesign touching every page, the design system, navigation, layout architecture, and adding new pages/features. The work breaks down into 7 major areas.

---

## 1. Design System Overhaul

**Typography**: Replace Nunito with Inter (clean geometric sans-serif). Establish strong hierarchy: 48px+ hero headings, 24-32px section headings, 14-16px body.

**Color palette** (dark-first):
- Background: deep navy (`#0a0e1a` → `#0f1629`)
- Card surfaces: `rgba(15, 22, 41, 0.8)` with glassmorphism (`backdrop-blur`, subtle white border)
- Primary accent: cyan-blue glow (`#00b4d8` → `#0ea5e9`)
- Glow effects: `box-shadow: 0 0 30px rgba(0, 180, 216, 0.15)`
- Text: white primary, `#94a3b8` muted
- Success: emerald, Destructive: soft red

**Light mode**: Clean white/gray with same accent colors, no glassmorphism (clean flat cards instead).

**Global utilities**: Glassmorphism card class, glow border class, smooth hover scale/lift animations, fade-in on scroll.

Files: `src/index.css`, `tailwind.config.ts`, add Inter font import.

---

## 2. Public Landing Page (Homepage)

Create a new **unauthenticated homepage** at `/` that logged-out users see (currently they get redirected to `/auth`).

**Navbar**: Logo + "FokusZone" | Features | Tools | Resources | Pricing | Profile icon | "Start Now" CTA button. Glassmorphism sticky header.

**Hero section**: Two-column layout.
- Left: Large bold headline "FokusZone", subheading about AI-powered study tools, two CTA buttons ("Get Started Free", "Explore Features").
- Right: Glassmorphism preview card with tabs (Study Guide, Quiz, Flashcards, Mock Exams, AI Mentor) showing a mini dashboard mockup with progress bars, subject icons, streak counter.

**Below hero**: Feature highlights, social proof section, footer.

New files: `src/pages/Landing.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/FeaturePreview.tsx`, `src/components/landing/LandingNavBar.tsx`.

Update `src/App.tsx` routing: `/` shows Landing for unauthenticated, Dashboard for authenticated.

---

## 3. Student Dashboard Redesign

Redesign `src/pages/Index.tsx` as a premium logged-in dashboard.

**Layout**: Welcome header with name + streak badge. Grid of glassmorphism cards:
- Study streak + daily goals
- Pomodoro timer (simple start/stop/reset, no backend needed)
- Exam countdown (static date picker)
- AI study notes shortcut
- Flashcard progress summary
- Quiz analytics (recent scores chart)
- Quick-launch cards for Chat, Quiz, Focus Mode
- Subject-specific cards (BM essay, Sejarah timeline, Science revision)

Cards: Rounded `xl`, glass effect in dark mode, soft glow on hover, icon + title + mini-stat layout.

---

## 4. AI Chat Workspace — 2-Panel Layout

Major restructure of `src/pages/Chat.tsx` into a premium 2-panel layout.

**Left sidebar** (collapsible, 280px):
- "New Chat" button with glow accent
- Search input for filtering chats
- Chat list grouped by Today / Yesterday / Older
- Each item: auto-generated title, subject tag, timestamp
- Right-click or hover menu: rename, delete, pin, export
- Pinned chats section at top

**Auto-title generation**: After first user message, call AI to generate a short study-note title (e.g., "Biology: Cell Membranes"). Store as `title` field.

**Database migration**: Add `title` column to `chat_messages` or create a `conversations` table with `id`, `user_id`, `title`, `subject_tag`, `pinned`, `created_at`, `updated_at`.

**Main chat panel**:
- Top bar: auto-generated title, subject tag, auto-save indicator, share/export buttons
- Chat body: premium rounded bubbles, markdown rendering, typing indicator animation
- Bottom input: large rounded box, attachment button (PDF/image), send button
- Placeholder: "Ask FokusZone AI anything about your studies..."
- Sticky scroll-down FAB when scrolled up

**New chat UX**: Fade animation, suggested smart prompt chips (Summarize textbook, Generate flashcards, Create quiz, etc.).

New files: `src/components/chat/ChatSidebar.tsx`, `src/components/chat/ChatMessage.tsx`, `src/components/chat/ChatInput.tsx`, `src/components/chat/SuggestedPrompts.tsx`.

---

## 5. Profile & Settings Page

New page at `/settings` with sidebar tab navigation.

**Tabs**: Account, Appearance, Study Preferences, Notifications, Security, Progress Data.

**Account**: Profile photo (placeholder avatar), name, form level, email (read-only).
**Appearance**: Theme toggle (light/dark/system), language selector.
**Study Preferences**: Selected subjects checkboxes, study goals, AI mentor personality (Friendly/Strict/Motivational).
**Security**: Password reset link.
**Progress Data**: Quiz score history summary, total chats, achievement badges (static/decorative for now).

New files: `src/pages/Settings.tsx`, `src/components/settings/AccountTab.tsx`, `src/components/settings/AppearanceTab.tsx`, etc.

Database: May need to add columns to profiles (`avatar_url`, `selected_subjects`, `study_goals`, `ai_personality`).

---

## 6. Quiz & History Pages Polish

Restyle `Quiz.tsx` and `QuizHistory.tsx` with the new glassmorphism card system, better spacing, stronger typography, and glow accents. Remove emoji-heavy styling in favor of clean icons.

---

## 7. Navigation & Layout Update

**Authenticated layout**: Replace top navbar with a slim left sidebar or keep as top bar but redesigned with glassmorphism. Add Settings link and profile avatar.

**Mobile**: Responsive bottom tab bar for mobile, collapsible sidebar for desktop chat.

Update: `src/components/NavBar.tsx`, `src/App.tsx` layout structure.

---

## Database Changes

One migration to create a `conversations` table:
```sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT DEFAULT '',
  subject_tag TEXT DEFAULT '',
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- RLS: users manage their own conversations
-- Add foreign key from chat_messages.conversation_id to conversations.id
```

Edge function update: Add a title-generation call after first message.

---

## Technical Details

- **Font**: Inter via Google Fonts CDN import in `index.css`
- **Glassmorphism**: Tailwind utility classes (`backdrop-blur-xl`, `bg-white/5`, `border border-white/10`)
- **Animations**: CSS keyframes for fade-in, scale-in, glow-pulse; Tailwind `transition-all duration-300`
- **Charts**: Use a simple bar/line chart for quiz analytics (recharts or inline SVG)
- **Pomodoro timer**: Client-side only, useState + setInterval
- **No new dependencies needed** beyond potentially `recharts` for dashboard analytics

## Implementation Order

1. Design system (CSS + Tailwind config)
2. Landing page + routing changes
3. NavBar redesign
4. Dashboard redesign
5. Chat workspace (2-panel + conversations table migration)
6. Settings page
7. Quiz/History polish
8. Mobile responsiveness pass

