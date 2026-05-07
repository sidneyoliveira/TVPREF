-- Atualizar o schema para suportar múltiplos modos de exibição

-- 1. Criar enum para tipos de modo
CREATE TYPE display_mode_type AS ENUM ('youtube', 'image', 'announcement', 'carousel', 'split');

-- 2. Atualizar tabela configuracoes com novo schema
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS display_mode display_mode_type DEFAULT 'youtube';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS announcement_title text;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS announcement_text text;

-- 3. Criar tabela para imagens do carrossel
CREATE TABLE IF NOT EXISTS carousel_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  imagem_url text NOT NULL,
  titulo text,
  descricao text,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Atualizar RLS para nova tabela
ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública" ON carousel_images FOR SELECT USING (true);
CREATE POLICY "Permitir modificação para usuários autenticados" ON carousel_images 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir atualização para usuários autenticados" ON carousel_images 
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir deleção para usuários autenticados" ON carousel_images 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 5. Adicionar à publicação de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE carousel_images;
ALTER TABLE carousel_images REPLICA IDENTITY FULL;
