import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Calendar } from 'lucide-react';

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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-extrabold mb-6">📊 {t('history')}</h1>

      {quizzes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-4xl mb-4">📝</p>
            <p className="text-muted-foreground">{t('noQuizzes')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="border-2 border-border hover:border-primary/30 transition-colors">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-lg">{quiz.subject}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{language === 'en' ? `Form ${quiz.form_level}` : `Tingkatan ${quiz.form_level}`}</span>
                    <span>•</span>
                    <span className="capitalize">{quiz.difficulty}</span>
                    <span>•</span>
                    <span>{quiz.total_questions} {language === 'en' ? 'questions' : 'soalan'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(quiz.created_at).toLocaleDateString(language === 'en' ? 'en-MY' : 'ms-MY')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-extrabold ${Number(quiz.score_percentage) >= 70 ? 'text-accent' : 'text-secondary'}`}>
                    {quiz.score_percentage}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {quiz.correct_answers}/{quiz.total_questions} {t('correct')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizHistory;
