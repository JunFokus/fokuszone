import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Brain, Trophy, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRecentQuizzes(data || []));

    supabase
      .from('chat_messages')
      .select('conversation_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const unique = new Set(data?.map(d => d.conversation_id));
        setChatCount(unique.size);
      });
  }, [user]);

  const displayName = profile?.display_name || (language === 'en' ? 'Student' : 'Pelajar');
  const formLabel = language === 'en' ? `Form ${profile?.form_level || 1}` : `Tingkatan ${profile?.form_level || 1}`;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
      <div className="space-y-1 animate-slide-up">
        <h1 className="text-2xl font-extrabold">
          {t('welcome')}, {displayName} 👋
        </h1>
        <p className="text-muted-foreground text-sm">{formLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/chat">
          <Card className="group hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
              <MessageCircle className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <h2 className="font-bold text-sm">{t('chat')}</h2>
              <p className="text-muted-foreground text-xs leading-tight">
                {language === 'en' ? 'Ask questions & learn' : 'Tanya soalan & belajar'}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/quiz">
          <Card className="group hover:border-accent/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
              <Brain className="h-8 w-8 text-accent group-hover:scale-110 transition-transform" />
              <h2 className="font-bold text-sm">{t('quiz')}</h2>
              <p className="text-muted-foreground text-xs leading-tight">
                {language === 'en' ? 'Test your knowledge' : 'Uji pengetahuan anda'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: MessageCircle, value: chatCount, label: language === 'en' ? 'Chats' : 'Perbualan', color: 'text-primary' },
          { icon: Brain, value: recentQuizzes.length, label: language === 'en' ? 'Quizzes' : 'Kuiz', color: 'text-accent' },
          { icon: Trophy, value: recentQuizzes.length > 0 ? `${Math.round(recentQuizzes.reduce((s, q) => s + Number(q.score_percentage), 0) / recentQuizzes.length)}%` : '0%', label: language === 'en' ? 'Avg' : 'Purata', color: 'text-primary' },
          { icon: TrendingUp, value: formLabel, label: language === 'en' ? 'Level' : 'Tahap', color: 'text-accent' },
        ].map(({ icon: Icon, value, label, color }, i) => (
          <Card key={i} className="text-center p-3">
            <Icon className={`h-4 w-4 mx-auto ${color} mb-1`} />
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {recentQuizzes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t('recentQuizzes')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div>
                  <p className="font-semibold text-sm">{quiz.subject}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === 'en' ? `Form ${quiz.form_level}` : `Tingkatan ${quiz.form_level}`} · {quiz.difficulty}
                  </p>
                </div>
                <span className={`text-sm font-bold ${Number(quiz.score_percentage) >= 70 ? 'text-primary' : 'text-destructive'}`}>
                  {quiz.score_percentage}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
