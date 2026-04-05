import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';
import { ArrowLeft } from 'lucide-react';

const Auth = () => {
  const { user, loading } = useAuth();
  const { signIn, signUp } = useAuth();
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

  const handleGoogleSignIn = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({
          title: language === 'en' ? 'Error' : 'Ralat',
          description: String(result.error),
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: language === 'en' ? 'Error' : 'Ralat',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6">
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
        <div className="glass rounded-2xl p-6 sm:p-8 glow-border">
          <div className="text-center space-y-3 mb-6">
            <div className="flex justify-center">
              <img src={logo} alt="FokusZone" className="h-14 w-14 rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">FokusZone</h1>
            <p className="text-muted-foreground text-sm">{t('heroSubtitle')}</p>
          </div>

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full rounded-xl h-11 font-medium gap-3 mb-4"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {language === 'en' ? 'Continue with Google' : 'Teruskan dengan Google'}
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t('or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">{t('name')}</Label>
                  <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmad / Sarah" required={!isLogin} className="h-11 rounded-xl bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="formLevel" className="text-xs font-medium">{t('formLevel')}</Label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
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
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" required className="h-11 rounded-xl bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">{t('password')}</Label>
              <Input id="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 rounded-xl bg-muted/50 border-border/50" />
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
