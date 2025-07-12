import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

// Synchronous prayer status manager for instant button responses
export function usePrayerStatusSync() {
  const { isAuthenticated } = useAuth();
  const [prayerStatusCache, setPrayerStatusCache] = useState<Record<number, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Preload all prayer statuses into sync cache
  useEffect(() => {
    if (!isAuthenticated) return;

    // Immediately set all cards to false for instant rendering
    const initializeCache = async () => {
      try {
        // Get all prayer cards first
        const cardsResponse = await fetch('/api/prayer-cards');
        if (!cardsResponse.ok) return;
        
        const cards = await cardsResponse.json();
        const cardIds = cards.map((card: any) => card.id);
        
        // Set initial state to false for all cards (instant rendering)
        const initialCache: Record<number, boolean> = {};
        cardIds.forEach((id: number) => {
          initialCache[id] = false;
        });
        setPrayerStatusCache(initialCache);
        setIsInitialized(true);
        
        // Then update with real data in background
        if (cardIds.length > 0) {
          const statusResponse = await fetch('/api/prayer-cards/batch-prayed-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardIds })
          });
          
          if (statusResponse.ok) {
            const realStatus = await statusResponse.json();
            setPrayerStatusCache(realStatus);
          }
        }
      } catch (error) {
        console.error('Failed to initialize prayer status cache:', error);
        setIsInitialized(true); // Still mark as initialized to prevent infinite loading
      }
    };

    initializeCache();
  }, [isAuthenticated]);

  const updatePrayerStatus = (prayerCardId: number, status: boolean) => {
    setPrayerStatusCache(prev => ({
      ...prev,
      [prayerCardId]: status
    }));
  };

  return {
    getPrayerStatus: (prayerCardId: number) => prayerStatusCache[prayerCardId] || false,
    updatePrayerStatus,
    isInitialized,
    prayerStatusCache
  };
}