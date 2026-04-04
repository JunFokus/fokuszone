import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';
import { ArrowLeft } from 'lucide-react';

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formLevel, setFormLevel] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <img src={logo} alt="Loading" className="h-12 w-12 animate-pulse" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name, parseInt(formLevel));
        toast({
          title: language === 'en' ? 'Account created!' : 'Akaun dicipta!',
          description: language === 'en' ? 'Welcome to FokusZone!' : 'Selamat datang ke FokusZone!',
        });
      }
    } catch (err: any) {
      toast({
        title: language === 'en' ? 'Error' : 'Ralat',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="rounded-full gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            {language === 'en' ? 'Home' : 'Laman Utama'}
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
          className="rounded-full text-xs"
        >
          {language === 'en' ? 'BM' : 'EN'}
        </Button>
      </div>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="glass rounded-2xl p-8 glow-border">
          <div className="text-center space-y-3 mb-6">
            <div className="flex justify-center">
              <img src={logo} alt="FokusZone" className="h-14 w-14 rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">FokusZone</h1>
            <p className="text-muted-foreground text-xs">{t('heroSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">{t('name')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmad / Sarah" required={!isLogin} className="h-10 rounded-xl bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="formLevel" className="text-xs font-medium">{t('formLevel')}</Label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          {language === 'en' ? `Form ${level}` : `Tingkatan ${level}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">{t('email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" required className="h-10 rounded-xl bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">{t('password')}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10 rounded-xl bg-muted/50 border-border/50" />
            </div>
            <Button type="submit" className="w-full rounded-full h-11 font-semibold" disabled={submitting}>
              {submitting ? '...' : isLogin ? t('login') : t('createAccount')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline text-xs font-medium">
              {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
