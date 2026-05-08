import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  sort_order: number;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (!error && data) setSubjects(data as Subject[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, refetch: fetchSubjects };
};
