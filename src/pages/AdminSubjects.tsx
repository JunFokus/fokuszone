import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubjects } from '@/hooks/useSubjects';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, Check, X } from 'lucide-react';

const AdminSubjects = () => {
  const { language } = useLanguage();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { subjects, loading, refetch } = useSubjects();

  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState('0');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  if (roleLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const { error } = await supabase
      .from('subjects')
      .insert({ name, sort_order: parseInt(newOrder) || 0 });
    setAdding(false);
    if (error) {
      toast({ title: language === 'en' ? 'Error' : 'Ralat', description: error.message, variant: 'destructive' });
      return;
    }
    setNewName('');
    setNewOrder('0');
    refetch();
    toast({ title: language === 'en' ? 'Subject added' : 'Subjek ditambah' });
  };

  const startEdit = (id: string, name: string, sortOrder: number) => {
    setEditingId(id);
    setEditName(name);
    setEditOrder(String(sortOrder));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSave = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    const { error } = await supabase
      .from('subjects')
      .update({ name, sort_order: parseInt(editOrder) || 0 })
      .eq('id', id);
    setSaving(false);
    if (error) {
      toast({ title: language === 'en' ? 'Error' : 'Ralat', description: error.message, variant: 'destructive' });
      return;
    }
    cancelEdit();
    refetch();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(language === 'en' ? `Delete "${name}"?` : `Padam "${name}"?`)) return;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      toast({ title: language === 'en' ? 'Error' : 'Ralat', description: error.message, variant: 'destructive' });
      return;
    }
    refetch();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-xl sm:text-2xl">
            {language === 'en' ? 'Manage Subjects' : 'Urus Mata Pelajaran'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {language === 'en'
              ? 'Add, edit, or remove subjects shown in Flashcards & Quiz dropdowns.'
              : 'Tambah, edit, atau buang mata pelajaran dalam Kad Imbas & Kuiz.'}
          </p>
        </div>
      </div>

      {/* Add */}
      <div className="glass rounded-2xl p-5 mb-6 glow-border">
        <h2 className="font-semibold mb-4 text-sm">
          {language === 'en' ? 'Add subject' : 'Tambah subjek'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">{language === 'en' ? 'Name' : 'Nama'}</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Economics' : 'cth. Ekonomi'}
              className="h-11 rounded-xl bg-muted/50"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{language === 'en' ? 'Order' : 'Susunan'}</Label>
            <Input
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
              className="h-11 rounded-xl bg-muted/50 w-24"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="h-11 rounded-full gap-2"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {language === 'en' ? 'Add' : 'Tambah'}
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="glass rounded-2xl divide-y divide-border/50 overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {language === 'en' ? 'No subjects yet.' : 'Tiada subjek lagi.'}
          </div>
        ) : (
          subjects.map((s) => (
            <div key={s.id} className="p-4 flex items-center gap-3">
              {editingId === s.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 rounded-lg bg-muted/50 flex-1"
                    maxLength={80}
                  />
                  <Input
                    type="number"
                    value={editOrder}
                    onChange={(e) => setEditOrder(e.target.value)}
                    className="h-10 rounded-lg bg-muted/50 w-20"
                  />
                  <Button size="icon" variant="ghost" onClick={() => handleSave(s.id)} disabled={saving} className="rounded-full h-9 w-9 text-[hsl(var(--success))]">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEdit} className="rounded-full h-9 w-9">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'en' ? 'Order' : 'Susunan'}: {s.sort_order}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(s.id, s.name, s.sort_order)} className="rounded-full h-9 w-9">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id, s.name)} className="rounded-full h-9 w-9 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSubjects;
