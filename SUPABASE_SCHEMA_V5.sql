-- Execute no SQL Editor do Supabase para habilitar:
-- 1) Múltiplos avisos em fila
-- 2) Cores gerais da tela da TV

ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS show_instagram boolean DEFAULT false;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS aviso_bg_color text DEFAULT '#123a70';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS aviso_text_color text DEFAULT '#ffffff';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS theme_primary_color text DEFAULT '#08244f';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS theme_secondary_color text DEFAULT '#04142e';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS theme_accent_color text DEFAULT '#2b7be4';

CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  bg_color text NOT NULL DEFAULT '#123a70',
  text_color text NOT NULL DEFAULT '#ffffff',
  ordem integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública" ON announcements;
DROP POLICY IF EXISTS "Permitir modificação para usuários autenticados" ON announcements;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON announcements;
DROP POLICY IF EXISTS "Permitir deleção para usuários autenticados" ON announcements;

CREATE POLICY "Permitir leitura pública" ON announcements FOR SELECT USING (true);
CREATE POLICY "Permitir modificação para usuários autenticados" ON announcements
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir atualização para usuários autenticados" ON announcements
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir deleção para usuários autenticados" ON announcements
  FOR DELETE USING (auth.uid() IS NOT NULL);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE announcements REPLICA IDENTITY FULL;
