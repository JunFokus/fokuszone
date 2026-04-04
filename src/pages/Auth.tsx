import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';

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
        <img src={logo} alt="Loading" className="h-16 w-16 animate-pulse" />
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
          description: language === 'en' ? 'Welcome to FokusZone! 🎉' : 'Selamat datang ke FokusZone! 🎉',
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

      <Card className="w-full max-w-sm animate-bounce-in">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="flex justify-center">
            <img src={logo} alt="FokusZone" className="h-16 w-16 rounded-xl" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-foreground">
            FokusZone
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            {t('heroSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">{t('name')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmad / Sarah" required={!isLogin} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="formLevel" className="text-xs">{t('formLevel')}</Label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
              <Label htmlFor="email" className="text-xs">{t('email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">{t('password')}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-9" />
            </div>
            <Button type="submit" className="w-full rounded-full h-10 font-bold" disabled={submitting}>
              {submitting ? '...' : isLogin ? t('login') : t('createAccount')}
            </Button>
          </form>
          <div className="mt-3 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline text-xs font-medium">
              {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
