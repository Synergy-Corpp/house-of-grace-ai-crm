
export const cleanupAuthState = () => {
  console.log('Cleaning up auth state');
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage (but preserve admin session)
  Object.keys(localStorage).forEach((key) => {
    if ((key.startsWith('supabase.auth.') || key.includes('sb-')) && key !== 'admin_session') {
      console.log('Removing auth key:', key);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log('Removing session auth key:', key);
        sessionStorage.removeItem(key);
      }
    });
  }
};
