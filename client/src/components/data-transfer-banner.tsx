import { useState } from "react";
import { useDataTransfer } from "@/hooks/useDataTransfer";
import { localStorageService } from "@/lib/localStorageService";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function DataTransferBanner() {
  const { isAuthenticated } = useAuth();
  const { startTransfer, isTransferring } = useDataTransfer();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show banner if user is authenticated and has guest data and hasn't dismissed it
  if (!isAuthenticated || !localStorageService.hasGuestData() || isDismissed) {
    return null;
  }

  const handleTransfer = () => {
    startTransfer();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <i className="fas fa-info-circle text-blue-500"></i>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Save Your Prayer Cards
            </h3>
            <p className="text-sm text-blue-700">
              You have prayer cards from when you were browsing as a guest. 
              Would you like to save them to your account?
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
            disabled={isTransferring}
          >
            Not Now
          </Button>
          <Button
            size="sm"
            onClick={handleTransfer}
            disabled={isTransferring}
          >
            {isTransferring ? "Saving..." : "Save to Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}