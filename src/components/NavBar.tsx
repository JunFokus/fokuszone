import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, MessageCircle, Brain, History, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';

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
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="FokusZone" className="h-8 w-8 rounded-md" />
          <span className="font-extrabold text-lg text-foreground hidden sm:inline">
            FokusZone
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          {links.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}>
              <Button
                variant={isActive(path) ? 'default' : 'ghost'}
                size="sm"
                className="rounded-full gap-1.5 h-8 text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{label}</span>
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
            className="rounded-full text-xs h-8 px-2"
          >
            {language === 'en' ? 'BM' : 'EN'}
          </Button>
          {profile && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {profile.display_name}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full h-8 w-8">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
