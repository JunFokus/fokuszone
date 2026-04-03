import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
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

  // Config
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [formLevel, setFormLevel] = useState(String(profile?.form_level || 1));
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('mcq');
  const [numQuestions, setNumQuestions] = useState('5');
  const [generating, setGenerating] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [shortAnswerInput, setShortAnswerInput] = useState('');

  // Results
  const [showConfetti, setShowConfetti] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          prompt: prompt || undefined,
          subject,
          formLevel: parseInt(formLevel),
          difficulty,
          questionType,
          numQuestions: parseInt(numQuestions),
          language,
        },
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
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    // Save short answer for current question
    if ((questions[currentQ]?.type === 'short_answer' || questions[currentQ]?.type === 'fill_blank') && shortAnswerInput.trim()) {
      answers[currentQ] = shortAnswerInput.trim();
    }

    const correctCount = questions.reduce((count, q, i) => {
      const userAns = (answers[i] || '').toLowerCase().trim();
      const correctAns = q.correct_answer.toLowerCase().trim();
      return count + (userAns === correctAns ? 1 : 0);
    }, 0);
    const percentage = Math.round((correctCount / questions.length) * 100);

    if (percentage >= 80) setShowConfetti(true);

    // Save to DB
    if (user) {
      await supabase.from('quiz_results').insert({
        user_id: user.id,
        subject: subject || prompt || 'General',
        form_level: parseInt(formLevel),
        difficulty,
        question_type: questionType,
        total_questions: questions.length,
        correct_answers: correctCount,
        score_percentage: percentage,
        quiz_data: questions.map((q, i) => ({ ...q, user_answer: answers[i] || '' })),
      });
    }

    setStep('results');
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const correctCount = questions.reduce((count, q, i) => {
    const userAns = (answers[i] || '').toLowerCase().trim();
    return count + (userAns === q.correct_answer.toLowerCase().trim() ? 1 : 0);
  }, 0);
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  if (step === 'configure') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold mb-6">🧠 {t('configureQuiz')}</h1>
        <Card className="border-2 border-secondary/20">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>{t('quizPrompt')}</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={language === 'en' ? 'e.g., Form 3 Science — Forces and Motion' : 'cth: Tingkatan 3 Sains — Daya dan Gerakan'}
                className="rounded-xl"
              />
            </div>

            <div className="text-center text-muted-foreground text-sm font-medium">— {t('or')} —</div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('subject')}</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('selectSubject')} /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{t(s.key as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('formLevel')}</Label>
                <Select value={formLevel} onValueChange={setFormLevel}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(l => (
                      <SelectItem key={l} value={String(l)}>
                        {language === 'en' ? `Form ${l}` : `Tingkatan ${l}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('difficulty')}</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t('easy')} 😊</SelectItem>
                    <SelectItem value="medium">{t('medium')} 🤔</SelectItem>
                    <SelectItem value="hard">{t('hard')} 🔥</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('questionType')}</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
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
              <Label>{t('numQuestions')}</Label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
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
              className="w-full h-12 rounded-full text-lg font-bold bg-gradient-to-r from-secondary to-primary hover:opacity-90"
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('generating')}</>
              ) : (
                <>{t('generateQuiz')} 🚀</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{t('question')} {currentQ + 1} {t('of')} {questions.length}</span>
            <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} className="h-3 rounded-full" />
        </div>

        <Card className="border-2 border-primary/20 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(q.type === 'mcq' || q.type === 'true_false') && q.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(opt)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQ] === opt
                    ? 'border-primary bg-primary/10 font-semibold'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold mr-3">
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
                className="rounded-xl text-lg h-14"
              />
            )}

            <div className="flex gap-3 pt-4">
              {currentQ > 0 && (
                <Button variant="outline" onClick={() => setCurrentQ(prev => prev - 1)} className="rounded-full">
                  {t('previous')}
                </Button>
              )}
              <div className="flex-1" />
              {currentQ < questions.length - 1 ? (
                <Button onClick={handleNext} disabled={!answers[currentQ]} className="rounded-full gap-2">
                  {t('next')} <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!answers[currentQ]} className="rounded-full bg-gradient-to-r from-accent to-primary">
                  {t('submit')} ✅
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

        <Card className="border-2 border-accent/30 mb-6 animate-bounce-in">
          <CardContent className="text-center py-8">
            <p className="text-5xl mb-4">{percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '📚'}</p>
            <h2 className="text-3xl font-extrabold mb-2">
              {percentage >= 70 ? t('congratulations') : t('keepTrying')}
            </h2>
            <p className="text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {percentage}%
            </p>
            <p className="text-muted-foreground mt-2">
              {correctCount}/{questions.length} {t('correct')}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const isCorrect = (answers[i] || '').toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
            return (
              <Card key={i} className={`border-2 ${isCorrect ? 'border-accent/30' : 'border-destructive/30'}`}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                    <p className="font-semibold">{q.question}</p>
                  </div>
                  <p className="text-sm"><span className="text-muted-foreground">{t('yourAnswer')}:</span> <span className={isCorrect ? 'text-accent font-medium' : 'text-destructive font-medium'}>{answers[i] || '—'}</span></p>
                  {!isCorrect && <p className="text-sm"><span className="text-muted-foreground">{t('correctAnswer')}:</span> <span className="text-accent font-medium">{q.correct_answer}</span></p>}
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">💡 {q.explanation}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => { setStep('configure'); setQuestions([]); }} className="rounded-full gap-2">
            <RotateCcw className="h-4 w-4" /> {t('retake')}
          </Button>
          <Button onClick={() => navigate('/')} className="rounded-full">
            {t('backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Quiz;
