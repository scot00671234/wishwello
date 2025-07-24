import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Heart, User, LogOut } from 'lucide-react';
import { Link } from 'wouter';

export default function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Wish Wello</span>
              </div>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex space-x-6">
                <Link href="/">
                  <a className="text-gray-600 hover:text-gray-900 transition-colors">Dashboard</a>
                </Link>
                <Link href="/setup">
                  <a className="text-gray-600 hover:text-gray-900 transition-colors">Teams</a>
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.firstName || user?.email || 'User'}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:block">Sign Out</span>
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  onClick={handleLogin}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Button>
                <Button onClick={handleLogin}>
                  Start Free Trial
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
