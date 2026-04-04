import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, MessageCircle, Brain, History, LogOut } from 'lucide-react';

const NavBar = () => {
  const { signOut, profile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();

  const links = [
    { path: '/', icon: Home, label: t('dashboard') },
    { path: '/chat', icon: MessageCircle, label: t('chat') },
    { path: '/quiz', icon: Brain, label: t('quiz') },
    { path: '/history', icon: History, label: t('history') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-extrabold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:inline">
            FokusZone
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}>
              <Button
                variant={isActive(path) ? 'default' : 'ghost'}
                size="sm"
                className={`rounded-full gap-1.5 ${isActive(path) ? '' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
            className="rounded-full text-xs"
          >
            {language === 'en' ? '🇲🇾 BM' : '🇬🇧 EN'}
          </Button>
          {profile && (
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {profile.display_name || '👋'}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
