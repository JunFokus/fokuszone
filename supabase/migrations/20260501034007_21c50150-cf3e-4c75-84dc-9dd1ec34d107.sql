CREATE TABLE public.notes_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled notes',
  source_text TEXT,
  summary TEXT NOT NULL DEFAULT '',
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes history"
ON public.notes_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes history"
ON public.notes_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes history"
ON public.notes_history FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_notes_history_user_created ON public.notes_history (user_id, created_at DESC);