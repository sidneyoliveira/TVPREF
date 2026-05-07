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
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (configData) {
        setConfig(configData);
      }

      // Fetch Instagram Links
      const { data: instaData } = await supabase
        .from('instagram_links')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (instaData) {
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

    // Subscribe to realtime changes for configuracoes
    const configSubscription = supabase
      .channel('configuracoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, (payload) => {
        console.log('Config updated:', payload);
        setConfig(payload.new as Configuracoes);
      })
      .subscribe();

    // Subscribe to realtime changes for instagram_links
    const instaSubscription = supabase
      .channel('instagram-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instagram_links' }, () => {
        // Refetch instagram links when they change
        fetchData();
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      configSubscription.unsubscribe();
      instaSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchData();

    // Listen to changes in the 'configuracoes' table
    const configSubscription = supabase
      .channel('config-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, (payload) => {
        console.log('Nova configuração recebida:', payload);
        fetchData();
      })
      .subscribe();

    // Listen to changes in the 'instagram_links' table
    const instagramSubscription = supabase
      .channel('insta-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instagram_links' }, (payload) => {
        console.log('Novo link de instagram recebido:', payload);
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(configSubscription);
      supabase.removeChannel(instagramSubscription);
    };
  }, []);

  return { config, instagramLinks, loading };
}
