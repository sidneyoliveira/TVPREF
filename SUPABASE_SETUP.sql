-- Execute este código no painel SQL Editor do Supabase para criar as tabelas necessárias

-- 1. Criar a tabela de configurações gerais (ex: link do YouTube ao vivo, textos)
CREATE TABLE configuracoes (
  id integer PRIMARY KEY DEFAULT 1,
  youtube_link text,
  texto_aviso text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir a configuração inicial
INSERT INTO configuracoes (id, youtube_link, texto_aviso) 
VALUES (1, 'https://www.youtube.com/watch?v=5qap5aO4i9A', 'Bem-vindo à Prefeitura Municipal de Itarema.');

-- 2. Criar a tabela para a fila de vídeos/posts do Instagram
CREATE TABLE instagram_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir alguns links de exemplo
INSERT INTO instagram_links (url, ordem) VALUES ('https://www.instagram.com/p/exemplo1/', 1);

-- 3. Habilitar o Realtime nas tabelas para que a TV atualize automaticamente
alter publication supabase_realtime add table configuracoes;
alter publication supabase_realtime add table instagram_links;

-- 4. Criar políticas de segurança (RLS) para permitir leitura pública, já que a TV apenas lê os dados.
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública" ON configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON instagram_links FOR SELECT USING (true);

-- (O painel de administração usará uma API route ou chave secreta para as edições)
