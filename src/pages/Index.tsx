import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-2 animate-slide-up">
        <h1 className="text-4xl font-extrabold">
          {t('welcome')}, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{displayName}</span>! 👋
        </h1>
        <p className="text-muted-foreground text-lg">{formLabel} • {t('heroSubtitle')}</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/chat">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/50 cursor-pointer h-full">
            <CardContent className="flex items-center gap-6 p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                💬
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('chat')}</h2>
                <p className="text-muted-foreground text-sm">
                  {language === 'en' ? 'Ask questions, get explanations, learn anything!' : 'Tanya soalan, dapat penerangan, belajar apa sahaja!'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quiz">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-secondary/20 hover:border-secondary/50 cursor-pointer h-full">
            <CardContent className="flex items-center gap-6 p-8">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🧠
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('quiz')}</h2>
                <p className="text-muted-foreground text-sm">
                  {language === 'en' ? 'Generate quizzes on any subject and test yourself!' : 'Jana kuiz untuk mana-mana subjek dan uji diri anda!'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <MessageCircle className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{chatCount}</p>
          <p className="text-xs text-muted-foreground">{language === 'en' ? 'Conversations' : 'Perbualan'}</p>
        </Card>
        <Card className="text-center p-4">
          <Brain className="h-6 w-6 mx-auto text-secondary mb-1" />
          <p className="text-2xl font-bold text-foreground">{recentQuizzes.length}</p>
          <p className="text-xs text-muted-foreground">{language === 'en' ? 'Quizzes Taken' : 'Kuiz Diambil'}</p>
        </Card>
        <Card className="text-center p-4">
          <Trophy className="h-6 w-6 mx-auto text-accent mb-1" />
          <p className="text-2xl font-bold text-foreground">
            {recentQuizzes.length > 0
              ? Math.round(recentQuizzes.reduce((s, q) => s + Number(q.score_percentage), 0) / recentQuizzes.length)
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground">{language === 'en' ? 'Avg Score' : 'Purata Markah'}</p>
        </Card>
        <Card className="text-center p-4">
          <TrendingUp className="h-6 w-6 mx-auto text-purple mb-1" />
          <p className="text-2xl font-bold text-foreground">{formLabel}</p>
          <p className="text-xs text-muted-foreground">{language === 'en' ? 'Level' : 'Tahap'}</p>
        </Card>
      </div>

      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('recentQuizzes')} 📊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-semibold text-foreground">{quiz.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? `Form ${quiz.form_level}` : `Tingkatan ${quiz.form_level}`} • {quiz.difficulty}
                  </p>
                </div>
                <div className={`text-lg font-bold ${Number(quiz.score_percentage) >= 70 ? 'text-accent' : 'text-secondary'}`}>
                  {quiz.score_percentage}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
