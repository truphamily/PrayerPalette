import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useDeletePrayerCard, useDeletePrayerRequest } from "@/hooks/useGuestData";
import { usePrayedToday, useMarkPrayed, useUndoPrayed } from "@/hooks/usePrayerTracking";
import { localStorageService } from "@/lib/localStorageService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import PrayerRequestForm from "./prayer-request-form";
import EditPrayerModal from "./edit-prayer-modal";
import PrayerRequestsModal from "./prayer-requests-modal";
import PrayerRequestDetailModal from "./prayer-request-detail-modal";
import { MoreVertical, Heart, Check, Undo2 } from "lucide-react";
import type { PrayerCardWithDetails } from "@shared/schema";

interface PrayerCardProps {
  card: PrayerCardWithDetails;
  hasPrayedToday?: boolean; // Optional prop to pass prayed status from parent
  updatePrayerStatus?: (prayerCardId: number, status: boolean) => void; // Sync status update
}

export default function PrayerCard({ card, hasPrayedToday: prayedTodayProp, updatePrayerStatus }: PrayerCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const isGuest = !isAuthenticated;
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewRequestsModalOpen, setIsViewRequestsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Prayer tracking hooks (only for authenticated users)
  // Never query individually - always rely on batch data from parent
  const { data: prayedTodayData } = usePrayedToday(card.id, false); // Always disabled
  const markPrayedMutation = useMarkPrayed();
  const undoPrayedMutation = useUndoPrayed();
  const hasPrayedToday = isAuthenticated ? (prayedTodayProp !== undefined ? prayedTodayProp : false) : false;


  // Use guest-compatible delete hooks
  const deletePrayerCardMutation = useDeletePrayerCard();
  const deletePrayerRequestMutation = useDeletePrayerRequest();

  const archiveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      if (isGuest) {
        const success = localStorageService.archivePrayerRequest(requestId);
        if (!success) throw new Error("Failed to archive prayer request");
        return { success: true };
      }
      await apiRequest("PUT", `/api/prayer-requests/${requestId}/archive`);
    },
    onSuccess: () => {
      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      }
      toast({
        title: "Success",
        description: "Prayer request archived successfully",
      });
    },
    onError: (error) => {
      if (!isGuest && isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to archive prayer request",
        variant: "destructive",
      });
    },
  });

  const activeRequests = card.prayerRequests?.filter(req => !req.isArchived) || [];

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 ${
      hasPrayedToday ? 'opacity-50 grayscale' : ''
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="font-semibold text-gray-900">{card.name}</h3>
              <span 
                className="inline-block px-2 py-1 text-xs rounded-full"
                style={{ 
                  backgroundColor: `${card.category?.color}20`,
                  color: card.category?.color 
                }}
              >
                {card.category?.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-prayer-gray hover:text-prayer-blue p-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                <i className="fas fa-edit mr-2 w-4"></i>
                Edit Prayer Card
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsViewRequestsModalOpen(true)}>
                <i className="fas fa-list mr-2 w-4"></i>
                View All Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsRequestModalOpen(true)}>
                <i className="fas fa-plus mr-2 w-4"></i>
                Add New Request
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        

        
        {/* Scripture Section */}
        {card.scriptures && card.scriptures.length > 0 && (
          <div className="mb-4 space-y-2">
            {card.scriptures.map((scripture, index) => (
              <div key={index} className="p-3 bg-prayer-soft rounded-lg">
                <p className="text-sm text-prayer-gray italic mb-1">
                  "{scripture}"
                </p>
                {card.scriptureReferences && card.scriptureReferences[index] && (
                  <p className="text-xs text-prayer-gray font-medium">
                    {card.scriptureReferences[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent Prayer Requests */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm pl-[8px] pr-[8px]">
            <span className="text-prayer-gray">Recent Requests:</span>
            <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
              <DialogTrigger asChild>
                <button className="text-prayer-blue hover:text-prayer-blue/80 transition-colors">
                  <i className="fas fa-plus text-xs"></i>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Prayer Request</DialogTitle>
                </DialogHeader>
                <PrayerRequestForm 
                  prayerCardId={card.id}
                  onSuccess={() => setIsRequestModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {activeRequests.length === 0 ? (
            <p className="text-sm text-prayer-gray italic">No active prayer requests</p>
          ) : (
            <div className="space-y-1">
              {activeRequests.slice(0, 2).map((request) => (
                <div key={request.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                  <button 
                    onClick={() => setSelectedRequest(request)}
                    className="text-gray-700 flex-1 truncate hover:text-prayer-blue transition-colors text-left"
                    title="Click to view full request"
                  >
                    {request.text}
                  </button>
                  <button 
                    onClick={() => archiveRequestMutation.mutate(request.id)}
                    disabled={archiveRequestMutation.isPending}
                    className="text-prayer-gray hover:text-prayer-green transition-colors ml-2"
                  >
                    <i className="fas fa-archive text-xs"></i>
                  </button>
                </div>
              ))}
              {activeRequests.length > 2 && (
                <button
                  onClick={() => setIsViewRequestsModalOpen(true)}
                  className="text-xs text-prayer-gray hover:text-prayer-blue underline cursor-pointer"
                >
                  +{activeRequests.length - 2} more request{activeRequests.length - 2 > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Prayer completion toggle button for authenticated users */}
        {isAuthenticated && (
          <div className="mt-4 mb-3">
            <Button
              onClick={() => {
                if (hasPrayedToday) {
                  // Instantly update UI state then execute mutation
                  updatePrayerStatus?.(card.id, false);
                  undoPrayedMutation.mutate(card.id);
                } else {
                  // Instantly update UI state then execute mutation
                  updatePrayerStatus?.(card.id, true);
                  markPrayedMutation.mutate(card.id);
                }
              }}
              disabled={prayedTodayProp === undefined || markPrayedMutation.isPending || undoPrayedMutation.isPending}
              className={`w-full ${
                hasPrayedToday 
                  ? 'bg-green-100 text-green-700 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300' 
                  : 'bg-prayer-blue text-white hover:bg-prayer-blue/90'
              } transition-colors`}
              variant={hasPrayedToday ? "outline" : "default"}
            >
              {(markPrayedMutation.isPending || undoPrayedMutation.isPending) ? (
                <span className="flex items-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {hasPrayedToday ? 'Undoing...' : 'Marking as Prayed...'}
                </span>
              ) : prayedTodayProp === undefined ? (
                <span className="flex items-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Loading...
                </span>
              ) : hasPrayedToday ? (
                <span className="flex items-center">
                  <i className="fas fa-check mr-2"></i>
                  Prayed (Click to Undo)
                </span>
              ) : (
                <span className="flex items-center">
                  <i className="fas fa-praying-hands mr-2"></i>
                  Mark as Prayed
                </span>
              )}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-prayer-gray">
          <span>
            {card.frequency === "weekly" && card.dayOfWeek 
              ? `Weekly (${card.dayOfWeek})`
              : card.frequency === "monthly" && card.dayOfMonth
              ? `Monthly (Day ${card.dayOfMonth})`
              : card.frequency.charAt(0).toUpperCase() + card.frequency.slice(1)
            } • {card.activeRequestsCount} active request{card.activeRequestsCount !== 1 ? 's' : ''}
          </span>
          <span>{formatDate(card.updatedAt!)}</span>
        </div>
      </div>
      
      {/* Prayer Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Prayer Request for {card.name}</DialogTitle>
          </DialogHeader>
          <PrayerRequestForm 
            prayerCardId={card.id} 
            onSuccess={() => setIsRequestModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <EditPrayerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        card={card}
      />
      
      {/* View All Requests Modal */}
      <PrayerRequestsModal
        isOpen={isViewRequestsModalOpen}
        onClose={() => setIsViewRequestsModalOpen(false)}
        prayerCardId={card.id}
        prayerCardName={card.name}
      />

      {/* Prayer Request Detail Modal */}
      {selectedRequest && (
        <PrayerRequestDetailModal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          request={selectedRequest}
          onArchive={!selectedRequest.isArchived ? (requestId) => {
            archiveRequestMutation.mutate(requestId);
            setSelectedRequest(null);
          } : undefined}
          onDelete={(requestId) => {
            deletePrayerRequestMutation.mutate(requestId);
            setSelectedRequest(null);
          }}
          onUpdate={() => {
            // Refresh prayer card data after updating request
            queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
            queryClient.invalidateQueries({ queryKey: ["guest-prayer-cards"] });
          }}
          isArchiving={archiveRequestMutation.isPending}
          isDeleting={deletePrayerRequestMutation.isPending}
        />
      )}
    </div>
  );
}
