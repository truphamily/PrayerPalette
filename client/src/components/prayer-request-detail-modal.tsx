import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Archive, Clock, Trash2, Edit, Save, X } from "lucide-react";
import { useUpdatePrayerRequest } from "@/hooks/useGuestData";
import { useToast } from "@/hooks/use-toast";
import type { PrayerRequest } from "@shared/schema";

interface PrayerRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PrayerRequest;
  onArchive?: (requestId: number) => void;
  onDelete?: (requestId: number) => void;
  onUpdate?: () => void;
  isArchiving?: boolean;
  isDeleting?: boolean;
}

export default function PrayerRequestDetailModal({ 
  isOpen, 
  onClose, 
  request, 
  onArchive,
  onDelete,
  onUpdate,
  isArchiving = false,
  isDeleting = false 
}: PrayerRequestDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(request.text);
  const { toast } = useToast();
  
  const updatePrayerRequestMutation = useUpdatePrayerRequest();
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

  const formatFullDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(request.text);
  };

  const handleSaveEdit = () => {
    if (editText.trim() === '') {
      toast({
        title: "Error",
        description: "Prayer request text cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    updatePrayerRequestMutation.mutate(
      { id: request.id, data: { text: editText.trim() } },
      {
        onSuccess: () => {
          setIsEditing(false);
          onUpdate?.();
          toast({
            title: "Updated",
            description: "Prayer request updated successfully.",
          });
        },
        onError: (error) => {
          console.error("Update prayer request error:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to update prayer request.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(request.text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4 mt-[15px] mb-[15px]">
            <div className="flex items-center gap-2">
              <span>Prayer Request</span>
              {request.isArchived && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  <Archive className="w-3 h-3 mr-1" />
                  Archived
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updatePrayerRequestMutation.isPending}
                    size="sm"
                    className="bg-[#e81c32] hover:bg-[#e81c32]/90 text-white"
                  >
                    {updatePrayerRequestMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={updatePrayerRequestMutation.isPending}
                    size="sm"
                    variant="outline"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleEdit}
                    disabled={isArchiving || isDeleting}
                    size="sm"
                    variant="outline"
                    className="text-gray-600 hover:text-blue-600 hover:border-blue-300"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {!request.isArchived && onArchive && (
                    <Button
                      onClick={() => onArchive(request.id)}
                      disabled={isArchiving || isDeleting}
                      size="sm"
                      variant="outline"
                      className="text-gray-600 hover:text-green-600 hover:border-green-300"
                    >
                      {isArchiving ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Archiving...
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
              {onDelete && !isEditing && (
                <Button
                  onClick={() => onDelete(request.id)}
                  disabled={isArchiving || isDeleting}
                  size="sm"
                  variant="outline"
                  className="text-gray-600 hover:text-red-600 hover:border-red-300"
                >
                  {isDeleting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Prayer Request Content */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {isEditing ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Prayer Request Text
                </label>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Enter your prayer request..."
                  className="w-full"
                  disabled={updatePrayerRequestMutation.isPending}
                />
                <div className="text-xs text-gray-500">
                  {editText.length} characters
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className={`text-gray-900 leading-relaxed whitespace-pre-wrap ${
                  request.isArchived ? 'line-through opacity-75' : ''
                }`}>
                  {request.text}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Created:</span>
              <span>{formatFullDate(request.createdAt)}</span>
              <span className="text-gray-500">({formatDate(request.createdAt)})</span>
            </div>
            
            {request.isArchived && request.archivedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Archive className="w-4 h-4" />
                <span className="font-medium">Archived:</span>
                <span>{formatFullDate(request.archivedAt)}</span>
                <span className="text-gray-500">({formatDate(request.archivedAt)})</span>
              </div>
            )}
          </div>

          {/* Character Count */}
          <div className="text-xs text-gray-500 text-center">
            {request.text.length} characters
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}