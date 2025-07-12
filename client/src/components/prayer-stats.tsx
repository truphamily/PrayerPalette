import { usePrayerStats } from "@/hooks/usePrayerTracking";
import { Badge } from "@/components/ui/badge";
import { Trophy, Heart, Target, Star, Crown, Flame, Zap, Shield, Award, Gem } from "lucide-react";

export default function PrayerStats() {
  const { data: stats, isLoading } = usePrayerStats();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;



  const prayersToNextLevel = ((stats.currentLevel * 7) - stats.totalPrayers);
  const progressPercent = Math.max(0, ((stats.totalPrayers % 7) / 7) * 100);

  // Function to get level icon based on current level
  const getLevelIcon = (level: number) => {
    if (level <= 1) return <Heart className="h-full w-auto" style={{color: '#e81c32'}} fill="currentColor" />;
    if (level <= 2) return <Star className="h-full w-auto text-yellow-500" fill="currentColor" />;
    if (level <= 4) return <Flame className="h-full w-auto text-orange-500" fill="currentColor" />;
    if (level <= 6) return <Zap className="h-full w-auto text-blue-500" fill="currentColor" />;
    if (level <= 8) return <Shield className="h-full w-auto text-green-500" fill="currentColor" />;
    if (level <= 12) return <Award className="h-full w-auto text-purple-500" fill="currentColor" />;
    if (level <= 18) return <Gem className="h-full w-auto text-indigo-500" fill="currentColor" />;
    return <Crown className="h-full w-auto text-yellow-600" fill="currentColor" />;
  };

  return (
    <div className="bg-gradient-to-br from-prayer-red/5 to-prayer-blue/5 rounded-lg p-3 border border-prayer-red/20 flex items-center gap-3">
      {/* Level Icon - fills height of container */}
      <div className="flex-shrink-0 h-12 flex items-center">
        {getLevelIcon(stats.currentLevel)}
      </div>
      
      {/* Content Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 text-sm">Prayer Level {stats.currentLevel}</h3>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span>Total: {stats.totalPrayers}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-prayer-blue" />
              <span>{prayersToNextLevel} to next</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-300 rounded-full h-2 border border-gray-400">
            <div 
              className="bg-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ 
                width: `${progressPercent}%`,
                minWidth: progressPercent > 0 ? '6px' : '0px'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}