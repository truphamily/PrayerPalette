import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { localStorageService } from "@/lib/localStorageService";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Category, 
  PrayerCardWithDetails, 
  UserReminderSettings 
} from "@shared/schema";

// Hook to get categories (works for both guest and authenticated users)
export function useCategories() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isGuest = !isAuthenticated;

  return useQuery<Category[]>({
    queryKey: isGuest ? ["guest-categories"] : ["/api/categories"],
    queryFn: async () => {
      if (isGuest || (!isAuthenticated && !authLoading)) {
        return localStorageService.getCategories();
      }
      // For authenticated users, use the normal API
      const response = await fetch("/api/categories");
      if (!response.ok) {
        // If unauthorized, fall back to guest mode
        if (response.status === 401) {
          return localStorageService.getCategories();
        }
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
    enabled: !authLoading && (isAuthenticated || isGuest || (!isAuthenticated && !authLoading)),
  });
}

// Hook to get prayer cards (works for both guest and authenticated users)
export function usePrayerCards(enabled = true) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isGuest = !isAuthenticated;

  return useQuery<PrayerCardWithDetails[]>({
    queryKey: isGuest ? ["guest-prayer-cards"] : ["/api/prayer-cards"],
    queryFn: async () => {
      if (isGuest || (!isAuthenticated && !authLoading)) {
        return localStorageService.getPrayerCards();
      }
      // For authenticated users, use the normal API
      const response = await fetch("/api/prayer-cards");
      if (!response.ok) {
        // If unauthorized, fall back to guest mode
        if (response.status === 401) {
          return localStorageService.getPrayerCards();
        }
        throw new Error("Failed to fetch prayer cards");
      }
      return response.json();
    },
    enabled: enabled && !authLoading && (isAuthenticated || isGuest || (!isAuthenticated && !authLoading)),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Hook to get prayer cards by frequency
export function usePrayerCardsByFrequency(frequency: string, enabled = true) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isGuest = !isAuthenticated;

  return useQuery<PrayerCardWithDetails[]>({
    queryKey: isGuest ? ["guest-prayer-cards", frequency] : ["/api/prayer-cards", { frequency }],
    queryFn: async () => {
      if (isGuest || (!isAuthenticated && !authLoading)) {
        return localStorageService.getPrayerCardsByFrequency(frequency);
      }
      // For authenticated users, use the normal API
      const response = await fetch(`/api/prayer-cards?frequency=${frequency}`);
      if (!response.ok) {
        // If unauthorized, fall back to guest mode
        if (response.status === 401) {
          return localStorageService.getPrayerCardsByFrequency(frequency);
        }
        throw new Error("Failed to fetch prayer cards");
      }
      return response.json();
    },
    enabled: enabled && frequency !== "" && !authLoading && (isAuthenticated || isGuest || (!isAuthenticated && !authLoading)),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Hook to get reminder settings
export function useReminderSettings() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isGuest = !isAuthenticated;

  return useQuery<UserReminderSettings | null>({
    queryKey: isGuest ? ["guest-reminder-settings"] : ["/api/reminder-settings"],
    queryFn: async () => {
      if (isGuest) {
        return localStorageService.getReminderSettings();
      }
      // For authenticated users, use the normal API
      const response = await fetch("/api/reminder-settings");
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch reminder settings");
      return response.json();
    },
    enabled: !authLoading && (isAuthenticated || isGuest),
  });
}

// Hook to create prayer card (works for both guest and authenticated users)
export function useCreatePrayerCard() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      if (isGuest) {
        const newCard = localStorageService.createPrayerCard(data);
        return newCard;
      }
      // For authenticated users, use the normal API
      try {
        const response = await apiRequest('POST', '/api/prayer-cards', data);
        
        // Check if response is empty
        const text = await response.text();
        if (!text) {
          throw new Error("Empty response from server");
        }
        
        try {
          const result = JSON.parse(text);
          return result;
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("Response text:", text);
          throw new Error("Invalid JSON response from server");
        }
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
        queryClient.invalidateQueries({ queryKey: ["guest-categories"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      }
    },
  });
}

// Hook to update prayer card (works for both guest and authenticated users)
export function useUpdatePrayerCard() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (isGuest) {
        const updatedCard = localStorageService.updatePrayerCard(id, data);
        return updatedCard;
      }
      // For authenticated users, use the normal API
      const response = await apiRequest('PUT', `/api/prayer-cards/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      }
    },
  });
}

// Hook to delete prayer card (works for both guest and authenticated users)
export function useDeletePrayerCard() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (isGuest) {
        const success = localStorageService.deletePrayerCard(id);
        if (!success) throw new Error("Failed to delete prayer card");
        return { success: true };
      }
      // For authenticated users, use the normal API
      const response = await apiRequest('DELETE', `/api/prayer-cards/${id}`);
      return { success: true };
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      }
    },
  });
}

// Hook to create prayer request (works for both guest and authenticated users)
export function useCreatePrayerRequest() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { text: string; prayerCardId: number }) => {
      if (isGuest) {
        const newRequest = localStorageService.createPrayerRequest(data);
        return newRequest;
      }
      // For authenticated users, use the normal API
      const response = await apiRequest('POST', '/api/prayer-requests', data);
      return await response.json();
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      }
    },
  });
}

// Hook to update prayer request (works for both guest and authenticated users)
export function useUpdatePrayerRequest() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<any> }) => {
      console.log("Update prayer request - isGuest:", isGuest, "id:", id, "data:", data);
      
      if (isGuest) {
        const updatedRequest = localStorageService.updatePrayerRequest(id, data);
        if (!updatedRequest) throw new Error("Failed to update prayer request");
        return updatedRequest;
      }
      
      // For authenticated users, use the normal API
      try {
        console.log("Making authenticated API call to update prayer request");
        const response = await apiRequest('PUT', `/api/prayer-requests/${id}`, data);
        const result = await response.json();
        console.log("Prayer request update successful:", result);
        return result;
      } catch (error) {
        console.error("Prayer request update failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      }
    },
  });
}

// Hook to delete prayer request (works for both guest and authenticated users)
export function useDeletePrayerRequest() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      if (isGuest) {
        const success = localStorageService.deletePrayerRequest(requestId);
        if (!success) throw new Error("Failed to delete prayer request");
        return { success: true };
      }
      // For authenticated users, use the normal API
      await apiRequest('DELETE', `/api/prayer-requests/${requestId}`);
      return { success: true };
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      }
    },
  });
}

// Hook to save reminder settings (works for both guest and authenticated users)
export function useSaveReminderSettings() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      enableReminders: boolean;
      reminderTimes: string[];
      enableBrowserNotifications: boolean;
      timezone?: string;
    }) => {
      if (isGuest) {
        const settings = localStorageService.saveReminderSettings(data);
        return settings;
      }
      // For authenticated users, use the normal API
      const response = await apiRequest('POST', '/api/reminder-settings', data);
      return await response.json();
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-reminder-settings"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/reminder-settings"] });
      }
    },
  });
}