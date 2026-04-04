import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ms';

const translations = {
  en: {
    welcome: 'Welcome back',
    dashboard: 'Dashboard',
    chat: 'Chat with FokusZone',
    quiz: 'Take a Quiz',
    history: 'Quiz History',
    logout: 'Log Out',
    login: 'Log In',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    name: 'Your Name',
    formLevel: 'Form Level',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    chatPlaceholder: 'Ask me anything about your studies...',
    send: 'Send',
    subject: 'Subject',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    questionType: 'Question Type',
    mcq: 'Multiple Choice',
    trueFalse: 'True/False',
    shortAnswer: 'Short Answer',
    fillBlank: 'Fill in the Blank',
    numQuestions: 'Number of Questions',
    generateQuiz: 'Generate Quiz',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    score: 'Score',
    correct: 'Correct',
    incorrect: 'Incorrect',
    explanation: 'Explanation',
    retake: 'Retake Quiz',
    backToDashboard: 'Back to Dashboard',
    recentChats: 'Recent Chats',
    recentQuizzes: 'Recent Quizzes',
    noChats: 'No chats yet. Start a conversation!',
    noQuizzes: 'No quizzes yet. Take your first quiz!',
    generating: 'Generating...',
    thinking: 'EduBot is thinking...',
    congratulations: 'Congratulations! 🎉',
    keepTrying: 'Keep trying! 💪',
    newChat: 'New Chat',
    profile: 'Profile',
    startQuiz: 'Start Quiz',
    configureQuiz: 'Configure Your Quiz',
    quizPrompt: 'Describe the quiz topic (e.g., "Form 3 Science — Forces")',
    or: 'or',
    selectSubject: 'Select a subject',
    selectForm: 'Select form level',
    viewResults: 'View Results',
    question: 'Question',
    of: 'of',
    yourAnswer: 'Your Answer',
    correctAnswer: 'Correct Answer',
    mathSubject: 'Mathematics',
    scienceSubject: 'Science',
    bmSubject: 'Bahasa Melayu',
    englishSubject: 'English',
    sejarahSubject: 'Sejarah',
    geoSubject: 'Geography',
    addMathSubject: 'Additional Mathematics',
    physicsSubject: 'Physics',
    chemistrySubject: 'Chemistry',
    biologySubject: 'Biology',
    welcomeMessage: "Hi! I'm EduBot 🤖 Your AI study companion for Malaysian curriculum. Ask me anything!",
    heroTitle: 'Your AI Study Buddy 🎓',
    heroSubtitle: 'Learn smarter with EduBot — your personal tutor for Malaysian Forms 1–5',
  },
  ms: {
    welcome: 'Selamat kembali',
    dashboard: 'Papan Pemuka',
    chat: 'Berbual dengan EduBot',
    quiz: 'Ambil Kuiz',
    history: 'Sejarah Kuiz',
    logout: 'Log Keluar',
    login: 'Log Masuk',
    signup: 'Daftar',
    email: 'E-mel',
    password: 'Kata Laluan',
    name: 'Nama Anda',
    formLevel: 'Tingkatan',
    createAccount: 'Cipta Akaun',
    alreadyHaveAccount: 'Sudah ada akaun?',
    dontHaveAccount: 'Belum ada akaun?',
    chatPlaceholder: 'Tanya saya apa sahaja tentang pelajaran anda...',
    send: 'Hantar',
    subject: 'Subjek',
    difficulty: 'Kesukaran',
    easy: 'Mudah',
    medium: 'Sederhana',
    hard: 'Sukar',
    questionType: 'Jenis Soalan',
    mcq: 'Pilihan Berganda',
    trueFalse: 'Betul/Salah',
    shortAnswer: 'Jawapan Pendek',
    fillBlank: 'Isi Tempat Kosong',
    numQuestions: 'Bilangan Soalan',
    generateQuiz: 'Jana Kuiz',
    next: 'Seterusnya',
    previous: 'Sebelumnya',
    submit: 'Hantar',
    score: 'Markah',
    correct: 'Betul',
    incorrect: 'Salah',
    explanation: 'Penerangan',
    retake: 'Ulang Kuiz',
    backToDashboard: 'Kembali ke Papan Pemuka',
    recentChats: 'Perbualan Terkini',
    recentQuizzes: 'Kuiz Terkini',
    noChats: 'Tiada perbualan lagi. Mulakan perbualan!',
    noQuizzes: 'Tiada kuiz lagi. Ambil kuiz pertama anda!',
    generating: 'Menjana...',
    thinking: 'EduBot sedang berfikir...',
    congratulations: 'Tahniah! 🎉',
    keepTrying: 'Teruskan usaha! 💪',
    newChat: 'Perbualan Baru',
    profile: 'Profil',
    startQuiz: 'Mulakan Kuiz',
    configureQuiz: 'Tetapkan Kuiz Anda',
    quizPrompt: 'Huraikan topik kuiz (cth: "Tingkatan 3 Sains — Daya")',
    or: 'atau',
    selectSubject: 'Pilih subjek',
    selectForm: 'Pilih tingkatan',
    viewResults: 'Lihat Keputusan',
    question: 'Soalan',
    of: 'daripada',
    yourAnswer: 'Jawapan Anda',
    correctAnswer: 'Jawapan Betul',
    mathSubject: 'Matematik',
    scienceSubject: 'Sains',
    bmSubject: 'Bahasa Melayu',
    englishSubject: 'Bahasa Inggeris',
    sejarahSubject: 'Sejarah',
    geoSubject: 'Geografi',
    addMathSubject: 'Matematik Tambahan',
    physicsSubject: 'Fizik',
    chemistrySubject: 'Kimia',
    biologySubject: 'Biologi',
    welcomeMessage: "Hai! Saya EduBot 🤖 Teman belajar AI anda untuk kurikulum Malaysia. Tanya saya apa sahaja!",
    heroTitle: 'Teman Belajar AI Anda 🎓',
    heroSubtitle: 'Belajar dengan lebih bijak bersama EduBot — tutor peribadi anda untuk Tingkatan 1–5',
  },
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
