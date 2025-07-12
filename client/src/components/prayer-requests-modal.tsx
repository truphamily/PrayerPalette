import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PrayerRequestForm from "./prayer-request-form";
import PrayerRequestDetailModal from "./prayer-request-detail-modal";
import { useDeletePrayerRequest } from "@/hooks/useGuestData";
import type { PrayerRequest } from "@shared/schema";

interface PrayerRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerCardId: number;
  prayerCardName: string;
}

export default function PrayerRequestsModal({ 
  isOpen, 
  onClose, 
  prayerCardId, 
  prayerCardName 
}: PrayerRequestsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const deletePrayerRequestMutation = useDeletePrayerRequest();

  const { data: requests = [] } = useQuery({
    queryKey: ["/api/prayer-cards", prayerCardId, "requests"],
    queryFn: async () => {
      const response = await fetch(`/api/prayer-cards/${prayerCardId}/requests`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    },
    enabled: isOpen,
  });

  const archiveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PUT", `/api/prayer-requests/${requestId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards", prayerCardId, "requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      toast({
        title: "Success",
        description: "Prayer request archived successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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

  const activeRequests = (requests || []).filter((req: any) => !req.isArchived);
  const archivedRequests = (requests || []).filter((req: any) => req.isArchived);

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

  const handleAddRequestSuccess = () => {
    setIsAddRequestOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards", prayerCardId, "requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-6">
            <span>Prayer Requests - {prayerCardName}</span>
            <Button
              onClick={() => setIsAddRequestOpen(true)}
              size="sm"
              className="bg-prayer-blue hover:bg-prayer-blue/90 shrink-0 mt-[15px] mb-[15px]"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Request
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Add Request Form */}
          {isAddRequestOpen && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3 gap-8">
                <h4 className="font-medium text-gray-900">New Prayer Request</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddRequestOpen(false)}
                  className="p-3 shrink-0"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
              <PrayerRequestForm 
                prayerCardId={prayerCardId}
                onSuccess={handleAddRequestSuccess}
              />
            </div>
          )}

          {/* Active Requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Active Requests</h4>
              <Badge variant="secondary">{activeRequests.length}</Badge>
            </div>
            
            {activeRequests.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No active prayer requests</p>
            ) : (
              <div className="space-y-3">
                {activeRequests.map((request: any) => (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex-1 text-left hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
                        title="Click to view full request"
                      >
                        <p className="text-gray-900 mb-2 hover:text-prayer-blue transition-colors">
                          {request.text}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(request.createdAt)}</p>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => archiveRequestMutation.mutate(request.id)}
                        disabled={archiveRequestMutation.isPending}
                        className="text-gray-500 hover:text-green-600 ml-3"
                        title="Archive request"
                      >
                        <i className="fas fa-archive"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Archived Requests */}
          {archivedRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Archived Requests</h4>
                <Badge variant="outline">{archivedRequests.length}</Badge>
              </div>
              
              <div className="space-y-3">
                {archivedRequests.map((request: any) => (
                  <div key={request.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75">
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex-1 text-left hover:bg-gray-100 rounded p-2 -m-2 transition-colors"
                        title="Click to view full request"
                      >
                        <p className="text-gray-700 mb-2 line-through hover:text-prayer-blue transition-colors">
                          {request.text}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>Created: {formatDate(request.createdAt)}</span>
                          {request.archivedAt && (
                            <span>Archived: {formatDate(request.archivedAt)}</span>
                          )}
                        </div>
                      </button>
                      <div className="text-green-600 ml-3">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
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
          isArchiving={archiveRequestMutation.isPending}
          isDeleting={deletePrayerRequestMutation.isPending}
        />
      )}
    </Dialog>
  );
}