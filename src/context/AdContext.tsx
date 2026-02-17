"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 광고 타입 정의
interface Ad {
  id: number;
  title: string;
  position: string;
  positionLabel: string;
  imageUrl: string; // DB 컬럼명: image_url
  link: string;
  status: "active" | "inactive";
  clicks: number;
}

// 컨텍스트 타입 정의
interface AdContextType {
  ads: Ad[];
  addAd: (ad: Omit<Ad, 'id' | 'clicks' | 'status'>) => Promise<void>;
  toggleAd: (id: number, currentStatus: string) => Promise<void>;
  deleteAd: (id: number) => Promise<void>;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [ads, setAds] = useState<Ad[]>([]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        const msg = String(error.message || error.details || '');
        if (msg.includes('aborted') || msg.includes('AbortError')) return;
        console.error('Error fetching ads:', error);
      } else if (data) {
        const formattedAds = data.map((ad: any) => ({
          ...ad,
          imageUrl: ad.image_url, 
          positionLabel: ad.position === 'main-hero' ? '메인 홈 > 상단' : '국가 상세 > 헤더 하단'
        }));
        setAds(formattedAds);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes?.('aborted')) return;
      console.error('Error fetching ads:', e);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const addAd = async (newAd: Omit<Ad, 'id' | 'clicks' | 'status'>) => {
    const { data, error } = await supabase
      .from('ads')
      .insert([{
        title: newAd.title,
        position: newAd.position,
        image_url: newAd.imageUrl,
        link: newAd.link,
        status: 'active',
        clicks: 0
      }])
      .select();

    if (error) {
      console.error('Error adding ad:', error);
      alert("광고 등록 실패! DB 테이블이 있는지 확인해주세요.");
    } else if (data) {
      // 로컬 상태 업데이트 (화면 즉시 반영)
      fetchAds(); 
    }
  };

  const toggleAd = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) console.error('Error toggling ad:', error);
    else {
      setAds(ads.map(ad => ad.id === id ? { ...ad, status: newStatus } : ad));
    }
  };

  const deleteAd = async (id: number) => {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting ad:', error);
    else {
      setAds(ads.filter(ad => ad.id !== id));
    }
  };

  return (
    <AdContext.Provider value={{ ads, addAd, toggleAd, deleteAd }}>
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdContext);
  if (!context) throw new Error("useAds must be used within an AdProvider");
  return context;
}
