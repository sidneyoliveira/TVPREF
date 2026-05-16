-- SUPABASE_SCHEMA_V6.sql
-- 1) Adicionar novos campos para agendamento de avisos, TTS e imagem.

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS tts_enabled boolean DEFAULT false;

-- Nota: Como display_mode_type é um ENUM, não podemos remover facilmente os valores antigos ('image', 'split')
-- sem recriar o tipo, o que seria destrutivo. Em vez disso, a lógica de aplicação não permitirá
-- mais selecionar esses valores, e se encontrados, usará um fallback.
