import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Configuracoes {
  id?: number;
  youtube_link: string;
  texto_aviso: string;
  display_mode: 'youtube' | 'image' | 'announcement' | 'carousel' | 'split';
  image_url?: string;
  announcement_title?: string;
  announcement_text?: string;
  updated_at?: string;
}

export interface InstagramLink {
  id: string;
  url: string;
  ordem: number;
}

export interface CarouselImage {
  id: string;
  imagem_url: string;
  titulo?: string;
  descricao?: string;
  ordem: number;
}

export function useTvData() {
  const [config, setConfig] = useState<Configuracoes>({
    youtube_link: '',
    texto_aviso: 'Aguardando configurações...',
    display_mode: 'youtube',
  });
  const [instagramLinks, setInstagramLinks] = useState<InstagramLink[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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

      // Fetch Carousel Images
      const { data: carouselData, error: carouselError } = await supabase
        .from('carousel_images')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (carouselError) {
        console.error('Erro ao buscar carrossel:', carouselError);
      } else if (carouselData) {
        setCarouselImages(carouselData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetchData();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('public:all-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracoes',
        },
        (payload) => {
          console.log('Configuração atualizada via realtime:', payload);
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
        () => {
          console.log('Instagram links atualizados');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carousel_images',
        },
        () => {
          console.log('Carousel images atualizadas');
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchData]);

  return { config, instagramLinks, carouselImages, loading, refetch: fetchData };
}
