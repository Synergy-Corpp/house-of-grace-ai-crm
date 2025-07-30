
import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Package, FileText, Users, Trash2, Plus, Edit, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  entity_type: string;
  entity_name: string;
  created_at: string;
  details?: any;
}

const ActivityLogs = () => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      console.log('Fetching activity logs for ActivityLogs page...');
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      console.log('Fetched activity logs for ActivityLogs page:', data);
      return data as ActivityLog[];
    },
  });

  // Listen for real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscription for ActivityLogs page...');
    
    const channel = supabase
      .channel('activity-logs-page-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('New activity log received in ActivityLogs page:', payload);
          queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for ActivityLogs page...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const getActionIcon = (action: string, entityType: string) => {
    if (action === "login") return <LogIn className="h-4 w-4" />;
    if (action === "logout") return <LogOut className="h-4 w-4" />;
    if (action === "create") return <Plus className="h-4 w-4" />;
    if (action === "delete") return <Trash2 className="h-4 w-4" />;
    if (action === "update") return <Edit className="h-4 w-4" />;
    
    switch (entityType) {
      case "product": return <Package className="h-4 w-4" />;
      case "customer": return <Users className="h-4 w-4" />;
      case "invoice": return <FileText className="h-4 w-4" />;
      case "staff": return <User className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-100 text-green-800";
      case "delete": return "bg-red-100 text-red-800";
      case "update": return "bg-blue-100 text-blue-800";
      case "login": return "bg-purple-100 text-purple-800";
      case "logout": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case "product": return "bg-emerald-100 text-emerald-800";
      case "customer": return "bg-amber-100 text-amber-800";
      case "invoice": return "bg-blue-100 text-blue-800";
      case "staff": return "bg-purple-100 text-purple-800";
      case "auth": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Activity className="mr-2 h-6 w-6" />
            <h1 className="text-3xl font-bold">Activity Logs</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto mb-4"></div>
          <p>Loading activity logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Activity className="mr-2 h-6 w-6" />
            <h1 className="text-3xl font-bold">Activity Logs</h1>
          </div>
        </div>
        <div className="text-center py-12 text-red-500">
          <Activity className="h-12 w-12 mx-auto text-red-300 mb-3" />
          <h3 className="text-xl font-medium mb-1">Error loading activity logs</h3>
          <p className="text-red-400">Please try refreshing the page</p>
          <p className="text-sm text-red-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="mr-2 h-6 w-6" />
          <h1 className="text-3xl font-bold">Activity Logs</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            Track all user actions and inventory events including login/logout, product management, staff operations, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-xl font-medium mb-1">No activity logs yet</h3>
              <p className="text-gray-500">User activities will appear here as actions are performed</p>
              <p className="text-sm text-gray-400 mt-2">Try adding a product, staff member, or customer to see activity logs</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-full ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action, log.entity_type)}
                        </div>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getEntityTypeColor(log.entity_type)}>
                        {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.entity_name}</TableCell>
                    <TableCell>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;
