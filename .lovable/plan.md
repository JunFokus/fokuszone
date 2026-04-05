

# FokusZone Premium Overhaul — Phased Plan

This request covers ~15 major areas. To avoid quality issues and broken builds, the work is split into 3 phases. Phase 1 ships a solid foundation; Phases 2 and 3 add advanced features.

---

## Phase 1: Core UX, Auth, Theme Persistence, Mobile Fix (this implementation)

### 1A. Theme Persistence Fix
- `ThemeToggle.tsx`: Fix race condition — read `localStorage` before first render via initializer, not a second `useEffect`. Apply `dark` class in `index.html` via inline script to prevent flash.
- `LanguageContext.tsx`: Persist language to `localStorage`, restore on load.

### 1B. Design System Cleanup
- Update `src/index.css` with responsive `clamp()` font sizes for headings/body.
- Tighten spacing scale: consistent `p-4 md:p-6 lg:p-8` across all pages.
- Ensure all cards, buttons, inputs share consistent `rounded-xl`, shadow, and border styles.
- Add proper `autocomplete` attributes to all auth form inputs (`email`, `current-password`, `new-password`).

### 1C. NavBar — Logo Clickable + Mobile Overhaul
- Make logo + brand name a `<Link to="/">` (already done but verify it navigates to dashboard for logged-in users).
- Mobile bottom nav: increase tap targets to `h-16`, icon size to `h-6 w-6`, label to `text-xs`.
- Fix overflow/alignment issues on small screens.

### 1D. Google Sign-In
- Use Lovable Cloud managed Google OAuth via `lovable.auth.signInWithOAuth("google")`.
- Add Google button to `Auth.tsx` login/signup forms.
- Handle OAuth callback and session.

### 1E. Password Change + Account Settings
- Add password change form in Settings Security tab using `supabase.auth.updateUser({ password })`.
- Add email update field.
- Add logout-all-devices button (sign out + clear sessions).

### 1F. Mobile-First Responsive Pass
- All pages: use `px-4 sm:px-6 lg:px-8`, `max-w-4xl` containers.
- Stats grid: `grid-cols-2` on mobile, `grid-cols-4` on desktop.
- Chat sidebar: hidden on mobile, toggle via hamburger. Input bar properly sticky on mobile.
- Quiz: larger touch targets for answer options.
- Bottom nav: proper `safe-area-inset-bottom` padding.

### 1G. Chat Bug Fix (Mobile)
- Fix conversation loading — currently new chats don't appear because `loadConversations` groups by first message seen (descending order bug). Fix title extraction logic.
- Mobile: add a slide-out drawer for chat history.
- Ensure "New Chat" button visible on mobile.

---

## Phase 2: Timer Persistence, Dashboard Workspace, Quiz Gamification

### 2A. Timer Persistence
- Save timer state (`remaining`, `running`, `startedAt`, `mode`) to `localStorage` on every tick.
- On mount, restore and calculate elapsed time.
- Add Pomodoro cycles: work (25min) → break (5min) → repeat. Long break after 4 cycles.
- Add session history log to `localStorage`.
- Add streak tracking (consecutive completed sessions per day).

### 2B. Dashboard as Memory Workspace
- Show "Continue where you left off" section: last opened tool, active timer, recent chat, unfinished quiz.
- Recent activity feed from chat_messages + quiz_results.
- Progress analytics: quiz score trend (simple inline SVG sparkline).
- Streak counter based on days with quiz/chat activity.

### 2C. Quiz Gamification
- 30-second countdown per question with animated circular progress.
- Combo streak counter (consecutive correct answers).
- XP points: base + speed bonus + streak bonus.
- Animated correct/incorrect feedback.
- Confetti already exists for high scores — enhance with sound.
- Add ASAS and Sains Komputer to subject list.
- Add "Retry Wrong Answers" mode in results.

### Database Migration (Phase 2)
```sql
-- Add focus_sessions table for timer history
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  session_type TEXT DEFAULT 'work',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.focus_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Phase 3: AI Ecosystem Expansion, Premium Polish

### 3A. AI Flashcard Generator
- New edge function `generate-flashcards` that creates Q/A pairs from notes.
- New page `/flashcards` with deck management, review mode, spaced repetition tracking.
- Database: `flashcard_decks` and `flashcards` tables.

### 3B. AI Study Summary
- New edge function `summarize-notes` that condenses long text into bullet points.
- Accessible from chat (suggested prompt) or standalone tool.

### 3C. AI Weakness Detector
- Analyze quiz_results data to identify low-scoring subjects/topics.
- Show recommendations on dashboard.

### 3D. Premium Polish
- Beautiful empty states with illustrations.
- Smooth page transitions using CSS animations.
- Achievement badges (static decorative for now).
- Study heatmap on dashboard (days with activity).
- Weekly progress summary card.

---

## Technical Details

- **Font**: Inter is already configured. Will add `clamp()` for responsive sizing.
- **Google Auth**: Uses `@lovable.dev/cloud-auth-js` package via Configure Social Auth tool.
- **Password change**: `supabase.auth.updateUser({ password: newPassword })` — works for logged-in users.
- **Timer persistence**: Pure `localStorage` — no database needed for active state. Session logs go to database in Phase 2.
- **Chat fix**: The bug is in `loadConversations()` — messages fetched descending but title logic assumes ascending. Will reverse the lookup.
- **No new dependencies** needed for Phase 1 beyond the Google OAuth package.

## Files Modified (Phase 1)
- `src/index.css` — responsive typography
- `index.html` — inline theme script
- `src/components/ThemeToggle.tsx` — fix persistence
- `src/contexts/LanguageContext.tsx` — persist language
- `src/components/NavBar.tsx` — mobile improvements
- `src/pages/Auth.tsx` — Google login, autocomplete attributes
- `src/pages/Settings.tsx` — password change, account management
- `src/pages/Chat.tsx` — mobile chat history fix
- `src/pages/Index.tsx` — responsive grid fix
- `src/pages/Quiz.tsx` — larger touch targets
- `src/pages/QuizHistory.tsx` — responsive polish
- `src/contexts/AuthContext.tsx` — password update method

