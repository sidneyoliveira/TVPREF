-- Execute este código no painel SQL Editor do Supabase para criar as tabelas necessárias

-- 1. Criar a tabela de configurações gerais (ex: link do YouTube ao vivo, textos)
CREATE TABLE IF NOT EXISTS configuracoes (
  id integer PRIMARY KEY DEFAULT 1,
  youtube_link text,
  texto_aviso text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir a configuração inicial (se ainda não existir)
INSERT INTO configuracoes (id, youtube_link, texto_aviso) 
VALUES (1, 'https://www.youtube.com/watch?v=1bcCHFOIi_Q', 'Bem-vindo à Prefeitura Municipal de Itarema.')
ON CONFLICT (id) DO NOTHING;

-- 2. Criar a tabela para a fila de vídeos/posts do Instagram
CREATE TABLE IF NOT EXISTS instagram_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir alguns links de exemplo (se ainda não existirem)
INSERT INTO instagram_links (url, ordem) 
VALUES ('https://www.instagram.com/prefeituradeitarema/', 1)
ON CONFLICT DO NOTHING;

-- 3. Habilitar o Realtime nas tabelas para que a TV atualize automaticamente
-- (Comentado: as tabelas já estão adicionadas à publicação supabase_realtime)
-- alter publication supabase_realtime add table configuracoes;
-- alter publication supabase_realtime add table instagram_links;

-- 4. Criar políticas de segurança (RLS) para permitir leitura pública, já que a TV apenas lê os dados.
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_links ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública" ON configuracoes;
DROP POLICY IF EXISTS "Permitir leitura pública" ON instagram_links;

-- Políticas para configuracoes
CREATE POLICY "Permitir leitura pública" ON configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir modificação para usuários autenticados" ON configuracoes 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir atualização para usuários autenticados" ON configuracoes 
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir deleção para usuários autenticados" ON configuracoes 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para instagram_links
CREATE POLICY "Permitir leitura pública" ON instagram_links FOR SELECT USING (true);
CREATE POLICY "Permitir modificação para usuários autenticados" ON instagram_links 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir atualização para usuários autenticados" ON instagram_links 
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir deleção para usuários autenticados" ON instagram_links 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- (O painel de administração usará autenticação para as edições)
