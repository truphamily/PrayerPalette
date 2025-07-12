import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const handleTryAsGuest = () => {
    // Force a re-render by reloading to trigger guest mode
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-prayer-light to-white">
      {/* Hero Section */}
      <div className="relative px-4 pt-16 pb-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-[#e81c32]/10 rounded-full flex items-center justify-center">
              <i className="fas fa-praying-hands text-[#e81c32] text-3xl"></i>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Prayer <span className="text-[#e81c32]">Palette</span>
          </h1>
          <p className="text-xl text-prayer-gray mb-8 max-w-3xl mx-auto">
            Your comprehensive digital companion for organized prayer life. Create, manage, and track your spiritual journey with intelligent scheduling and community support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-[#e81c32] hover:bg-[#e81c32]/90 text-lg px-8 py-3"
              size="lg"
            >
              Start Your Prayer Journey
            </Button>
            
            <Button 
              onClick={handleTryAsGuest}
              variant="outline"
              className="border-[#e81c32] text-[#e81c32] hover:bg-[#e81c32]/10 text-lg px-8 py-3"
              size="lg"
            >
              Try as Guest
            </Button>
          </div>

          <p className="text-sm text-prayer-gray">
            <i className="fas fa-shield-alt text-prayer-green mr-2"></i>
            Secure authentication • Guest mode available • Cross-platform sync
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-4 py-16 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Your Prayer Life</h2>
            <p className="text-prayer-gray text-lg">Everything you need to organize, track, and enhance your spiritual journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Authentication System */}
            <Card className="border border-prayer-gray/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-prayer-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-user-shield text-prayer-blue text-xl"></i>
                </div>
                <CardTitle className="text-xl">Secure Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-prayer-gray mb-4">
                  Cross-platform login support with secure data synchronization across all your devices.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-lock mr-1"></i>
                    Secure Login
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-sync mr-1"></i>
                    Cross-Platform Sync
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Prayer Card Creation */}
            <Card className="border border-prayer-gray/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-prayer-green/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-plus-circle text-prayer-green text-xl"></i>
                </div>
                <CardTitle className="text-xl">Prayer Card Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-prayer-gray mb-4">
                  Create personalized prayer cards with custom categories and integrated scripture verses.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-palette mr-1"></i>
                    Custom Categories
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-book mr-1"></i>
                    Scripture Integration
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Prayer Organization */}
            <Card className="border border-prayer-gray/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-prayer-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-calendar-alt text-prayer-gold text-xl"></i>
                </div>
                <CardTitle className="text-xl">Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-prayer-gray mb-4">
                  Organize prayers by daily, weekly, and monthly frequencies with intelligent scheduling.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-clock mr-1"></i>
                    Daily, Weekly, Monthly
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-bell mr-1"></i>
                    Smart Reminders
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Prayer Request Management */}
            <Card className="border border-prayer-gray/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#e81c32]/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-hands text-[#e81c32] text-xl"></i>
                </div>
                <CardTitle className="text-xl">Request Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-prayer-gray mb-4">
                  Track individual prayer requests with archiving capability and progress monitoring.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-list mr-1"></i>
                    Request Tracking
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-archive mr-1"></i>
                    Archive System
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Smart Daily Prayers */}
            <Card className="border border-prayer-gray/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-brain text-purple-500 text-xl"></i>
                </div>
                <CardTitle className="text-xl">Smart Daily View</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-prayer-gray mb-4">
                  Intelligent Daily Prayers tab that shows all relevant prayers for today across all frequencies.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-today mr-1"></i>
                    Today's Focus
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-filter mr-1"></i>
                    Smart Filtering
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Scripture Features */}
            <Card className="border border-prayer-gray/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-search text-indigo-500 text-xl"></i>
                </div>
                <CardTitle className="text-xl">Scripture Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-prayer-gray mb-4">
                  Advanced scripture search with fallback verses and manual input options for personalized spiritual guidance.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-search mr-1"></i>
                    Advanced Search
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <i className="fas fa-edit mr-1"></i>
                    Manual Input
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Community Features */}
      <div className="px-4 py-16 bg-gradient-to-r from-[#e81c32]/5 to-prayer-blue/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-[#e81c32]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-users text-[#e81c32] text-2xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Community Prayer Forum</h2>
            <p className="text-xl text-prayer-gray mb-8">
              Connect with fellow believers and share prayer requests in our secure community forum
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="text-left">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-prayer-green/10 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-share-alt text-prayer-green"></i>
                  </div>
                  <h3 className="text-lg font-semibold">Share Prayer Requests</h3>
                </div>
                <p className="text-prayer-gray">
                  Authenticated users can post prayer requests to the community forum for collective support and spiritual encouragement.
                </p>
              </CardContent>
            </Card>

            <Card className="text-left">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-prayer-blue/10 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-heart text-prayer-blue"></i>
                  </div>
                  <h3 className="text-lg font-semibold">Community Support</h3>
                </div>
                <p className="text-prayer-gray">
                  Join a supportive community where members pray for each other and share spiritual insights and encouragement.
                </p>
              </CardContent>
            </Card>
          </div>

          <Badge variant="outline" className="text-[#e81c32] border-[#e81c32]">
            <i className="fas fa-lock mr-2"></i>
            Secure community access for authenticated users only
          </Badge>
        </div>
      </div>

      {/* Responsive Design Section */}
      <div className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Designed for Every Device</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-prayer-gray/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-mobile-alt text-prayer-gray text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Optimized</h3>
              <p className="text-prayer-gray text-sm">Fully responsive design works perfectly on smartphones and tablets</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-prayer-gray/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-laptop text-prayer-gray text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Desktop Ready</h3>
              <p className="text-prayer-gray text-sm">Enhanced experience on larger screens with advanced features</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-prayer-gray/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-palette text-prayer-gray text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Color-Coded</h3>
              <p className="text-prayer-gray text-sm">Intuitive color-coded categories for easy prayer organization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-4 py-16 bg-gradient-to-r from-[#e81c32] to-prayer-blue text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Begin Your Spiritual Journey Today</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have transformed their prayer life with Prayer Palette
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-white text-[#e81c32] hover:bg-gray-100 text-lg px-8 py-3"
              size="lg"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Create Your Account
            </Button>
            
            <Button 
              onClick={handleTryAsGuest}
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-3"
              size="lg"
            >
              <i className="fas fa-eye mr-2"></i>
              Explore as Guest
            </Button>
          </div>
          
          <p className="text-sm mt-6 opacity-75">
            No credit card required • Instant access • Secure & private
          </p>
        </div>
      </div>
    </div>
  );
}
