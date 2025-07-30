
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/utils/activityLogger';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  position: string;
  hasLoginCredentials: boolean;
  userRole?: string;
}

const StaffManagementTable = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStaffMembers = async () => {
    try {
      // Get all staff members
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('name');

      if (staffError) {
        console.error('Error fetching staff:', staffError);
        toast.error('Failed to load staff members');
        return;
      }

      // Get all users with login credentials
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast.error('Failed to load user credentials');
        return;
      }

      // Combine staff and user data
      const staffWithCredentials = staff.map(staffMember => {
        const userCredentials = users.find(user => 
          user.email.toLowerCase() === staffMember.email?.toLowerCase()
        );

        return {
          id: staffMember.id,
          name: staffMember.name,
          email: staffMember.email || '',
          position: staffMember.position || '',
          hasLoginCredentials: !!userCredentials,
          userRole: userCredentials?.role
        };
      });

      setStaffMembers(staffWithCredentials);
    } catch (error) {
      console.error('Error in fetchStaffMembers:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const removeLoginCredentials = async (staffMember: StaffMember) => {
    if (!staffMember.email) {
      toast.error('Staff member has no email address');
      return;
    }

    setActionLoading(staffMember.id);
    try {
      // Remove from users table
      const { error } = await supabase
        .from('users')
        .delete()
        .ilike('email', staffMember.email);

      if (error) {
        console.error('Error removing login credentials:', error);
        toast.error('Failed to remove login credentials');
        return;
      }

      // Log the activity
      if (user) {
        await logActivity({
          action: 'delete',
          entityType: 'user_credentials',
          entityName: `Login credentials for ${staffMember.name}`,
          userEmail: user.email,
          details: { 
            staffEmail: staffMember.email,
            staffName: staffMember.name,
            removedRole: staffMember.userRole 
          }
        });
      }

      toast.success(`Login credentials removed for ${staffMember.name}`);
      fetchStaffMembers(); // Refresh the list
      
    } catch (error: any) {
      console.error('Error removing login credentials:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading staff members...</span>
      </div>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No staff members found. Add staff members first to manage their login credentials.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Total staff members: {staffMembers.length} | 
        With login access: {staffMembers.filter(s => s.hasLoginCredentials).length}
      </div>

      <div className="space-y-3">
        {staffMembers.map((staffMember) => (
          <div key={staffMember.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{staffMember.name}</h4>
                  {staffMember.hasLoginCredentials ? (
                    <div className="flex items-center text-green-600">
                      <UserCheck className="h-4 w-4 mr-1" />
                      <span className="text-xs">Has Login</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <UserX className="h-4 w-4 mr-1" />
                      <span className="text-xs">No Login</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{staffMember.email}</p>
                <p className="text-xs text-gray-500">
                  Position: {staffMember.position}
                  {staffMember.userRole && ` | Role: ${staffMember.userRole}`}
                </p>
              </div>
              
              {staffMember.hasLoginCredentials && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLoginCredentials(staffMember)}
                  disabled={actionLoading === staffMember.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {actionLoading === staffMember.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Access
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagementTable;
