import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Brain, Timer, Zap, Flame, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useSubjects } from '@/hooks/useSubjects';

interface QuizQuestion {
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: string[];
  correct_answer: string;
  explanation: string;
}

type Step = 'configure' | 'quiz' | 'results';


const QUESTION_TIMER = 30; // seconds per question
const XP_BASE = 10;
const XP_SPEED_BONUS_MAX = 5;
const XP_STREAK_MULTIPLIER = 2;

const Quiz = () => {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const { subjects } = useSubjects();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('configure');

  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [formLevel, setFormLevel] = useState(String(profile?.form_level || 1));
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('mcq');
  const [numQuestions, setNumQuestions] = useState('5');
  const [generating, setGenerating] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [shortAnswerInput, setShortAnswerInput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Gamification state
  const [questionTimer, setQuestionTimer] = useState(QUESTION_TIMER);
  const [comboStreak, setComboStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answerTimes, setAnswerTimes] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [retryMode, setRetryMode] = useState(false);
  const [wrongQuestions, setWrongQuestions] = useState<number[]>([]);

  // Question countdown timer
  useEffect(() => {
    if (step !== 'quiz' || !questions.length) return;
    if (showFeedback) return; // pause during feedback
    const interval = setInterval(() => {
      setQuestionTimer(prev => {
        if (prev <= 1) {
          // Time's up — auto-advance
          handleAutoAdvance();
          return QUESTION_TIMER;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, currentQ, questions.length, showFeedback]);

  // Reset timer on question change
  useEffect(() => {
    if (step === 'quiz') setQuestionTimer(QUESTION_TIMER);
  }, [currentQ, step]);

  const handleAutoAdvance = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setComboStreak(0);
      setCurrentQ(prev => prev + 1);
    } else {
      doSubmit();
    }
  }, [currentQ, questions.length]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { prompt: prompt || undefined, subject, formLevel: parseInt(formLevel), difficulty, questionType, numQuestions: parseInt(numQuestions), language },
      });
      if (error) throw error;
      setQuestions(data.questions);
      setStep('quiz');
      setCurrentQ(0);
      setAnswers({});
      setComboStreak(0);
      setMaxCombo(0);
      setXpEarned(0);
      setAnswerTimes({});
      setRetryMode(false);
      setWrongQuestions([]);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (answer: string) => {
    if (showFeedback) return;
    setAnswers(prev => ({ ...prev, [currentQ]: answer }));
    const timeSpent = QUESTION_TIMER - questionTimer;
    setAnswerTimes(prev => ({ ...prev, [currentQ]: timeSpent }));

    // Check answer immediately for feedback
    const isCorrect = answer.toLowerCase().trim() === questions[currentQ].correct_answer.toLowerCase().trim();
    
    if (isCorrect) {
      const newStreak = comboStreak + 1;
      setComboStreak(newStreak);
      if (newStreak > maxCombo) setMaxCombo(newStreak);
      const speedBonus = Math.max(0, Math.round((1 - timeSpent / QUESTION_TIMER) * XP_SPEED_BONUS_MAX));
      const streakBonus = newStreak >= 3 ? XP_STREAK_MULTIPLIER : 0;
      setXpEarned(prev => prev + XP_BASE + speedBonus + streakBonus);
      setShowFeedback('correct');
    } else {
      setComboStreak(0);
      setShowFeedback('incorrect');
    }

    // Auto-advance after short delay
    setTimeout(() => {
      setShowFeedback(null);
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
      } else {
        doSubmit();
      }
    }, 800);
  };

  const handleShortAnswer = () => {
    if (!shortAnswerInput.trim() || showFeedback) return;
    const answer = shortAnswerInput.trim();
    setAnswers(prev => ({ ...prev, [currentQ]: answer }));
    const timeSpent = QUESTION_TIMER - questionTimer;
    setAnswerTimes(prev => ({ ...prev, [currentQ]: timeSpent }));

    const isCorrect = answer.toLowerCase() === questions[currentQ].correct_answer.toLowerCase().trim();
    if (isCorrect) {
      const newStreak = comboStreak + 1;
      setComboStreak(newStreak);
      if (newStreak > maxCombo) setMaxCombo(newStreak);
      const speedBonus = Math.max(0, Math.round((1 - timeSpent / QUESTION_TIMER) * XP_SPEED_BONUS_MAX));
      setXpEarned(prev => prev + XP_BASE + speedBonus + (newStreak >= 3 ? XP_STREAK_MULTIPLIER : 0));
      setShowFeedback('correct');
    } else {
      setComboStreak(0);
      setShowFeedback('incorrect');
    }

    setShortAnswerInput('');
    setTimeout(() => {
      setShowFeedback(null);
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
      } else {
        doSubmit();
      }
    }, 800);
  };

  const doSubmit = async () => {
    const correctCount = questions.reduce((count, q, i) => {
      return count + ((answers[i] || '').toLowerCase().trim() === q.correct_answer.toLowerCase().trim() ? 1 : 0);
    }, 0);
    const percentage = Math.round((correctCount / questions.length) * 100);
    if (percentage >= 80) setShowConfetti(true);

    // Find wrong questions for retry
    const wrong = questions.reduce<number[]>((acc, q, i) => {
      if ((answers[i] || '').toLowerCase().trim() !== q.correct_answer.toLowerCase().trim()) acc.push(i);
      return acc;
    }, []);
    setWrongQuestions(wrong);

    // Submit to server-side grading edge function (scores computed server-side)
    if (user) {
      try {
        await supabase.functions.invoke('submit-quiz', {
          body: {
            questions,
            answers,
            subject: subject || prompt || 'General',
            formLevel: parseInt(formLevel),
            difficulty,
            questionType,
          },
        });
      } catch (err) {
        console.error('Failed to submit quiz:', err);
      }
    }

    setStep('results');
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleRetryWrong = () => {
    if (wrongQuestions.length === 0) return;
    setRetryMode(true);
    setCurrentQ(wrongQuestions[0]);
    // Clear only wrong answers
    const newAnswers = { ...answers };
    wrongQuestions.forEach(i => delete newAnswers[i]);
    setAnswers(newAnswers);
    setStep('quiz');
    setComboStreak(0);
  };

  const correctCount = questions.reduce((count, q, i) => {
    return count + ((answers[i] || '').toLowerCase().trim() === q.correct_answer.toLowerCase().trim() ? 1 : 0);
  }, 0);
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const timerPercentage = (questionTimer / QUESTION_TIMER) * 100;
  const timerColor = questionTimer <= 5 ? 'text-destructive' : questionTimer <= 10 ? 'text-orange-500' : 'text-primary';

  if (step === 'configure') {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-bold tracking-tight">{t('configureQuiz')}</h1>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-6 space-y-5 glow-border">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('quizPrompt')}</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={language === 'en' ? 'e.g., Form 3 Science — Forces and Motion' : 'cth: Tingkatan 3 Sains — Daya dan Gerakan'}
              className="rounded-xl bg-muted/50 min-h-[80px]"
            />
          </div>

          <div className="text-center text-muted-foreground text-sm font-medium">— {t('or')} —</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('subject')}</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue placeholder={t('selectSubject')} /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('formLevel')}</Label>
              <Select value={formLevel} onValueChange={setFormLevel}>
                <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(l => <SelectItem key={l} value={String(l)}>{language === 'en' ? `Form ${l}` : `Tingkatan ${l}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('difficulty')}</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t('easy')}</SelectItem>
                  <SelectItem value="medium">{t('medium')}</SelectItem>
                  <SelectItem value="hard">{t('hard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('questionType')}</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">{t('mcq')}</SelectItem>
                  <SelectItem value="true_false">{t('trueFalse')}</SelectItem>
                  <SelectItem value="short_answer">{t('shortAnswer')}</SelectItem>
                  <SelectItem value="fill_blank">{t('fillBlank')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('numQuestions')}</Label>
            <Select value={numQuestions} onValueChange={setNumQuestions}>
              <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || (!prompt && !subject)}
            className="w-full h-12 rounded-full font-semibold"
          >
            {generating ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('generating')}</>
            ) : (
              <>{t('generateQuiz')}</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const questionsToShow = retryMode ? wrongQuestions : questions.map((_, i) => i);
    const positionInSet = retryMode ? wrongQuestions.indexOf(currentQ) + 1 : currentQ + 1;
    const totalInSet = questionsToShow.length;

    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl pb-24 md:pb-8">
        {/* Top bar: progress + timer + combo */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {retryMode ? `${language === 'en' ? 'Retry' : 'Cuba semula'} ` : ''}
              {t('question')} {positionInSet} {t('of')} {totalInSet}
            </span>
            <div className="flex items-center gap-3">
              {/* Combo */}
              {comboStreak >= 2 && (
                <div className="flex items-center gap-1 text-orange-500 animate-fade-in">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-bold">{comboStreak}x</span>
                </div>
              )}
              {/* XP */}
              <div className="flex items-center gap-1 text-primary">
                <Star className="h-4 w-4" />
                <span className="text-sm font-bold">{xpEarned} XP</span>
              </div>
            </div>
          </div>
          <Progress value={((positionInSet) / totalInSet) * 100} className="h-2 rounded-full" />
        </div>

        {/* Question Timer */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Timer className={`h-5 w-5 ${timerColor}`} />
          <div className="relative w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
                questionTimer <= 5 ? 'bg-destructive' : questionTimer <= 10 ? 'bg-orange-500' : 'bg-primary'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
          <span className={`text-sm font-bold font-mono ${timerColor}`}>{questionTimer}s</span>
        </div>

        {/* Feedback overlay */}
        {showFeedback && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${
            showFeedback === 'correct' ? 'animate-fade-in' : 'animate-fade-in'
          }`}>
            <div className={`rounded-full p-6 ${
              showFeedback === 'correct' ? 'bg-[hsl(var(--success))]/20' : 'bg-destructive/20'
            }`}>
              {showFeedback === 'correct' 
                ? <CheckCircle2 className="h-16 w-16 text-[hsl(var(--success))]" />
                : <XCircle className="h-16 w-16 text-destructive" />}
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-5 sm:p-6 glow-border animate-fade-in">
          <h2 className="text-lg font-semibold leading-relaxed mb-5">{q.question}</h2>

          <div className="space-y-3">
            {(q.type === 'mcq' || q.type === 'true_false') && q.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(opt)}
                disabled={!!showFeedback}
                className={`w-full text-left p-4 rounded-xl border transition-all text-sm min-h-[52px] ${
                  answers[currentQ] === opt
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
                } ${showFeedback ? 'pointer-events-none' : ''}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold mr-3 shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}

            {(q.type === 'short_answer' || q.type === 'fill_blank') && (
              <form onSubmit={(e) => { e.preventDefault(); handleShortAnswer(); }} className="flex gap-2">
                <Input
                  value={shortAnswerInput}
                  onChange={(e) => setShortAnswerInput(e.target.value)}
                  placeholder={language === 'en' ? 'Type your answer...' : 'Taip jawapan anda...'}
                  className="rounded-xl h-12 bg-muted/50"
                  disabled={!!showFeedback}
                />
                <Button type="submit" className="rounded-xl h-12 px-6" disabled={!shortAnswerInput.trim() || !!showFeedback}>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl pb-24 md:pb-8">
        {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

        <div className="glass rounded-2xl p-6 sm:p-8 text-center mb-6 glow-border animate-scale-in">
          <h2 className="text-2xl font-bold mb-2">
            {percentage >= 70 ? t('congratulations') : t('keepTrying')}
          </h2>
          <p className="text-5xl font-bold text-gradient my-4">{percentage}%</p>
          <p className="text-muted-foreground mb-4">
            {correctCount}/{questions.length} {t('correct')}
          </p>

          {/* XP & Stats Summary */}
          <div className="flex justify-center gap-6 mt-4 mb-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Star className="h-5 w-5" />
                <span className="text-lg font-bold">{xpEarned}</span>
              </div>
              <p className="text-xs text-muted-foreground">XP {language === 'en' ? 'Earned' : 'Diperoleh'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500">
                <Flame className="h-5 w-5" />
                <span className="text-lg font-bold">{maxCombo}x</span>
              </div>
              <p className="text-xs text-muted-foreground">{language === 'en' ? 'Max Combo' : 'Kombo Maks'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[hsl(var(--success))]">
                <Zap className="h-5 w-5" />
                <span className="text-lg font-bold">{questions.length > 0 ? Math.round(Object.values(answerTimes).reduce((a, b) => a + b, 0) / questions.length) : 0}s</span>
              </div>
              <p className="text-xs text-muted-foreground">{language === 'en' ? 'Avg Speed' : 'Kelajuan Purata'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const isCorrect = (answers[i] || '').toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
            return (
              <div key={i} className={`glass rounded-xl p-4 space-y-2 ${isCorrect ? 'border-[hsl(var(--success))]/30' : 'border-destructive/30'} border`}>
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                  <p className="font-medium text-sm">{q.question}</p>
                </div>
                <p className="text-sm"><span className="text-muted-foreground">{t('yourAnswer')}:</span> <span className={isCorrect ? 'text-[hsl(var(--success))] font-medium' : 'text-destructive font-medium'}>{answers[i] || '—'}</span></p>
                {!isCorrect && <p className="text-sm"><span className="text-muted-foreground">{t('correctAnswer')}:</span> <span className="text-[hsl(var(--success))] font-medium">{q.correct_answer}</span></p>}
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          {wrongQuestions.length > 0 && (
            <Button variant="outline" onClick={handleRetryWrong} className="rounded-full gap-2 h-11">
              <RotateCcw className="h-4 w-4" /> {language === 'en' ? 'Retry Wrong Answers' : 'Cuba Semula Jawapan Salah'} ({wrongQuestions.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => { setStep('configure'); setQuestions([]); }} className="rounded-full gap-2 h-11">
            <RotateCcw className="h-4 w-4" /> {t('retake')}
          </Button>
          <Button onClick={() => navigate('/')} className="rounded-full h-11">
            {t('backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Quiz;
