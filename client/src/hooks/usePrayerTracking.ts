import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPrayerStats } from "@shared/schema";

export function usePrayerStats() {
  return useQuery({
    queryKey: ["/api/prayer-stats"],
    queryFn: async () => {
      const response = await fetch("/api/prayer-stats");
      if (!response.ok) {
        throw new Error('Failed to fetch prayer stats');
      }
      return response.json();
    },
    enabled: true,
  });
}

export function usePrayedToday(prayerCardId: number, isAuthenticated: boolean) {
  return useQuery({
    queryKey: [`/api/prayer-cards/${prayerCardId}/prayed-today`],
    queryFn: async () => {
      const response = await fetch(`/api/prayer-cards/${prayerCardId}/prayed-today`);
      if (!response.ok) {
        throw new Error('Failed to fetch prayer status');
      }
      return response.json();
    },
    enabled: !!prayerCardId && isAuthenticated,
  });
}

// Hook to get prayed status for multiple cards at once - ultra-optimized with instant loading
export function usePrayedStatusForCards(cardIds: number[], isAuthenticated: boolean) {
  return useQuery({
    queryKey: ['/api/prayer-cards/batch-prayed-status', cardIds.sort()], // Sort for consistent cache keys
    queryFn: async () => {
      if (!cardIds.length) return {};
      
      // Use optimized batch endpoint
      const response = await fetch('/api/prayer-cards/batch-prayed-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch batch prayer status');
      }
      
      return await response.json();
    },
    enabled: cardIds.length > 0 && isAuthenticated,
    staleTime: 60000, // Cache for 1 minute - longer cache time
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus for better performance
    refetchOnMount: false, // Don't refetch on mount if cached
    // Start with empty object as placeholder data so UI renders immediately  
    placeholderData: () => {
      const placeholder: Record<number, boolean> = {};
      cardIds.forEach(id => { placeholder[id] = false; });
      return placeholder;
    },
    // Ultra-aggressive performance settings
    networkMode: 'always', // Always try to fetch, don't wait for network
    retry: 1, // Reduce retry attempts for faster failure recovery
    retryDelay: 100, // Faster retry delays
  });
}

export function useMarkPrayed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (prayerCardId: number) => {
      const response = await fetch(`/api/prayer-cards/${prayerCardId}/pray`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    // Optimistic update for instant UI feedback
    onMutate: async (prayerCardId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/prayer-cards/batch-prayed-status'] });
      
      // Snapshot previous value
      const previousBatchData = queryClient.getQueriesData({ queryKey: ['/api/prayer-cards/batch-prayed-status'] });
      const previousStats = queryClient.getQueryData(["/api/prayer-stats"]);
      
      // Optimistically update batch status
      queryClient.setQueriesData({ queryKey: ['/api/prayer-cards/batch-prayed-status'] }, (old: any) => {
        if (!old) return old;
        return { ...old, [prayerCardId]: true };
      });
      
      // Optimistically update individual status
      queryClient.setQueryData([`/api/prayer-cards/${prayerCardId}/prayed-today`], { hasPrayedToday: true });
      
      return { previousBatchData, previousStats, prayerCardId };
    },
    onSuccess: (data, prayerCardId) => {
      // Update with real data from server
      queryClient.setQueryData(["/api/prayer-stats"], data.stats);
      queryClient.setQueryData([`/api/prayer-cards/${prayerCardId}/prayed-today`], { hasPrayedToday: true });
      
      // Ensure batch cache has real data
      queryClient.setQueriesData({ queryKey: ['/api/prayer-cards/batch-prayed-status'] }, (old: any) => {
        if (!old) return old;
        return { ...old, [prayerCardId]: true };
      });
      
      const stats = data.stats as UserPrayerStats;
      const isNewLevel = stats.totalPrayers % 7 === 1 && stats.totalPrayers > 1;
      
      if (isNewLevel) {
        toast({
          title: "Level Up!",
          description: `Congratulations! You've reached level ${stats.currentLevel}`,
        });
      }
    },
    onError: (error: Error, prayerCardId: number, context: any) => {
      // Revert optimistic updates on error
      if (context?.previousBatchData) {
        context.previousBatchData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["/api/prayer-stats"], context.previousStats);
      }
      queryClient.setQueryData([`/api/prayer-cards/${prayerCardId}/prayed-today`], { hasPrayedToday: false });
      
      console.error("Prayer marking error:", error);
      
      if (error.message.includes("Already prayed")) {
        toast({
          title: "Already Prayed",
          description: "You've already prayed for this card today",
          variant: "destructive",
        });
      } else if (error.message.includes("401")) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to log prayer. Please try again.",
          variant: "destructive",
        });
      }
    },
  });
}

export function useUndoPrayed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (prayerCardId: number) => {
      const response = await fetch(`/api/prayer-cards/${prayerCardId}/pray`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    // Optimistic update for instant UI feedback
    onMutate: async (prayerCardId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/prayer-cards/batch-prayed-status'] });
      
      // Snapshot previous values
      const previousBatchData = queryClient.getQueriesData({ queryKey: ['/api/prayer-cards/batch-prayed-status'] });
      const previousStats = queryClient.getQueryData(["/api/prayer-stats"]);
      
      // Optimistically update batch status
      queryClient.setQueriesData({ queryKey: ['/api/prayer-cards/batch-prayed-status'] }, (old: any) => {
        if (!old) return old;
        return { ...old, [prayerCardId]: false };
      });
      
      // Optimistically update individual status
      queryClient.setQueryData([`/api/prayer-cards/${prayerCardId}/prayed-today`], { hasPrayedToday: false });
      
      return { previousBatchData, previousStats, prayerCardId };
    },
    onSuccess: (data, prayerCardId) => {
      // Update with real data from server
      queryClient.setQueryData(["/api/prayer-stats"], data.stats);
      queryClient.setQueryData([`/api/prayer-cards/${prayerCardId}/prayed-today`], { hasPrayedToday: false });
      
      // Ensure batch cache has real data
      queryClient.setQueriesData({ queryKey: ['/api/prayer-cards/batch-prayed-status'] }, (old: any) => {
        if (!old) return old;
        return { ...old, [prayerCardId]: false };
      });
      
      toast({
        title: "Prayer Undone",
        description: "Your prayer has been removed",
      });
    },
    onError: (error: Error, prayerCardId: number, context: any) => {
      // Revert optimistic updates on error
      if (context?.previousBatchData) {
        context.previousBatchData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["/api/prayer-stats"], context.previousStats);
      }
      queryClient.setQueryData([`/api/prayer-cards/${prayerCardId}/prayed-today`], { hasPrayedToday: true });
      
      console.error("Prayer undo error:", error);
      
      if (error.message.includes("404")) {
        toast({
          title: "No Prayer Found",
          description: "No prayer log found to undo",
          variant: "destructive",
        });
      } else if (error.message.includes("401")) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to undo prayer. Please try again.",
          variant: "destructive",
        });
      }
    },
  });
}