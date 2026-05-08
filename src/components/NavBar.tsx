import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, MessageCircle, Brain, History, Settings, LogOut, Menu, X, Zap, FileText, Notebook, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';
import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const NavBar = () => {
  const { signOut, profile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { path: '/', icon: Home, label: t('dashboard') },
    { path: '/chat', icon: MessageCircle, label: t('chat') },
    { path: '/quiz', icon: Brain, label: t('quiz') },
    { path: '/notes', icon: Notebook, label: language === 'en' ? 'Notes' : 'Nota' },
    { path: '/flashcards', icon: Zap, label: language === 'en' ? 'Cards' : 'Kad' },
    { path: '/summary', icon: FileText, label: language === 'en' ? 'Summary' : 'Ringkasan' },
    { path: '/history', icon: History, label: t('history') },
    { path: '/settings', icon: Settings, label: language === 'en' ? 'Settings' : 'Tetapan' },
    ...(isAdmin ? [{ path: '/admin/subjects', icon: ShieldCheck, label: language === 'en' ? 'Admin' : 'Admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
            <img src={logo} alt="FokusZone" className="h-8 w-8 rounded-md" />
            <span className="font-bold text-base tracking-tight hidden sm:inline">FokusZone</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-full gap-1.5 h-9 text-sm font-medium ${
                    isActive(path) ? '' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
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
              className="rounded-full text-xs h-9 px-3"
            >
              {language === 'en' ? 'BM' : 'EN'}
            </Button>
            {profile && (
              <div className="hidden sm:flex items-center gap-2 px-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground font-medium max-w-[100px] truncate">{profile.display_name}</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden rounded-full h-9 w-9"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 p-3 space-y-1 animate-fade-in">
            {links.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isActive(path) ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3 rounded-xl h-12 font-medium text-base"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {links.slice(0, 5).map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] ${
                isActive(path) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default NavBar;
