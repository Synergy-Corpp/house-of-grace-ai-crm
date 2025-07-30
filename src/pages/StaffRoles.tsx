
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield } from 'lucide-react';
import AddStaffForm from '@/components/dashboard/AddStaffForm';
import StaffManagementTable from '@/components/dashboard/StaffManagementTable';
import AddLoginCredentials from '@/components/dashboard/AddLoginCredentials';

const StaffRoles = () => {
  const [showAddStaff, setShowAddStaff] = useState(false);

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="mr-2 h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Staff & Roles Management</h1>
        </div>
        <Button onClick={() => setShowAddStaff(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddLoginCredentials />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage your team members and their access permissions
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Staff:</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-semibold">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffManagementTable />
        </CardContent>
      </Card>

      {showAddStaff && (
        <AddStaffForm />
      )}
    </div>
  );
};

export default StaffRoles;
