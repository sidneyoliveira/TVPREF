-- Execute este código no painel SQL Editor do Supabase para adicionar as novas colunas
-- de cor ao aviso personalizado (Letreiro de Rodapé).

ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS aviso_bg_color text DEFAULT '#111111';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS aviso_text_color text DEFAULT '#ffffff';