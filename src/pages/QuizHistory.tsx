import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Calendar, Brain } from 'lucide-react';

const QuizHistory = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setQuizzes(data || []));
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-20 md:pb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t('history')}</h1>
      </div>

      {quizzes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">{t('noQuizzes')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="glass rounded-xl p-4 flex items-center justify-between glass-hover">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{quiz.subject}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{language === 'en' ? `Form ${quiz.form_level}` : `Tingkatan ${quiz.form_level}`}</span>
                  <span>·</span>
                  <span className="capitalize">{quiz.difficulty}</span>
                  <span>·</span>
                  <span>{quiz.total_questions} {language === 'en' ? 'questions' : 'soalan'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(quiz.created_at).toLocaleDateString(language === 'en' ? 'en-MY' : 'ms-MY')}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${Number(quiz.score_percentage) >= 70 ? 'text-success' : 'text-destructive'}`}>
                  {quiz.score_percentage}%
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {quiz.correct_answers}/{quiz.total_questions} {t('correct')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizHistory;
