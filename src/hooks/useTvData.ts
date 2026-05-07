import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Configuracoes {
  youtube_link: string;
  texto_aviso: string;
}

export interface InstagramLink {
  id: string;
  url: string;
  ordem: number;
}

export function useTvData() {
  const [config, setConfig] = useState<Configuracoes>({
    youtube_link: '',
    texto_aviso: 'Aguardando configurações...',
  });
  const [instagramLinks, setInstagramLinks] = useState<InstagramLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch Config
      const { data: configData, error: configError } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (configError) {
        console.error('Erro ao buscar configurações:', configError);
      } else if (configData) {
        setConfig(configData);
      }

      // Fetch Instagram Links
      const { data: instaData, error: instaError } = await supabase
        .from('instagram_links')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (instaError) {
        console.error('Erro ao buscar links:', instaError);
      } else if (instaData) {
        setInstagramLinks(instaData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchData();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('public:changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracoes',
        },
        (payload) => {
          console.log('Configuração atualizada:', payload);
          if (payload.new) {
            setConfig(payload.new as Configuracoes);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instagram_links',
        },
        (payload) => {
          console.log('Links do Instagram atualizados:', payload);
          // Refetch para garantir ordem correta
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { config, instagramLinks, loading };
}
