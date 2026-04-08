import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';
import { Brain, MessageCircle, BookOpen, Target, Zap, Shield, ArrowRight, Sparkles, BarChart3, Clock } from 'lucide-react';

const Landing = () => {
  const { language, setLanguage } = useLanguage();

  const features = [
    { icon: MessageCircle, title: language === 'en' ? 'AI Mentor Chat' : 'Chat Mentor AI', desc: language === 'en' ? 'Get instant help from your personal AI study companion' : 'Dapatkan bantuan segera daripada teman belajar AI anda' },
    { icon: Brain, title: language === 'en' ? 'Smart Quizzes' : 'Kuiz Pintar', desc: language === 'en' ? 'AI-generated quizzes tailored to your curriculum' : 'Kuiz dijana AI disesuaikan dengan kurikulum anda' },
    { icon: BookOpen, title: language === 'en' ? 'Study Notes' : 'Nota Belajar', desc: language === 'en' ? 'Auto-generated study notes from any topic' : 'Nota belajar dijana automatik dari sebarang topik' },
    { icon: Target, title: language === 'en' ? 'Focus Tools' : 'Alat Fokus', desc: language === 'en' ? 'Pomodoro timer and study streak tracking' : 'Pemasa Pomodoro dan penjejakan strik belajar' },
    { icon: Zap, title: language === 'en' ? 'Flashcards' : 'Kad Imbas', desc: language === 'en' ? 'Create and review flashcards with spaced repetition' : 'Cipta dan ulangkaji kad imbas dengan pengulangan berjarak' },
    { icon: Shield, title: language === 'en' ? 'Malaysian Curriculum' : 'Kurikulum Malaysia', desc: language === 'en' ? 'Aligned with KSSM/KBSM for Forms 1-5' : 'Selaras dengan KSSM/KBSM untuk Tingkatan 1-5' },
  ];

  const previewTabs = [
    { label: language === 'en' ? 'Study Guide' : 'Panduan Belajar', active: true },
    { label: language === 'en' ? 'Quiz' : 'Kuiz', active: false },
    { label: language === 'en' ? 'Flashcards' : 'Kad Imbas', active: false },
    { label: language === 'en' ? 'AI Mentor' : 'Mentor AI', active: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="FokusZone" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-lg tracking-tight">FokusZone</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{language === 'en' ? 'Features' : 'Ciri-ciri'}</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{language === 'en' ? 'Tools' : 'Alat'}</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{language === 'en' ? 'Resources' : 'Sumber'}</a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
              className="text-xs h-8 px-3 rounded-full"
            >
              {language === 'en' ? 'BM' : 'EN'}
            </Button>
            <Link to="/auth">
              <Button size="sm" className="rounded-full px-5 h-9 font-semibold">
                {language === 'en' ? 'Start Now' : 'Mula Sekarang'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-lg">
              <Sparkles className="h-4 w-4" />
              {language === 'en' ? 'AI-Powered Learning Platform' : 'Platform Pembelajaran Dikuasakan AI'}
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1]">
              <span className="text-gradient text-8xl">FokusZone</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg">
              {language === 'en'
                ? 'Study smarter with AI-powered notes, flashcards, quizzes, mock exams, focus tools, and an intelligent AI mentor — all in one place.'
                : 'Belajar dengan lebih bijak menggunakan nota, kad imbas, kuiz, peperiksaan percubaan, alat fokus berkuasa AI, dan mentor AI pintar — semua di satu tempat.'}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="rounded-full px-8 h-12 font-semibold text-base gap-2">
                  {language === 'en' ? 'Get Started Free' : 'Mula Percuma'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 font-semibold text-base">
                  {language === 'en' ? 'Explore Features' : 'Terokai Ciri-ciri'}
                </Button>
              </a>
            </div>
          </div>

          {/* Right - Preview Card */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="glass rounded-2xl p-6 glow-border">
              {/* Tabs */}
              <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                {previewTabs.map((tab) => (
                  <button
                    key={tab.label}
                    className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      tab.active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mock Content */}
              <div className="space-y-4">
                {/* Subject Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '🧪', name: language === 'en' ? 'Science' : 'Sains', progress: 72 },
                    { icon: '📐', name: language === 'en' ? 'Mathematics' : 'Matematik', progress: 85 },
                    { icon: '📖', name: 'Bahasa Melayu', progress: 60 },
                    { icon: '🌍', name: language === 'en' ? 'History' : 'Sejarah', progress: 45 },
                  ].map((s) => (
                    <div key={s.name} className="p-3 rounded-xl bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-xs font-medium truncate">{s.name}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{s.progress}%</span>
                    </div>
                  ))}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">7 {language === 'en' ? 'Day Streak' : 'Hari Strik'}</p>
                      <p className="text-[10px] text-muted-foreground">{language === 'en' ? 'Keep it up!' : 'Teruskan!'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">82%</p>
                      <p className="text-[10px] text-muted-foreground">{language === 'en' ? 'Avg Score' : 'Skor Purata'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {language === 'en' ? 'Everything you need to excel' : 'Semua yang anda perlukan untuk cemerlang'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {language === 'en'
              ? 'Powerful AI tools designed specifically for Malaysian students'
              : 'Alat AI berkuasa direka khas untuk pelajar Malaysia'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 glass-hover group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass rounded-3xl p-12 text-center glow-border">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {language === 'en' ? 'Ready to study smarter?' : 'Sedia untuk belajar dengan lebih bijak?'}
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            {language === 'en'
              ? 'Join thousands of Malaysian students using FokusZone to ace their exams.'
              : 'Sertai ribuan pelajar Malaysia yang menggunakan FokusZone untuk cemerlang dalam peperiksaan.'}
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full px-10 h-12 font-semibold text-base gap-2">
              {language === 'en' ? 'Start Learning Now' : 'Mula Belajar Sekarang'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="FokusZone" className="h-6 w-6 rounded-md" />
            <span className="text-sm font-semibold">FokusZone</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FokusZone. {language === 'en' ? 'All rights reserved.' : 'Hak cipta terpelihara.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
