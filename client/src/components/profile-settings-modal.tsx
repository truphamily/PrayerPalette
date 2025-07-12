import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/auth/profile-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload profile image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile image has been updated successfully.",
      });
      
      // Update the user data in cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to update profile image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your profile image
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Current/Preview Avatar */}
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage 
                src={previewUrl || user?.profileImageUrl || undefined} 
                alt="Profile" 
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera overlay button */}
            <button
              onClick={triggerFileSelect}
              className="absolute bottom-0 right-0 w-10 h-10 bg-[#e81c32] hover:bg-[#e81c32]/90 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <Camera size={20} />
            </button>
          </div>

          {/* User Info */}
          <div className="text-center">
            <h3 className="font-medium text-lg">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'
              }
            </h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          {/* File Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Upload Actions */}
          {selectedFile && (
            <div className="flex space-x-3 w-full">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={uploadMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1 bg-[#e81c32] hover:bg-[#e81c32]/90"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Instructions */}
          {!selectedFile && (
            <div className="text-center space-y-2">
              <Button
                onClick={triggerFileSelect}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose New Image
              </Button>
              <p className="text-xs text-gray-500">
                Maximum file size: 5MB<br />
                Supported formats: JPG, PNG, WebP
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}