import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles, FileText, X, Image as ImageIcon, FileType, Notebook, Lightbulb, Brain, Zap, History as HistoryIcon, Trash2, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Flashcard { front: string; back: string; difficulty: string; }
interface QuizQuestion { question: string; type: string; options?: string[]; correct_answer: string; explanation: string; }
interface ProcessedNotes {
  summary: string;
  keyPoints: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}
interface HistoryEntry {
  id: string;
  title: string;
  summary: string;
  key_points: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  source_text: string | null;
  created_at: string;
}

const MAX_IMAGES = 4;
const MAX_FILE_MB = 10;

const Notes = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [text, setText] = useState('');
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedNotes | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const t = (en: string, ms: string) => (language === 'en' ? en : ms);

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib: any = await import('pdfjs-dist');
    // Use the bundled worker via ?url
    // @ts-ignore
    const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let full = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const str = content.items.map((it: any) => it.str).join(' ');
      full += str + '\n\n';
    }
    return full.trim();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast({ title: t(`File too large (max ${MAX_FILE_MB}MB)`, `Fail terlalu besar (maks ${MAX_FILE_MB}MB)`), variant: 'destructive' });
        continue;
      }
      if (file.type.startsWith('image/')) {
        if (images.length >= MAX_IMAGES) {
          toast({ title: t(`Max ${MAX_IMAGES} images`, `Maks ${MAX_IMAGES} imej`), variant: 'destructive' });
          continue;
        }
        const dataUrl = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
        setImages((prev) => [...prev, { name: file.name, dataUrl }]);
      } else if (file.type === 'application/pdf') {
        try {
          toast({ title: t('Reading PDF...', 'Membaca PDF...') });
          const extracted = await extractPdfText(file);
          if (!extracted || extracted.length < 10) {
            toast({ title: t('No text found in PDF (try uploading as image)', 'Tiada teks dalam PDF (cuba muat naik sebagai imej)'), variant: 'destructive' });
            continue;
          }
          setPdfFiles((prev) => [...prev, file.name]);
          setText((prev) => (prev ? prev + '\n\n' : '') + `[${file.name}]\n${extracted}`);
        } catch (e) {
          console.error('PDF parse error', e);
          toast({ title: t('Could not read PDF', 'Gagal membaca PDF'), variant: 'destructive' });
        }
      } else if (file.type.startsWith('text/')) {
        const txt = await file.text();
        setText((prev) => (prev ? prev + '\n\n' : '') + txt);
      } else {
        toast({ title: t('Unsupported file type', 'Jenis fail tidak disokong'), variant: 'destructive' });
      }
    }
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('notes_history')
      .select('id, title, summary, key_points, flashcards, quiz, source_text, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setHistory(data as unknown as HistoryEntry[]);
    }
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const deriveTitle = (src: string, summary: string): string => {
    const base = (src || summary || '').replace(/\s+/g, ' ').trim();
    if (!base) return language === 'en' ? 'Untitled notes' : 'Nota tanpa tajuk';
    return base.slice(0, 60) + (base.length > 60 ? '…' : '');
  };

  const handleProcess = async () => {
    if (!user) return;
    if (!text.trim() && images.length === 0) {
      toast({ title: t('Add text or upload at least one file', 'Tambah teks atau muat naik sekurang-kurangnya satu fail'), variant: 'destructive' });
      return;
    }
    setProcessing(true);
    setResult(null);
    setFlipped({});
    setRevealed({});
    try {
      const { data, error } = await supabase.functions.invoke('process-notes', {
        body: {
          text: text.trim() || undefined,
          images: images.map((i) => i.dataUrl),
          language,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const processed = data as ProcessedNotes;
      setResult(processed);

      // Persist to history (best-effort)
      const title = deriveTitle(text, processed.summary || '');
      const { error: insertErr } = await supabase.from('notes_history').insert([{
        user_id: user.id,
        title,
        source_text: text.trim() || null,
        summary: processed.summary || '',
        key_points: processed.keyPoints || [],
        flashcards: processed.flashcards || [],
        quiz: processed.quiz || [],
      }]);
      if (insertErr) console.error('Save history error:', insertErr);
      else loadHistory();

      toast({ title: t('Notes processed & saved!', 'Nota diproses & disimpan!') });
    } catch (err: any) {
      console.error(err);
      toast({ title: err?.message || t('Failed to process notes', 'Gagal memproses nota'), variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const openFromHistory = (entry: HistoryEntry) => {
    setResult({
      summary: entry.summary,
      keyPoints: entry.key_points || [],
      flashcards: entry.flashcards || [],
      quiz: entry.quiz || [],
    });
    setFlipped({});
    setRevealed({});
    setText(entry.source_text || '');
    setImages([]);
    setPdfFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = history;
    setHistory((h) => h.filter((x) => x.id !== id));
    const { error } = await supabase.from('notes_history').delete().eq('id', id);
    if (error) {
      setHistory(prev);
      toast({ title: t('Failed to delete', 'Gagal memadam'), variant: 'destructive' });
    }
  };

  const reset = () => {
    setText(''); setImages([]); setPdfFiles([]); setResult(null);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Notebook className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-2xl">
            {t('Upload Notes', 'Muat Naik Nota')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('Get a summary, key points, flashcards & quiz from any notes', 'Dapatkan ringkasan, poin penting, kad imbas & kuiz daripada nota')}
          </p>
        </div>
      </div>

      {/* Upload card */}
      <div className="glass rounded-2xl p-5 sm:p-6 space-y-5 glow-border">
        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/*,.txt,.md"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">{t('Click or drop files here', 'Klik atau lepas fail di sini')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t(`Images, PDFs or text · max ${MAX_FILE_MB}MB`, `Imej, PDF atau teks · maks ${MAX_FILE_MB}MB`)}
          </p>
        </div>

        {/* Attachments preview */}
        {(images.length > 0 || pdfFiles.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img.dataUrl} alt={img.name} className="h-20 w-20 object-cover rounded-lg border border-border" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {pdfFiles.map((name, i) => (
              <div key={i} className="flex items-center gap-2 px-3 h-10 rounded-lg bg-muted text-xs font-medium">
                <FileType className="h-4 w-4 text-primary" />
                <span className="max-w-[140px] truncate">{name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('Or paste/type your notes', 'Atau tampal/taip nota anda')}
          </Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('Paste any study material here...', 'Tampal sebarang bahan belajar di sini...')}
            className="rounded-xl bg-muted/50 min-h-[140px]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleProcess}
            disabled={processing || (!text.trim() && images.length === 0)}
            className="flex-1 h-12 rounded-full font-semibold gap-2"
          >
            {processing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {t('Processing...', 'Memproses...')}</>
            ) : (
              <><Sparkles className="h-5 w-5" /> {t('Process Notes', 'Proses Nota')}</>
            )}
          </Button>
          {(result || text || images.length > 0) && (
            <Button variant="outline" onClick={reset} className="h-12 rounded-full" disabled={processing}>
              {t('Reset', 'Set Semula')}
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 animate-fade-in">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid grid-cols-4 w-full rounded-full h-11 p-1">
              <TabsTrigger value="summary" className="rounded-full text-xs sm:text-sm gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('Summary', 'Ringkasan')}</span>
              </TabsTrigger>
              <TabsTrigger value="key" className="rounded-full text-xs sm:text-sm gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('Key Points', 'Poin')}</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="rounded-full text-xs sm:text-sm gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('Flashcards', 'Kad')}</span>
              </TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-full text-xs sm:text-sm gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('Quiz', 'Kuiz')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-5">
              <div className="glass rounded-2xl p-5 sm:p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{result.summary || ''}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="key" className="mt-5">
              <div className="glass rounded-2xl p-5 sm:p-6">
                <ul className="space-y-3">
                  {result.keyPoints?.map((kp, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="cards" className="mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.flashcards?.map((c, i) => {
                  const isFlipped = !!flipped[i];
                  const diffColor = c.difficulty === 'hard' ? 'text-destructive' : c.difficulty === 'medium' ? 'text-orange-500' : 'text-[hsl(var(--success))]';
                  return (
                    <div
                      key={i}
                      onClick={() => setFlipped((p) => ({ ...p, [i]: !p[i] }))}
                      className="glass rounded-2xl p-5 cursor-pointer min-h-[160px] flex flex-col justify-center hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.25)] transition-all"
                    >
                      <span className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${diffColor}`}>
                        {c.difficulty}
                      </span>
                      {!isFlipped ? (
                        <p className="font-semibold text-sm leading-relaxed">{c.front}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">{c.back}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-3">
                        {t('Tap to flip', 'Ketik untuk balik')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="mt-5">
              <div className="space-y-4">
                {result.quiz?.map((q, i) => {
                  const isRevealed = !!revealed[i];
                  return (
                    <div key={i} className="glass rounded-2xl p-5">
                      <p className="font-semibold text-sm mb-3">
                        <span className="text-primary mr-2">{i + 1}.</span>
                        {q.question}
                      </p>
                      {q.options && (
                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, j) => {
                            const isCorrect = isRevealed && opt === q.correct_answer;
                            return (
                              <div
                                key={j}
                                className={`px-3 py-2 rounded-lg text-sm border ${
                                  isCorrect
                                    ? 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 font-medium'
                                    : 'border-border bg-muted/40'
                                }`}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevealed((p) => ({ ...p, [i]: !p[i] }))}
                        className="rounded-full text-xs h-8"
                      >
                        {isRevealed ? t('Hide answer', 'Sembunyi jawapan') : t('Show answer', 'Tunjuk jawapan')}
                      </Button>
                      {isRevealed && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          <strong className="text-foreground">{t('Explanation:', 'Penerangan:')}</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Notes;
