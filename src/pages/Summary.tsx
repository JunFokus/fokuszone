import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Copy, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';

const Summary = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [text, setText] = useState('');
  const [format, setFormat] = useState('bullets');
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!user || !text.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-notes', {
        body: { text, language, format },
      });
      if (error) throw error;
      setSummary(data.summary || '');
    } catch (err: any) {
      console.error(err);
      toast({ title: language === 'en' ? 'Failed to generate summary' : 'Gagal menjana ringkasan', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl pb-24 lg:pb-8">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-bold tracking-tight">
          {language === 'en' ? 'AI Study Summary' : 'Ringkasan Belajar AI'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'en' ? 'Paste your notes or textbook content' : 'Tampal nota atau kandungan buku teks anda'}
            </Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={language === 'en' ? 'Paste long notes, textbook paragraphs, or any study material here...' : 'Tampal nota panjang, perenggan buku teks, atau apa-apa bahan belajar di sini...'}
              className="rounded-xl bg-muted/50 min-h-[250px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{language === 'en' ? 'Summary Format' : 'Format Ringkasan'}</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="rounded-xl bg-muted/50 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bullets">{language === 'en' ? 'Bullet Points' : 'Titik Penting'}</SelectItem>
                <SelectItem value="outline">{language === 'en' ? 'Structured Outline' : 'Rangka Berstruktur'}</SelectItem>
                <SelectItem value="paragraph">{language === 'en' ? 'Brief Paragraph' : 'Perenggan Ringkas'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || text.trim().length < 10}
            className="w-full h-12 rounded-full font-semibold gap-2"
          >
            {generating ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {language === 'en' ? 'Summarizing...' : 'Meringkaskan...'}</>
            ) : (
              <><Sparkles className="h-5 w-5" /> {language === 'en' ? 'Generate Summary' : 'Jana Ringkasan'}</>
            )}
          </Button>
        </div>

        {/* Output */}
        <div>
          {summary ? (
            <div className="glass rounded-2xl p-5 glow-border animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{language === 'en' ? 'Summary' : 'Ringkasan'}</h3>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="rounded-full h-8 gap-1.5 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? (language === 'en' ? 'Copied' : 'Disalin') : (language === 'en' ? 'Copy' : 'Salin')}
                </Button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[250px]">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                {language === 'en'
                  ? 'Paste your study material and get a concise, exam-ready summary instantly.'
                  : 'Tampal bahan belajar anda dan dapatkan ringkasan padat sedia peperiksaan secara segera.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;
