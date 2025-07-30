import { useState, useEffect } from 'react';
import { generateMockAIResponse, getMockBusinessContext } from '@/services/mockData';

export const useLocalTestMode = () => {
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Detect if we're in localhost/local development
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('local');
    
    // Check if Supabase is configured
    const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && 
                             import.meta.env.VITE_SUPABASE_URL !== 'your-supabase-url';
    
    // Enable local mode if localhost and no Supabase config
    setIsLocalMode(isLocalhost && !hasSupabaseConfig);
    
    if (isLocalhost && !hasSupabaseConfig) {
      console.log('🧪 Local Test Mode Enabled - Using mock data for AI testing');
    }
  }, []);

  const mockAIRequest = async (message: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return generateMockAIResponse(message);
  };

  const getMockContext = () => getMockBusinessContext();

  return {
    isLocalMode,
    mockAIRequest,
    getMockContext
  };
};