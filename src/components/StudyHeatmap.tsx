import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StudyHeatmapProps {
  quizDates: string[];
  chatDates: string[];
  focusDates: string[];
}

const StudyHeatmap = ({ quizDates, chatDates, focusDates }: StudyHeatmapProps) => {
  const { language } = useLanguage();

  const cells = useMemo(() => {
    const today = new Date();
    const allDates = new Set<string>();
    const activityCount = new Map<string, number>();

    [...quizDates, ...chatDates, ...focusDates].forEach(d => {
      const key = new Date(d).toISOString().split('T')[0];
      allDates.add(key);
      activityCount.set(key, (activityCount.get(key) || 0) + 1);
    });

    // Last 12 weeks (84 days)
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, count: activityCount.get(key) || 0, dayOfWeek: d.getDay() });
    }
    return days;
  }, [quizDates, chatDates, focusDates]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    if (count === 1) return 'bg-primary/20';
    if (count <= 3) return 'bg-primary/40';
    if (count <= 5) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  // Group by weeks
  const weeks: typeof cells[] = [];
  let currentWeek: typeof cells = [];
  cells.forEach((cell, i) => {
    currentWeek.push(cell);
    if (cell.dayOfWeek === 6 || i === cells.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">
        {language === 'en' ? 'Study Activity' : 'Aktiviti Belajar'}
      </h3>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <div className={`w-3 h-3 rounded-[2px] ${getColor(day.count)} transition-colors`} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>{day.date}: {day.count} {language === 'en' ? 'activities' : 'aktiviti'}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>{language === 'en' ? 'Less' : 'Kurang'}</span>
        <div className="w-3 h-3 rounded-[2px] bg-muted/50" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/20" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/40" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/60" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/80" />
        <span>{language === 'en' ? 'More' : 'Lebih'}</span>
      </div>
    </div>
  );
};

export default StudyHeatmap;
