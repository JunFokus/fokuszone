import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { User, Palette, BookOpen, Shield, BarChart3, Save } from 'lucide-react';

type Tab = 'account' | 'appearance' | 'study' | 'security' | 'progress';

const Settings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [formLevel, setFormLevel] = useState(String(profile?.form_level || 1));
  const [saving, setSaving] = useState(false);

  const tabs: { id: Tab; icon: typeof User; label: string }[] = [
    { id: 'account', icon: User, label: language === 'en' ? 'Account' : 'Akaun' },
    { id: 'appearance', icon: Palette, label: language === 'en' ? 'Appearance' : 'Penampilan' },
    { id: 'study', icon: BookOpen, label: language === 'en' ? 'Study Preferences' : 'Keutamaan Belajar' },
    { id: 'security', icon: Shield, label: language === 'en' ? 'Security' : 'Keselamatan' },
    { id: 'progress', icon: BarChart3, label: language === 'en' ? 'Progress' : 'Kemajuan' },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName, form_level: parseInt(formLevel) });
      toast({ title: language === 'en' ? 'Profile updated!' : 'Profil dikemaskini!' });
    } catch {
      toast({ title: language === 'en' ? 'Error' : 'Ralat', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-20 md:pb-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {language === 'en' ? 'Settings' : 'Tetapan'}
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Nav */}
        <div className="md:w-56 flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass rounded-2xl p-6">
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold">{language === 'en' ? 'Account Settings' : 'Tetapan Akaun'}</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{displayName || 'Student'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{language === 'en' ? 'Display Name' : 'Nama Paparan'}</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10 rounded-xl bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{language === 'en' ? 'Form Level' : 'Tingkatan'}</Label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(l => (
                        <SelectItem key={l} value={String(l)}>
                          {language === 'en' ? `Form ${l}` : `Tingkatan ${l}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{language === 'en' ? 'Email' : 'E-mel'}</Label>
                  <Input value={user?.email || ''} disabled className="h-10 rounded-xl bg-muted/50 opacity-60" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="rounded-full gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? '...' : language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold">{language === 'en' ? 'Appearance' : 'Penampilan'}</h2>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{language === 'en' ? 'Theme' : 'Tema'}</p>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Toggle light/dark mode' : 'Tukar mod terang/gelap'}</p>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{language === 'en' ? 'Language' : 'Bahasa'}</p>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'English / Bahasa Melayu' : 'Bahasa Inggeris / Bahasa Melayu'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
                    className="rounded-full text-xs"
                  >
                    {language === 'en' ? 'BM' : 'EN'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'study' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold">{language === 'en' ? 'Study Preferences' : 'Keutamaan Belajar'}</h2>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Customize your study experience. More options coming soon!' : 'Sesuaikan pengalaman belajar anda. Lebih banyak pilihan akan datang!'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['Mathematics', 'Science', 'Bahasa Melayu', 'English', 'Sejarah', 'Geography'].map(subj => (
                  <div key={subj} className="p-3 rounded-xl bg-muted/50 text-sm font-medium flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {subj}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold">{language === 'en' ? 'Security' : 'Keselamatan'}</h2>
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <p className="font-medium text-sm">{language === 'en' ? 'Password' : 'Kata Laluan'}</p>
                <p className="text-xs text-muted-foreground">{language === 'en' ? 'Use the forgot password option on the login page to reset your password.' : 'Gunakan pilihan lupa kata laluan di halaman log masuk untuk menetapkan semula kata laluan anda.'}</p>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold">{language === 'en' ? 'Progress Data' : 'Data Kemajuan'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">{chatCount || 0}</p>
                  <p className="text-xs text-muted-foreground">{language === 'en' ? 'Total Chats' : 'Jumlah Perbualan'}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">{profile?.form_level || 1}</p>
                  <p className="text-xs text-muted-foreground">{language === 'en' ? 'Form Level' : 'Tingkatan'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Need chatCount in progress tab - quick local state
const SettingsWrapper = () => {
  return <Settings />;
};

export default Settings;
