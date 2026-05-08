import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap, RotateCcw, ChevronLeft, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSubjects } from '@/hooks/useSubjects';

interface Flashcard {
  front: string;
  back: string;
  difficulty: string;
}

const Flashcards = () => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const { subjects } = useSubjects();

  const [notes, setNotes] = useState('');
  const [subject, setSubject] = useState('');
  const [formLevel, setFormLevel] = useState(String(profile?.form_level || 1));
  const [count, setCount] = useState('10');
  const [generating, setGenerating] = useState(false);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { notes: notes || undefined, subject, formLevel: parseInt(formLevel), language, count: parseInt(count) },
      });
      if (error) throw error;
      setCards(data.flashcards || []);
      setCurrentIndex(0);
      setFlipped(false);
      setKnown(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const nextCard = () => {
    setFlipped(false);
    setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1));
  };

  const prevCard = () => {
    setFlipped(false);
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const markKnown = () => {
    setKnown(prev => new Set(prev).add(currentIndex));
    nextCard();
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
  };

  const knownPercent = cards.length > 0 ? Math.round((known.size / cards.length) * 100) : 0;

  // Generate mode
  if (cards.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-bold tracking-tight">
            {language === 'en' ? 'AI Flashcard Generator' : 'Penjana Kad Imbas AI'}
          </h1>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-6 space-y-5 glow-border">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'en' ? 'Paste your notes or describe a topic' : 'Tampal nota anda atau terangkan topik'}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'en' ? 'e.g., Chapter 5: Chemical Reactions — types of reactions, balancing equations...' : 'cth: Bab 5: Tindak Balas Kimia — jenis tindak balas, mengimbangkan persamaan...'}
              className="rounded-xl bg-muted/50 min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'en' ? 'Subject' : 'Mata Pelajaran'}</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue placeholder={language === 'en' ? 'Select subject' : 'Pilih mata pelajaran'} /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{language === 'en' ? 'Form Level' : 'Tingkatan'}</Label>
              <Select value={formLevel} onValueChange={setFormLevel}>
                <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(l => <SelectItem key={l} value={String(l)}>{language === 'en' ? `Form ${l}` : `Tingkatan ${l}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'en' ? 'Number of cards' : 'Bilangan kad'}</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || (!notes && !subject)}
            className="w-full h-12 rounded-full font-semibold gap-2"
          >
            {generating ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {language === 'en' ? 'Generating...' : 'Menjana...'}</>
            ) : (
              <><Sparkles className="h-5 w-5" /> {language === 'en' ? 'Generate Flashcards' : 'Jana Kad Imbas'}</>
            )}
          </Button>
        </div>

        {/* Empty state */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {language === 'en'
              ? 'Paste your study notes or pick a subject to generate AI-powered flashcards instantly.'
              : 'Tampal nota belajar anda atau pilih mata pelajaran untuk menjana kad imbas AI secara segera.'}
          </p>
        </div>
      </div>
    );
  }

  // Review mode
  const card = cards[currentIndex];
  const diffColor = card.difficulty === 'hard' ? 'text-destructive' : card.difficulty === 'medium' ? 'text-orange-500' : 'text-[hsl(var(--success))]';

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{language === 'en' ? 'Flashcard Review' : 'Ulangkaji Kad Imbas'}</h2>
            <p className="text-xs text-muted-foreground">{currentIndex + 1} / {cards.length} · {known.size} {language === 'en' ? 'known' : 'diketahui'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetDeck} className="rounded-full h-9 gap-1.5">
            <RotateCcw className="h-4 w-4" /> {language === 'en' ? 'Reset' : 'Set Semula'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCards([]); setCurrentIndex(0); }} className="rounded-full h-9">
            {language === 'en' ? 'New Deck' : 'Dek Baru'}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{language === 'en' ? 'Progress' : 'Kemajuan'}</span>
          <span>{knownPercent}%</span>
        </div>
        <Progress value={knownPercent} className="h-2 rounded-full" />
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="glass rounded-2xl glow-border cursor-pointer min-h-[280px] flex flex-col items-center justify-center p-8 text-center transition-all duration-300 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.25)] group"
      >
        <span className={`text-[10px] font-semibold uppercase tracking-widest mb-4 ${diffColor}`}>
          {card.difficulty}
        </span>

        {!flipped ? (
          <div className="animate-fade-in">
            <p className="text-lg sm:text-xl font-semibold leading-relaxed">{card.front}</p>
            <p className="text-xs text-muted-foreground mt-6 opacity-60">
              {language === 'en' ? 'Tap to reveal answer' : 'Ketik untuk lihat jawapan'}
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">{card.back}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button variant="ghost" size="icon" onClick={prevCard} disabled={currentIndex === 0} className="rounded-full h-12 w-12">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          onClick={markKnown}
          disabled={known.has(currentIndex)}
          className="rounded-full h-12 px-6 gap-2 font-medium"
        >
          {known.has(currentIndex) ? '✓' : language === 'en' ? 'I know this' : 'Saya tahu'}
        </Button>
        <Button variant="ghost" size="icon" onClick={nextCard} disabled={currentIndex === cards.length - 1} className="rounded-full h-12 w-12">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Flashcards;
