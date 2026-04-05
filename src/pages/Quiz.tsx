import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';

interface QuizQuestion {
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: string[];
  correct_answer: string;
  explanation: string;
}

type Step = 'configure' | 'quiz' | 'results';

const SUBJECTS = [
  { key: 'mathSubject', value: 'Mathematics' },
  { key: 'scienceSubject', value: 'Science' },
  { key: 'bmSubject', value: 'Bahasa Melayu' },
  { key: 'englishSubject', value: 'English' },
  { key: 'sejarahSubject', value: 'Sejarah' },
  { key: 'geoSubject', value: 'Geography' },
  { key: 'addMathSubject', value: 'Additional Mathematics' },
  { key: 'physicsSubject', value: 'Physics' },
  { key: 'chemistrySubject', value: 'Chemistry' },
  { key: 'biologySubject', value: 'Biology' },
];

const Quiz = () => {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
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
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQ]: answer }));
  };

  const handleNext = () => {
    if (questions[currentQ]?.type === 'short_answer' || questions[currentQ]?.type === 'fill_blank') {
      if (shortAnswerInput.trim()) {
        setAnswers(prev => ({ ...prev, [currentQ]: shortAnswerInput.trim() }));
        setShortAnswerInput('');
      }
    }
    if (currentQ < questions.length - 1) setCurrentQ(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if ((questions[currentQ]?.type === 'short_answer' || questions[currentQ]?.type === 'fill_blank') && shortAnswerInput.trim()) {
      answers[currentQ] = shortAnswerInput.trim();
    }

    const correctCount = questions.reduce((count, q, i) => {
      return count + ((answers[i] || '').toLowerCase().trim() === q.correct_answer.toLowerCase().trim() ? 1 : 0);
    }, 0);
    const percentage = Math.round((correctCount / questions.length) * 100);
    if (percentage >= 80) setShowConfetti(true);

    if (user) {
      await supabase.from('quiz_results').insert({
        user_id: user.id, subject: subject || prompt || 'General', form_level: parseInt(formLevel),
        difficulty, question_type: questionType, total_questions: questions.length,
        correct_answers: correctCount, score_percentage: percentage,
        quiz_data: questions.map((q, i) => ({ ...q, user_answer: answers[i] || '' })),
      });
    }

    setStep('results');
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const correctCount = questions.reduce((count, q, i) => {
    return count + ((answers[i] || '').toLowerCase().trim() === q.correct_answer.toLowerCase().trim() ? 1 : 0);
  }, 0);
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

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
                  {SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{t(s.key as any)}</SelectItem>)}
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
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl pb-24 md:pb-8">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{t('question')} {currentQ + 1} {t('of')} {questions.length}</span>
            <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2 rounded-full" />
        </div>

        <div className="glass rounded-2xl p-5 sm:p-6 glow-border animate-fade-in">
          <h2 className="text-lg font-semibold leading-relaxed mb-5">{q.question}</h2>

          <div className="space-y-3">
            {(q.type === 'mcq' || q.type === 'true_false') && q.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(opt)}
                className={`w-full text-left p-4 rounded-xl border transition-all text-sm min-h-[52px] ${
                  answers[currentQ] === opt
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold mr-3 shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}

            {(q.type === 'short_answer' || q.type === 'fill_blank') && (
              <Input
                value={answers[currentQ] || shortAnswerInput}
                onChange={(e) => {
                  setShortAnswerInput(e.target.value);
                  setAnswers(prev => ({ ...prev, [currentQ]: e.target.value }));
                }}
                placeholder={language === 'en' ? 'Type your answer...' : 'Taip jawapan anda...'}
                className="rounded-xl h-12 bg-muted/50"
              />
            )}
          </div>

          <div className="flex gap-3 pt-6">
            {currentQ > 0 && (
              <Button variant="outline" onClick={() => setCurrentQ(prev => prev - 1)} className="rounded-full h-11">
                {t('previous')}
              </Button>
            )}
            <div className="flex-1" />
            {currentQ < questions.length - 1 ? (
              <Button onClick={handleNext} disabled={!answers[currentQ]} className="rounded-full gap-2 h-11">
                {t('next')} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!answers[currentQ]} className="rounded-full h-11">
                {t('submit')}
              </Button>
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
          <p className="text-muted-foreground">
            {correctCount}/{questions.length} {t('correct')}
          </p>
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

        <div className="flex gap-3 mt-6">
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
