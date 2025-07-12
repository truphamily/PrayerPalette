import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { localStorageService } from "@/lib/localStorageService";
import { apiRequest } from "@/lib/queryClient";

export function useDataTransfer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTransferring, setIsTransferring] = useState(false);

  const transferMutation = useMutation({
    mutationFn: async () => {
      const guestData = localStorageService.exportGuestData();
      const { prayerCards, prayerRequests, categories } = guestData;
      
      console.log("Guest data to transfer:", guestData);
      
      // Get authenticated categories to map against
      const authenticatedCategoriesResponse = await apiRequest("GET", "/api/categories");
      const authenticatedCategories = await authenticatedCategoriesResponse.json();
      console.log("Authenticated categories:", authenticatedCategories);
      
      // Get all guest categories (including defaults) for mapping
      const allGuestCategories = localStorageService.getCategories();
      console.log("All guest categories:", allGuestCategories);
      
      // Create mapping from guest categories to authenticated categories by name
      const categoryMap: { [guestCategoryId: number]: number } = {};
      for (const guestCategory of allGuestCategories) {
        const matchingAuthCategory = authenticatedCategories.find(
          (authCat: any) => authCat.name === guestCategory.name
        );
        if (matchingAuthCategory) {
          categoryMap[guestCategory.id] = matchingAuthCategory.id;
        }
      }
      console.log("Category mapping:", categoryMap);

      // Transfer prayer cards with proper category mapping
      const cardMapping: { [oldId: number]: number } = {};
      for (const card of prayerCards) {
        console.log("Original guest card:", card);
        
        // Map guest category to authenticated category by name match
        let categoryId = 1; // Default to Family
        if (card.categoryId && categoryMap[card.categoryId]) {
          categoryId = categoryMap[card.categoryId];
        }
        
        const cardData = {
          name: card.name,
          categoryId: categoryId,
          frequency: card.frequency,
          dayOfWeek: card.dayOfWeek || null,
          dayOfMonth: card.dayOfMonth || null,
          scriptures: card.scriptures || null,
          scriptureReferences: card.scriptureReferences || null
        };
        
        console.log("Transferring card with category mapping:", cardData);
        const response = await apiRequest("POST", "/api/prayer-cards", cardData);
        const newCard = await response.json();
        cardMapping[card.id] = newCard.id;
      }

      // Transfer prayer requests
      for (const request of prayerRequests) {
        const newCardId = cardMapping[request.prayerCardId];
        if (newCardId) {
          console.log("Transferring prayer request:", request, "to card:", newCardId);
          await apiRequest("POST", `/api/prayer-cards/${newCardId}/requests`, {
            text: request.text
          });
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      // Clear guest data after successful transfer
      localStorageService.clearAllData();
      
      // Invalidate all queries to refresh with new data
      queryClient.invalidateQueries();
      
      toast({
        title: "Success",
        description: "Your prayer cards have been saved to your account!",
      });
      
      setIsTransferring(false);
    },
    onError: (error) => {
      console.error("Transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: "There was an error saving your prayer cards. Please try again.",
        variant: "destructive",
      });
      setIsTransferring(false);
    },
  });

  const startTransfer = () => {
    if (isTransferring) return;

    // Check if there's guest data to transfer
    if (!localStorageService.hasGuestData()) {
      toast({
        title: "No Data",
        description: "No guest data found to transfer.",
      });
      return;
    }

    setIsTransferring(true);
    
    // Show confirmation toast
    toast({
      title: "Transferring Data",
      description: "Saving your prayer cards to your account...",
    });

    transferMutation.mutate();
  };

  return {
    startTransfer,
    isTransferring,
    hasGuestData: () => localStorageService.hasGuestData()
  };
}