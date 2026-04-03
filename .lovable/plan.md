

# EduBot Malaysia 🇲🇾 — AI Study Companion

An AI-powered learning platform for Malaysian Forms 1–5 students, featuring a bilingual chatbot and interactive quiz maker with a fun, colorful design.

## Pages & Navigation

### 1. Auth Pages (Login / Sign Up)
- Email & password authentication with Lovable Cloud
- Student profile creation (name, form/year level 1–5)
- Fun, welcoming design with educational illustrations

### 2. Dashboard (Home)
- Welcome message with student's name
- Quick access cards: "Chat with EduBot" and "Take a Quiz"
- Language toggle (English / Bahasa Malaysia) in the top nav
- Recent chat history and quiz scores summary

### 3. AI Chatbox Page
- Full chat interface with message bubbles (student & AI)
- AI responds based on Malaysian curriculum (Forms 1–5)
- Covers all core subjects: Math, Science, BM, English, Sejarah, Geography, etc.
- Bilingual responses based on selected language
- Chat history saved per student
- Streaming AI responses for a smooth experience

### 4. Quiz Maker Page
- **Step 1 — Configure Quiz**: Student enters a prompt (e.g., "Form 3 Science — Forces") or picks subject + form level from dropdowns
- **Step 2 — Select Options**: Question type (MCQ, True/False, Short Answer, Fill-in-the-Blank), number of questions (5/10/15), difficulty (Easy/Medium/Hard)
- **Step 3 — Take Quiz**: Interactive quiz UI with progress bar, one question at a time
- **Step 4 — Results**: Score, percentage, review each question with correct answers and explanations
- Quiz results saved to student's history

### 5. Quiz History Page
- List of past quizzes with scores, dates, and subjects
- Option to retake quizzes

## Design & UX
- **Fun & Colorful** palette: bright primary colors (blue, orange, green), rounded cards, playful icons and emoji
- Large, friendly typography suitable for younger students
- Mobile-responsive layout
- Animated transitions and celebratory effects for quiz completion (confetti on high scores!)
- Consistent bilingual toggle accessible from all pages

## Backend (Lovable Cloud)
- **Auth**: Email/password signup with profile (name, form level)
- **Database**: Tables for profiles, chat messages, quiz results
- **Edge Functions**: AI chat endpoint and quiz generation endpoint using Lovable AI
- **RLS**: Students can only access their own data

