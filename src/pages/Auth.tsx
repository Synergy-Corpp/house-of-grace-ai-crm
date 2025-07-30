import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!authLoading && user) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-brand-gold to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black font-semibold text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with credentials:', { email });
      
      const result = await signIn(email, password);
      
      if (result.success) {
        console.log('Login successful');
        toast({
          title: "Welcome Back!",
          description: "You have been successfully logged in.",
        });
      } else {
        console.log('Login failed:', result.error);
        toast({
          title: "Authentication Failed",
          description: result.error || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-amber-500 via-brand-gold to-yellow-600 to-black p-2 sm:p-4 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-5 left-5 sm:top-10 sm:left-10 w-32 h-32 sm:w-64 sm:h-64 bg-black/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-40 h-40 sm:w-80 sm:h-80 bg-yellow-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 sm:w-48 sm:h-48 bg-brand-gold/40 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 left-1/2 w-16 h-16 sm:w-32 sm:h-32 bg-amber-400/50 rounded-full blur-xl animate-pulse delay-700"></div>
        
        {/* Geometric shapes for visual interest */}
        <div className="absolute top-1/4 right-1/3 w-10 h-10 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-brand-gold opacity-20 rotate-45 rounded-lg"></div>
        <div className="absolute bottom-1/4 left-1/3 w-8 h-8 sm:w-16 sm:h-16 bg-gradient-to-r from-brand-gold to-amber-600 opacity-30 rotate-12 rounded-lg"></div>
      </div>
      
      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md shadow-2xl border-2 border-brand-gold bg-white/98 backdrop-blur-lg relative z-10 overflow-hidden">
        {/* HG Logo Header */}
        <div className="bg-gradient-to-r from-brand-gold via-yellow-400 to-amber-500 p-4 sm:p-6 md:p-8 text-center relative">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 bg-black rounded-full flex items-center justify-center shadow-lg">
              <span className="text-brand-gold font-bold text-xl sm:text-2xl md:text-3xl tracking-wider">HG</span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-1 sm:mb-2">Welcome Back</h1>
            <p className="text-black/80 text-xs sm:text-sm">Access your inventory management system</p>
          </div>
        </div>
        
        <CardContent className="pt-4 pb-4 px-4 sm:pt-6 sm:pb-6 sm:px-6 md:pt-8 md:pb-8 md:px-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 sm:h-11 md:h-12 border-2 border-gray-200 focus:border-brand-gold focus:ring-brand-gold rounded-lg bg-gray-50 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 sm:h-11 md:h-12 border-2 border-gray-200 focus:border-brand-gold focus:ring-brand-gold rounded-lg bg-gray-50 focus:bg-white transition-all duration-200 pr-10 sm:pr-12 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-brand-gold transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-10 sm:h-11 md:h-12 mt-4 sm:mt-6 md:mt-8 bg-gradient-to-r from-brand-gold via-yellow-400 to-amber-500 hover:from-yellow-400 hover:via-brand-gold hover:to-yellow-500 text-black font-bold border-2 border-black/20 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-black mr-2"></div>
                  <span className="text-xs sm:text-sm md:text-base">Signing In...</span>
                </>
              ) : (
                <span className="text-xs sm:text-sm md:text-base">Access Dashboard</span>
              )}
            </Button>
          </form>
          
          <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200">
            <p className="text-center text-xs sm:text-sm text-gray-500">
              Secure inventory management system
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
