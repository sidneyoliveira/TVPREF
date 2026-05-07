-- Criação do Bucket de Armazenamento para as Imagens da TV

-- 1. Cria o bucket chamado "media" caso não exista
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Permite leitura pública dos arquivos
CREATE POLICY "Permitir leitura publica de midia" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

-- 3. Permite upload para usuários autenticados (usando o service_role / token do admin)
CREATE POLICY "Permitir upload para autenticados" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media');

-- 4. Permite que o admin delete imagens (opcional)
CREATE POLICY "Permitir delecao para autenticados" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media');
