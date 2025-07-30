
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/utils/activityLogger";

const AddLoginCredentials = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAddCredentials = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      // First check if this email exists in staff table
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .ilike('email', email.trim())
        .single();

      if (staffError) {
        if (staffError.code === 'PGRST116') {
          toast.error("No staff member found with this email address");
        } else {
          console.error('Error checking staff:', staffError);
          toast.error("Error checking staff member");
        }
        return;
      }

      if (!staffMember) {
        toast.error("No staff member found with this email address");
        return;
      }

      // Check if user already has login credentials
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('email')
        .ilike('email', email.trim())
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('Error checking existing user:', userCheckError);
        toast.error("Error checking existing credentials");
        return;
      }

      if (existingUser) {
        toast.error("This staff member already has login credentials");
        return;
      }

      // Create login credentials - password is same as email
      const { error: createError } = await supabase
        .from('users')
        .insert({
          email: email.trim(),
          password: email.trim(), // Password is same as email
          role: staffMember.position.toLowerCase(),
        });

      if (createError) {
        console.error('Error creating user credentials:', createError);
        toast.error("Failed to create login credentials");
        return;
      }

      // Log the activity
      if (user) {
        await logActivity({
          action: 'create',
          entityType: 'user_credentials',
          entityName: `Login credentials for ${staffMember.name}`,
          userEmail: user.email,
          details: { 
            staffEmail: email.trim(),
            staffName: staffMember.name,
            role: staffMember.position 
          }
        });
      }

      toast.success(`Login credentials created for ${staffMember.name}! They can now log in using their email address.`);
      setEmail("");
      
    } catch (error: any) {
      console.error('Error adding login credentials:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add Login Credentials for Existing Staff</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Staff Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter staff email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            The staff member's password will be set to their email address
          </p>
        </div>
        
        <Button 
          onClick={handleAddCredentials}
          disabled={loading || !email.trim()}
          className="w-full"
        >
          {loading ? "Creating Credentials..." : "Add Login Credentials"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddLoginCredentials;
