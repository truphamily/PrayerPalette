import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrayerCard from "@/components/prayer-card";
import AddPrayerModal from "@/components/add-prayer-modal";
import ReminderSettingsModal from "@/components/reminder-settings-modal";
import DataTransferBanner from "@/components/data-transfer-banner";
import PrayerStats from "@/components/prayer-stats";
import ProfileSettingsModal from "@/components/profile-settings-modal";
import { notificationService } from "@/lib/notificationService";
import { localStorageService } from "@/lib/localStorageService";
import { 
  useCategories, 
  usePrayerCards,
  usePrayerCardsByFrequency, 
  useReminderSettings 
} from "@/hooks/useGuestData";
import { usePrayedStatusForCards } from "@/hooks/usePrayerTracking";
import { usePrayerStatusSync } from "@/hooks/usePrayerStatusSync";
import type { PrayerCardWithDetails, Category } from "@shared/schema";



export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("daily");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Use guest-compatible hooks (must be called before any early returns)
  const { data: categories = [] } = useCategories();
  const { data: reminderSettings } = useReminderSettings();
  
  // Only load the data we need based on the active tab
  const { data: allPrayerCards = [], isLoading: allCardsLoading } = usePrayerCards(activeTab === "all");
  const { data: frequencyCards = [], isLoading: frequencyLoading } = usePrayerCardsByFrequency(
    activeTab === "all" ? "" : activeTab, 
    activeTab !== "all"
  );
  
  // Use the appropriate cards based on the active tab (moved here to be accessible early)
  const prayerCards = activeTab === "all" ? allPrayerCards : frequencyCards;
  const cardsLoading = activeTab === "all" ? allCardsLoading : frequencyLoading;
  
  // Ultra-fast synchronous prayer status management
  const { getPrayerStatus, updatePrayerStatus, isInitialized, prayerStatusCache } = usePrayerStatusSync();
  
  // Fallback to traditional batch loading for compatibility
  const cardIds = prayerCards.map(card => card.id);
  const { data: prayedStatusMap = {}, isLoading: isBatchLoading } = usePrayedStatusForCards(
    cardIds, 
    isAuthenticated && cardIds.length > 0 && !isInitialized  // Only use as fallback
  );
  
  // Use sync cache if available, otherwise fall back to batch data
  const finalPrayerStatusMap = isInitialized ? prayerStatusCache : prayedStatusMap;

  // Check if guest has data and should be prompted to save
  useEffect(() => {
    if (isGuest && localStorageService.hasGuestData() && !showSavePrompt) {
      // Show save prompt after a delay
      const timer = setTimeout(() => {
        setShowSavePrompt(true);
      }, 10000); // Show after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isGuest, showSavePrompt]);

  // Initialize notification service with user reminder settings
  useEffect(() => {
    if (reminderSettings) {
      notificationService.initialize(reminderSettings);
    }
  }, [reminderSettings]);

  // Show landing section for new guests
  if (isGuest && !localStorageService.hasGuestData()) {
    return (
      <div className="min-h-screen bg-prayer-light flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#e81c32] mb-2">Prayer Palette</h1>
            <p className="text-prayer-gray">Your prayer management tool for both web and mobile application, based on the book A Praying Life by Paul E. Miller</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#e81c32]/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-plus text-prayer-blue text-sm"></i>
                </div>
                <span className="text-sm text-gray-700">Create prayer cards with frequencies</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#e81c32]/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-book text-prayer-blue text-sm"></i>
                </div>
                <span className="text-sm text-gray-700">Integrate scripture verses</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#e81c32]/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-bell text-prayer-blue text-sm"></i>
                </div>
                <span className="text-sm text-gray-700">Set prayer reminders</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="w-full bg-[#e81c32] hover:bg-[#e81c32]/90"
              >
                Sign In / Sign Up
              </Button>
              
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                className="w-full border-[#e81c32] text-[#e81c32] hover:bg-[#e81c32]/10"
              >
                Try as Guest
              </Button>
              
              <p className="text-xs text-prayer-gray text-center">
                Guest mode stores data locally. Sign up to save your prayers permanently.
              </p>
            </div>
          </div>
        </div>
        <AddPrayerModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />
      </div>
    );
  }





  // Save to account functionality
  const handleSaveToAccount = () => {
    if (localStorageService.hasGuestData()) {
      toast({
        title: "Save to Account",
        description: "Sign up or sign in to save your prayers permanently.",
      });
      window.location.href = "/api/login";
    }
  };

  if (cardsLoading) {
    return (
      <div className="min-h-screen bg-prayer-light flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-praying-hands text-[#e81c32] text-4xl mb-4"></i>
          <p className="text-prayer-gray">Loading your prayers...</p>
        </div>
      </div>
    );
  }

  const filteredCards = prayerCards.filter(card => {
    const matchesSearch = !searchQuery || 
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      card.category?.id.toString() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort cards to move prayed cards to the bottom
  const sortedCards = [...filteredCards].sort((a, b) => {
    // For guest users, no sorting by prayed status since they don't have prayer tracking
    if (isGuest) return 0;
    
    // Get prayed status for both cards using the final status map
    const aPrayed = finalPrayerStatusMap[a.id] || false;
    const bPrayed = finalPrayerStatusMap[b.id] || false;
    
    // Move prayed cards to bottom (false < true in JavaScript sorting)
    if (aPrayed !== bPrayed) {
      return aPrayed ? 1 : -1;
    }
    
    return 0; // Keep original order for cards with same prayed status
  });

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "daily": return "Today's Prayers";
      case "weekly": return "Weekly Prayers";
      case "monthly": return "Monthly Prayers";
      case "all": return "All Prayer Cards";
      default: return "Prayers";
    }
  };

  const getTabDescription = (tab: string) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayDate = new Date().getDate();
    switch (tab) {
      case "daily": return "Prayers for those close and dear to your heart";
      case "weekly": return "Prayers organized by day of the week";
      case "monthly": return "Long-term prayer commitments and goals";
      case "all": return "Complete overview of all your prayer cards";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-prayer-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="fas fa-praying-hands text-[#e81c32] text-2xl mr-3"></i>
                <h1 className="text-xl font-semibold text-gray-900">Prayer Palette</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isGuest ? (
                <>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <i className="fas fa-user-circle text-xl"></i>
                    <span className="text-sm font-medium hidden sm:block">Guest User</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => window.location.href = "/api/login"}
                    variant="outline"
                    className="border-[#e81c32] text-[#e81c32] hover:bg-[#e81c32]/10"
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Sign In
                  </Button>
                  {showSavePrompt && (
                    <Button
                      size="sm"
                      onClick={handleSaveToAccount}
                      className="bg-[#e81c32] hover:bg-[#e81c32]/90 text-white"
                    >
                      <i className="fas fa-save mr-2"></i>
                      Save to Account
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReminderModalOpen(true)}
                    className="text-prayer-gray hover:text-[#e81c32] border-gray-300 hover:border-[#e81c32]"
                  >
                    <i className="fas fa-bell"></i>
                  </Button>
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileModalOpen(true)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-prayer-blue/20">
                        {user?.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#e81c32] text-white text-sm font-medium">
                            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium hidden sm:block">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                      </span>
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = "/api/logout"}
                    className="text-prayer-gray hover:text-prayer-blue"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Transfer Banner */}
        <DataTransferBanner />
        
        {/* Prayer Stats for authenticated users */}
        {!isGuest && (
          <div className="mb-6">
            <PrayerStats />
          </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {[
              { id: "daily", label: "Daily Prayers" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "all", label: "All Cards" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#e81c32] text-white"
                    : "text-prayer-gray hover:text-prayer-blue"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {getTabTitle(activeTab)}
          </h2>
          {activeTab === "daily" && (
            <p className="text-lg font-medium text-[#e81c32] mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          )}
          <p className="text-prayer-gray">{getTabDescription(activeTab)}</p>
        </div>

        {/* Search and Filter for All Cards */}
        {activeTab === "all" && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search prayer cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-prayer-gray"></i>
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Prayer Cards */}
        {cardsLoading ? ( // Remove batch loading dependency for instant button display
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#e81c32]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-praying-hands text-[#e81c32] text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === "all" && (searchQuery || selectedCategory !== "all")
                ? "No matching prayer cards"
                : `No ${activeTab} prayers yet`}
            </h3>
            <p className="text-prayer-gray mb-6">
              {activeTab === "all" && (searchQuery || selectedCategory !== "all")
                ? "Try adjusting your search or filter criteria"
                : "Create your first prayer card to get started"}
            </p>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#e81c32] hover:bg-[#e81c32]/90"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Prayer Card
            </Button>
          </div>
        ) : activeTab === "all" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCards.map((card) => (
              <PrayerCard 
                key={`${isGuest ? 'guest' : 'auth'}-${card.id}`} 
                card={card} 
                hasPrayedToday={isAuthenticated ? finalPrayerStatusMap[card.id] : undefined}
                updatePrayerStatus={updatePrayerStatus}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCards.map((card) => (
              <PrayerCard 
                key={`${isGuest ? 'guest' : 'auth'}-${card.id}`} 
                card={card} 
                hasPrayedToday={isAuthenticated ? finalPrayerStatusMap[card.id] : undefined}
                updatePrayerStatus={updatePrayerStatus}
              />
            ))}
          </div>
        )}
      </main>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#e81c32] hover:bg-[#e81c32]/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        <i className="fas fa-plus text-xl transition-transform group-hover:scale-110"></i>
      </button>
      {/* Add Prayer Modal */}
      <AddPrayerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Reminder Settings Modal */}
      <ReminderSettingsModal 
        isOpen={isReminderModalOpen} 
        onClose={() => setIsReminderModalOpen(false)} 
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
