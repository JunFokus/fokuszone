import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';

interface QuizResult {
  subject: string;
  score_percentage: number;
  form_level: number;
  difficulty: string;
  created_at: string;
}

interface WeaknessDetectorProps {
  quizzes: QuizResult[];
}

const WeaknessDetector = ({ quizzes }: WeaknessDetectorProps) => {
  const { language } = useLanguage();

  const analysis = useMemo(() => {
    if (quizzes.length < 2) return null;

    const subjectStats = new Map<string, { total: number; sum: number; recent: number[] }>();
    for (const q of quizzes) {
      const stats = subjectStats.get(q.subject) || { total: 0, sum: 0, recent: [] };
      stats.total++;
      stats.sum += Number(q.score_percentage);
      stats.recent.push(Number(q.score_percentage));
      subjectStats.set(q.subject, stats);
    }

    const subjects = Array.from(subjectStats.entries()).map(([name, stats]) => ({
      name,
      avg: Math.round(stats.sum / stats.total),
      count: stats.total,
      trend: stats.recent.length >= 2
        ? stats.recent[stats.recent.length - 1] - stats.recent[0]
        : 0,
    }));

    const weakest = subjects.filter(s => s.avg < 70).sort((a, b) => a.avg - b.avg);
    const strongest = subjects.filter(s => s.avg >= 70).sort((a, b) => b.avg - a.avg);
    const improving = subjects.filter(s => s.trend > 10).sort((a, b) => b.trend - a.trend);

    return { weakest, strongest, improving };
  }, [quizzes]);

  if (!analysis || (analysis.weakest.length === 0 && analysis.strongest.length === 0)) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <h2 className="font-semibold flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        {language === 'en' ? 'AI Insights' : 'Pandangan AI'}
      </h2>

      {analysis.weakest.length > 0 && (
        <div className="glass rounded-xl p-4 border-orange-500/20 border space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{language === 'en' ? 'Needs Improvement' : 'Perlu Penambahbaikan'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.weakest.slice(0, 3).map(s => (
              <div key={s.name} className="px-3 py-1.5 rounded-full bg-orange-500/10 text-xs font-medium">
                {s.name} — {s.avg}%
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'en'
              ? 'Try more quizzes in these subjects to improve your scores.'
              : 'Cuba lebih banyak kuiz dalam mata pelajaran ini untuk meningkatkan skor anda.'}
          </p>
        </div>
      )}

      {analysis.improving.length > 0 && (
        <div className="glass rounded-xl p-4 border-[hsl(var(--success))]/20 border space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
            <span className="text-sm font-medium">{language === 'en' ? 'Improving' : 'Bertambah Baik'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.improving.slice(0, 3).map(s => (
              <div key={s.name} className="px-3 py-1.5 rounded-full bg-[hsl(var(--success))]/10 text-xs font-medium">
                {s.name} +{s.trend}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeaknessDetector;
