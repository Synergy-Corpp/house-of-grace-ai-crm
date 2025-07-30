
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/utils/activityLogger';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin credentials
const ADMIN_EMAIL = 'Adegokeomolara17@yahoo.com';
const ADMIN_PASSWORD = 'Admin123';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider initializing');
    
    // Check for existing admin session first
    const existingAdminSession = localStorage.getItem('admin_session');
    if (existingAdminSession) {
      try {
        const adminData = JSON.parse(existingAdminSession);
        console.log('Found existing admin session, restoring...');
        
        const adminUser = {
          id: 'admin-user-id',
          email: ADMIN_EMAIL,
          role: 'authenticated',
          aud: 'authenticated',
          created_at: adminData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: adminData.created_at || new Date().toISOString(),
          user_metadata: { role: 'admin' },
          app_metadata: { role: 'admin' }
        } as User;
        
        setUser(adminUser);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing admin session:', error);
        localStorage.removeItem('admin_session');
      }
    }

    // Check for existing staff session
    const existingStaffSession = localStorage.getItem('staff_session');
    if (existingStaffSession) {
      try {
        const staffData = JSON.parse(existingStaffSession);
        console.log('Found existing staff session, restoring...');
        
        const staffUser = {
          id: staffData.user.id,
          email: staffData.user.email,
          role: 'authenticated',
          aud: 'authenticated',
          created_at: staffData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: staffData.created_at || new Date().toISOString(),
          user_metadata: { role: staffData.user.role },
          app_metadata: { role: staffData.user.role }
        } as User;
        
        setUser(staffUser);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing staff session:', error);
        localStorage.removeItem('staff_session');
      }
    }
    
    // Set up auth state listener for regular Supabase users
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Only handle Supabase auth if no admin or staff session exists
      if (!localStorage.getItem('admin_session') && !localStorage.getItem('staff_session')) {
        setUser(session?.user ?? null);
        
        // Log activity for regular users
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              await logActivity({
                action: 'login',
                entityType: 'auth',
                entityName: 'User Login',
                userEmail: session.user.email || 'Unknown',
                details: {
                  loginTime: new Date().toISOString(),
                  userAgent: navigator.userAgent
                }
              });
              console.log('Login activity logged successfully');
            } catch (error) {
              console.error('Failed to log login activity:', error);
            }
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          setTimeout(async () => {
            try {
              const lastUser = user;
              if (lastUser?.email) {
                await logActivity({
                  action: 'logout',
                  entityType: 'auth',
                  entityName: 'User Logout',
                  userEmail: lastUser.email,
                  details: {
                    logoutTime: new Date().toISOString()
                  }
                });
                console.log('Logout activity logged successfully');
              }
            } catch (error) {
              console.error('Failed to log logout activity:', error);
            }
          }, 0);
        }
      }
      
      setLoading(false);
    });

    // Check for existing Supabase session only if no admin or staff session
    if (!localStorage.getItem('admin_session') && !localStorage.getItem('staff_session')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Initial session check:', session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    return () => {
      console.log('AuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Sign in attempt for:', email);
      
      // Clean up existing state first
      cleanupAuthState();
      
      // Check for hardcoded admin credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        console.log('Admin credentials detected, creating admin session');
        
        const adminUser = {
          id: 'admin-user-id',
          email: ADMIN_EMAIL,
          role: 'authenticated',
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { role: 'admin' },
          app_metadata: { role: 'admin' }
        } as User;
        
        localStorage.setItem('admin_session', JSON.stringify({
          user: adminUser,
          created_at: new Date().toISOString()
        }));
        
        setUser(adminUser);
        
        console.log('Admin session established and stored');
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
        
        return { success: true };
      }

      // First check for staff credentials in the users table (for staff with login credentials)
      console.log('Checking staff credentials in users table for email:', email);
      
      const { data: staffUsers, error: staffError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email);

      if (staffError) {
        console.error('Error querying staff users:', staffError);
        return { success: false, error: 'Database error occurred' };
      }

      if (staffUsers && staffUsers.length > 0) {
        const staffUser = staffUsers[0];
        console.log('Found staff user in users table:', staffUser);
        
        // Check if password matches
        if (staffUser.password === password) {
          console.log('Staff credentials validated, creating staff session');
          
          const staffUserObj = {
            id: staffUser.id,
            email: staffUser.email,
            role: 'authenticated',
            aud: 'authenticated',
            created_at: staffUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_confirmed_at: staffUser.created_at || new Date().toISOString(),
            user_metadata: { role: staffUser.role },
            app_metadata: { role: staffUser.role }
          } as User;
          
          localStorage.setItem('staff_session', JSON.stringify({
            user: staffUserObj,
            created_at: new Date().toISOString()
          }));
          
          setUser(staffUserObj);
          
          console.log('Staff session established and stored');
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
          
          return { success: true };
        } else {
          console.log('Staff password mismatch');
          return { success: false, error: 'Invalid email or password' };
        }
      }

      // If not found in users table, check if this is a staff member in the staff table (but without login credentials)
      console.log('Checking if user exists in staff table (without login credentials)');
      
      const { data: staffMember, error: staffMemberError } = await supabase
        .from('staff')
        .select('*')
        .ilike('email', email);

      if (staffMemberError) {
        console.error('Error querying staff table:', staffMemberError);
      } else if (staffMember && staffMember.length > 0) {
        console.log('Found staff member in staff table but no login credentials in users table');
        return { success: false, error: 'Staff member found but no login credentials configured. Contact administrator.' };
      }

      console.log('No staff user found, trying Supabase auth');

      // For non-admin/staff users, attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Global signout failed, continuing:', err);
      }

      // For regular users, use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Authentication error:', error.message);
        return { success: false, error: 'Invalid email or password' };
      }

      if (data.user) {
        console.log('User signed in successfully');
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
        
        return { success: true };
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      
      // Check if this is an admin session
      const adminSession = localStorage.getItem('admin_session');
      const staffSession = localStorage.getItem('staff_session');
      
      if (adminSession) {
        console.log('Clearing admin session');
        localStorage.removeItem('admin_session');
        setUser(null);
      } else if (staffSession) {
        console.log('Clearing staff session');
        localStorage.removeItem('staff_session');
        setUser(null);
      } else {
        // For regular users, use Supabase signout
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (err) {
          console.log('Global signout failed:', err);
        }
      }
      
      // Clean up auth state
      cleanupAuthState();
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      // Force page reload even if signout fails
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
