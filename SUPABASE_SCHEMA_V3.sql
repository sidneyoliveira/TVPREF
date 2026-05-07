-- Execute este código no painel SQL Editor do Supabase para adicionar a coluna show_instagram
-- Isso permite exibir o painel do Instagram independente do modo principal.

ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS show_instagram boolean DEFAULT false;
