import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trophy, Flame, Brain, Star, Zap, Target, BookOpen, MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AchievementBadgesProps {
  quizCount: number;
  chatCount: number;
  streak: number;
  avgScore: number;
  totalXp: number;
}

interface Badge {
  id: string;
  icon: typeof Trophy;
  title: string;
  titleMs: string;
  desc: string;
  descMs: string;
  earned: boolean;
  color: string;
}

const AchievementBadges = ({ quizCount, chatCount, streak, avgScore, totalXp }: AchievementBadgesProps) => {
  const { language } = useLanguage();

  const badges: Badge[] = useMemo(() => [
    { id: 'first-quiz', icon: Brain, title: 'First Quiz', titleMs: 'Kuiz Pertama', desc: 'Complete your first quiz', descMs: 'Selesaikan kuiz pertama anda', earned: quizCount >= 1, color: 'text-primary' },
    { id: 'quiz-master', icon: Trophy, title: 'Quiz Master', titleMs: 'Pakar Kuiz', desc: 'Complete 10 quizzes', descMs: 'Selesaikan 10 kuiz', earned: quizCount >= 10, color: 'text-amber-500' },
    { id: 'chat-starter', icon: MessageCircle, title: 'Chat Starter', titleMs: 'Pemula Chat', desc: 'Start 5 conversations', descMs: 'Mulakan 5 perbualan', earned: chatCount >= 5, color: 'text-blue-500' },
    { id: 'streak-3', icon: Flame, title: '3-Day Streak', titleMs: 'Strik 3 Hari', desc: 'Study 3 days in a row', descMs: 'Belajar 3 hari berturut-turut', earned: streak >= 3, color: 'text-orange-500' },
    { id: 'streak-7', icon: Flame, title: 'Week Warrior', titleMs: 'Pejuang Mingguan', desc: '7-day study streak', descMs: 'Strik belajar 7 hari', earned: streak >= 7, color: 'text-red-500' },
    { id: 'high-scorer', icon: Star, title: 'High Scorer', titleMs: 'Skor Tinggi', desc: 'Average score above 80%', descMs: 'Skor purata melebihi 80%', earned: avgScore >= 80, color: 'text-yellow-500' },
    { id: 'xp-100', icon: Zap, title: 'XP Hunter', titleMs: 'Pemburu XP', desc: 'Earn 100+ XP', descMs: 'Peroleh 100+ XP', earned: totalXp >= 100, color: 'text-purple-500' },
    { id: 'bookworm', icon: BookOpen, title: 'Bookworm', titleMs: 'Ulat Buku', desc: 'Complete 25 quizzes', descMs: 'Selesaikan 25 kuiz', earned: quizCount >= 25, color: 'text-emerald-500' },
  ], [quizCount, chatCount, streak, avgScore, totalXp]);

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {language === 'en' ? 'Achievements' : 'Pencapaian'}
        </h3>
        <span className="text-xs text-muted-foreground">{earned.length}/{badges.length}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {badges.map(badge => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                badge.earned
                  ? 'bg-primary/10 glass-hover cursor-pointer'
                  : 'bg-muted/30 opacity-40 cursor-default'
              }`}>
                <badge.icon className={`h-5 w-5 ${badge.earned ? badge.color : 'text-muted-foreground'}`} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="font-medium text-xs">{language === 'en' ? badge.title : badge.titleMs}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'en' ? badge.desc : badge.descMs}</p>
              {!badge.earned && <p className="text-[10px] text-muted-foreground mt-1">🔒 {language === 'en' ? 'Locked' : 'Dikunci'}</p>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default AchievementBadges;
