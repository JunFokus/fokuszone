import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { usePomodoro, getStreak, getSessionHistory } from '@/hooks/usePomodoro';
import { MessageCircle, Brain, Trophy, TrendingUp, Clock, ArrowRight, Play, Pause, RotateCcw, Flame, Zap, Coffee, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const Index = () => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [lastChat, setLastChat] = useState<{ id: string; title: string } | null>(null);
  const streak = getStreak();
  const focusHistory = getSessionHistory();
  const completedToday = focusHistory.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && s.completed && s.mode === 'work').length;

  const pomodoro = usePomodoro();

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
      .select('conversation_id, content, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        const unique = new Set(data.map(d => d.conversation_id));
        setChatCount(unique.size);
        // Find last conversation's first user message for title
        const convIds = Array.from(unique);
        if (convIds.length > 0) {
          const lastId = convIds[convIds.length - 1];
          const firstMsg = data.find(d => d.conversation_id === lastId && d.role === 'user');
          setLastChat({
            id: lastId,
            title: firstMsg ? (firstMsg.content.length > 40 ? firstMsg.content.slice(0, 40) + '...' : firstMsg.content) : 'Chat',
          });
        }
      });
  }, [user]);

  const displayName = profile?.display_name || (language === 'en' ? 'Student' : 'Pelajar');
  const formLabel = language === 'en' ? `Form ${profile?.form_level || 1}` : `Tingkatan ${profile?.form_level || 1}`;
  const avgScore = recentQuizzes.length > 0
    ? Math.round(recentQuizzes.reduce((s, q) => s + Number(q.score_percentage), 0) / recentQuizzes.length)
    : 0;

  const modeLabels = {
    work: language === 'en' ? 'Focus' : 'Fokus',
    shortBreak: language === 'en' ? 'Short Break' : 'Rehat Pendek',
    longBreak: language === 'en' ? 'Long Break' : 'Rehat Panjang',
  };

  const stats = [
    { icon: MessageCircle, value: chatCount, label: language === 'en' ? 'Chats' : 'Perbualan', color: 'text-primary' },
    { icon: Brain, value: recentQuizzes.length, label: language === 'en' ? 'Quizzes' : 'Kuiz', color: 'text-primary' },
    { icon: Trophy, value: `${avgScore}%`, label: language === 'en' ? 'Avg Score' : 'Skor Purata', color: 'text-[hsl(var(--success))]' },
    { icon: Flame, value: streak, label: language === 'en' ? 'Streak' : 'Kesinambungan', color: 'text-orange-500' },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl pb-24 md:pb-6">
      {/* Welcome */}
      <div className="space-y-1 animate-fade-in">
        <h1 className="font-bold tracking-tight">
          {language === 'en' ? 'Welcome' : 'Selamat Datang'}, <span className="text-gradient">{displayName}</span>
        </h1>
        <p className="text-muted-foreground">{formLabel} · {language === 'en' ? 'Keep up the great work!' : 'Teruskan usaha yang baik!'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {stats.map(({ icon: Icon, value, label, color }, i) => (
          <div key={i} className="glass rounded-xl p-4 text-center glass-hover">
            <Icon className={`h-5 w-5 mx-auto ${color} mb-2`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Continue Where You Left Off */}
      {(lastChat || recentQuizzes.length > 0 || pomodoro.running) && (
        <div className="animate-fade-in" style={{ animationDelay: '0.12s' }}>
          <h2 className="font-semibold mb-3">{language === 'en' ? 'Continue Where You Left Off' : 'Sambung Semula'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pomodoro.running && (
              <Link to="/" onClick={(e) => { e.preventDefault(); document.getElementById('pomodoro-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
                <div className="glass rounded-xl p-4 glass-hover flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{modeLabels[pomodoro.mode]}</p>
                    <p className="text-xs text-muted-foreground">{String(pomodoro.minutes).padStart(2, '0')}:{String(pomodoro.seconds).padStart(2, '0')} {language === 'en' ? 'remaining' : 'berbaki'}</p>
                  </div>
                </div>
              </Link>
            )}
            {lastChat && (
              <Link to="/chat">
                <div className="glass rounded-xl p-4 glass-hover flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{lastChat.title}</p>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Last chat' : 'Perbualan terakhir'}</p>
                  </div>
                </div>
              </Link>
            )}
            {recentQuizzes.length > 0 && (
              <Link to="/quiz">
                <div className="glass rounded-xl p-4 glass-hover flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{recentQuizzes[0].subject}</p>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Last quiz' : 'Kuiz terakhir'} · {recentQuizzes[0].score_percentage}%</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <Link to="/chat">
          <div className="glass rounded-xl p-5 glass-hover group cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{language === 'en' ? 'AI Chat' : 'Chat AI'}</h3>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Ask anything' : 'Tanya apa sahaja'}</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-primary font-medium gap-1">
              {language === 'en' ? 'Start chatting' : 'Mula berbual'} <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
        <Link to="/quiz">
          <div className="glass rounded-xl p-5 glass-hover group cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{language === 'en' ? 'Take Quiz' : 'Ambil Kuiz'}</h3>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Test knowledge' : 'Uji pengetahuan'}</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-primary font-medium gap-1">
              {language === 'en' ? 'Generate quiz' : 'Jana kuiz'} <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Pomodoro Timer */}
      <div id="pomodoro-section" className="glass rounded-xl p-5 glow-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{language === 'en' ? 'Focus Timer' : 'Pemasa Fokus'}</h3>
              <p className="text-sm text-muted-foreground">
                {modeLabels[pomodoro.mode]} · {language === 'en' ? `Cycle ${pomodoro.cycleCount + 1}` : `Kitaran ${pomodoro.cycleCount + 1}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{completedToday} {language === 'en' ? 'sessions today' : 'sesi hari ini'}</span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-4">
          {(['work', 'shortBreak', 'longBreak'] as const).map((m) => (
            <Button
              key={m}
              variant={pomodoro.mode === m ? 'default' : 'ghost'}
              size="sm"
              onClick={() => pomodoro.setMode(m)}
              className="rounded-full text-xs h-8 gap-1.5"
            >
              {m === 'work' && <Target className="h-3.5 w-3.5" />}
              {m === 'shortBreak' && <Coffee className="h-3.5 w-3.5" />}
              {m === 'longBreak' && <Zap className="h-3.5 w-3.5" />}
              {modeLabels[m]}
            </Button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="flex items-center justify-center gap-4 py-4">
          <span className="text-5xl sm:text-6xl font-bold font-mono tracking-wider">
            {String(pomodoro.minutes).padStart(2, '0')}:{String(pomodoro.seconds).padStart(2, '0')}
          </span>
        </div>

        {/* Progress Bar */}
        <Progress value={pomodoro.progress} className="h-1.5 rounded-full mb-4" />

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={pomodoro.reset}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={pomodoro.toggle}
          >
            {pomodoro.running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <div className="w-12" /> {/* spacer for alignment */}
        </div>
      </div>

      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{language === 'en' ? 'Recent Quizzes' : 'Kuiz Terkini'}</h2>
            <Link to="/history" className="text-sm text-primary font-medium hover:underline">
              {language === 'en' ? 'View all' : 'Lihat semua'}
            </Link>
          </div>
          <div className="space-y-2">
            {recentQuizzes.slice(0, 3).map((quiz) => (
              <div key={quiz.id} className="glass rounded-xl p-4 flex items-center justify-between glass-hover">
                <div>
                  <p className="font-medium">{quiz.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? `Form ${quiz.form_level}` : `Tingkatan ${quiz.form_level}`} · {quiz.difficulty}
                  </p>
                </div>
                <span className={`text-lg font-bold ${Number(quiz.score_percentage) >= 70 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
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
