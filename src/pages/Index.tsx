import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Brain, Trophy, TrendingUp, Zap, Clock, Target, BookOpen, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [chatCount, setChatCount] = useState(0);

  // Pomodoro
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroTime]);

  const displayName = profile?.display_name || (language === 'en' ? 'Student' : 'Pelajar');
  const formLabel = language === 'en' ? `Form ${profile?.form_level || 1}` : `Tingkatan ${profile?.form_level || 1}`;
  const avgScore = recentQuizzes.length > 0
    ? Math.round(recentQuizzes.reduce((s, q) => s + Number(q.score_percentage), 0) / recentQuizzes.length)
    : 0;

  const pomodoroMin = Math.floor(pomodoroTime / 60);
  const pomodoroSec = pomodoroTime % 60;

  const stats = [
    { icon: MessageCircle, value: chatCount, label: language === 'en' ? 'Chats' : 'Perbualan', color: 'text-primary' },
    { icon: Brain, value: recentQuizzes.length, label: language === 'en' ? 'Quizzes' : 'Kuiz', color: 'text-primary' },
    { icon: Trophy, value: `${avgScore}%`, label: language === 'en' ? 'Avg Score' : 'Skor Purata', color: 'text-success' },
    { icon: TrendingUp, value: formLabel, label: language === 'en' ? 'Level' : 'Tahap', color: 'text-primary' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl pb-20 md:pb-6">
      {/* Welcome */}
      <div className="space-y-1 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('welcome')}, <span className="text-gradient">{displayName}</span>
        </h1>
        <p className="text-muted-foreground text-sm">{formLabel} · {language === 'en' ? 'Keep up the great work!' : 'Teruskan usaha yang baik!'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {stats.map(({ icon: Icon, value, label, color }, i) => (
          <div key={i} className="glass rounded-xl p-3 text-center glass-hover">
            <Icon className={`h-4 w-4 mx-auto ${color} mb-1.5`} />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <Link to="/chat">
          <div className="glass rounded-xl p-5 glass-hover group cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{language === 'en' ? 'AI Chat' : 'Chat AI'}</h3>
                <p className="text-[11px] text-muted-foreground">{language === 'en' ? 'Ask anything' : 'Tanya apa sahaja'}</p>
              </div>
            </div>
            <div className="flex items-center text-xs text-primary font-medium gap-1">
              {language === 'en' ? 'Start chatting' : 'Mula berbual'} <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </Link>
        <Link to="/quiz">
          <div className="glass rounded-xl p-5 glass-hover group cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{language === 'en' ? 'Take Quiz' : 'Ambil Kuiz'}</h3>
                <p className="text-[11px] text-muted-foreground">{language === 'en' ? 'Test knowledge' : 'Uji pengetahuan'}</p>
              </div>
            </div>
            <div className="flex items-center text-xs text-primary font-medium gap-1">
              {language === 'en' ? 'Generate quiz' : 'Jana kuiz'} <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </Link>
      </div>

      {/* Pomodoro Timer */}
      <div className="glass rounded-xl p-5 glow-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{language === 'en' ? 'Focus Timer' : 'Pemasa Fokus'}</h3>
              <p className="text-[11px] text-muted-foreground">{language === 'en' ? 'Pomodoro technique' : 'Teknik Pomodoro'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono tracking-wider">
              {String(pomodoroMin).padStart(2, '0')}:{String(pomodoroSec).padStart(2, '0')}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
              >
                {pomodoroRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => { setPomodoroTime(25 * 60); setPomodoroRunning(false); }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{t('recentQuizzes')}</h2>
            <Link to="/history" className="text-xs text-primary font-medium hover:underline">
              {language === 'en' ? 'View all' : 'Lihat semua'}
            </Link>
          </div>
          <div className="space-y-2">
            {recentQuizzes.slice(0, 3).map((quiz) => (
              <div key={quiz.id} className="glass rounded-xl p-3.5 flex items-center justify-between glass-hover">
                <div>
                  <p className="font-medium text-sm">{quiz.subject}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'en' ? `Form ${quiz.form_level}` : `Tingkatan ${quiz.form_level}`} · {quiz.difficulty}
                  </p>
                </div>
                <span className={`text-sm font-bold ${Number(quiz.score_percentage) >= 70 ? 'text-success' : 'text-destructive'}`}>
                  {quiz.score_percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
