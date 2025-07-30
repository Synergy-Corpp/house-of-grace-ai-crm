
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/utils/activityLogger";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(11, { message: "Please enter a valid Nigerian phone number." })
    .max(14, { message: "Phone number is too long." })
    .refine((val) => /^(\+234|0)[0-9]{10}$/.test(val), {
      message: "Please enter a valid Nigerian phone number format (e.g., 08012345678 or +2348012345678)."
    }),
  role: z.string().min(1, { message: "Please select a role." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddStaffFormProps {
  onComplete?: () => void;
}

const AddStaffForm: React.FC<AddStaffFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      console.log('Starting staff creation process...', data);
      const fullName = `${data.firstName} ${data.lastName}`;
      
      // Check if email already exists in staff table
      console.log('Checking if email exists in staff table...');
      const { data: existingStaff, error: checkStaffError } = await supabase
        .from('staff')
        .select('email')
        .eq('email', data.email)
        .single();

      if (checkStaffError && checkStaffError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is what we want
        console.error('Error checking staff table:', checkStaffError);
        throw checkStaffError;
      }

      if (existingStaff) {
        console.log('Staff email already exists');
        toast.error("A staff member with this email already exists!");
        return;
      }

      // Check if email already exists in users table
      console.log('Checking if email exists in users table...');
      const { data: existingUser, error: checkUserError } = await supabase
        .from('users')
        .select('email')
        .eq('email', data.email)
        .single();

      if (checkUserError && checkUserError.code !== 'PGRST116') {
        console.error('Error checking users table:', checkUserError);
        throw checkUserError;
      }

      if (existingUser) {
        console.log('User email already exists');
        toast.error("A user account with this email already exists!");
        return;
      }

      // Create a staff record in the staff table
      console.log('Creating staff record...');
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          name: fullName,
          email: data.email,
          phone: data.phone,
          position: data.role,
        });

      if (staffError) {
        console.error('Error creating staff:', staffError);
        if (staffError.code === '23505') {
          toast.error("A staff member with this email already exists!");
          return;
        }
        throw staffError;
      }

      console.log('Staff record created successfully');

      // Create a user account in the users table (for login purposes)
      console.log('Creating user account...');
      const { error: userError } = await supabase
        .from('users')
        .insert({
          email: data.email,
          password: data.email, // Password is same as email
          role: data.role.toLowerCase(),
        });

      if (userError) {
        console.error('Error creating user:', userError);
        if (userError.code === '23505') {
          toast.error("A user account with this email already exists!");
          return;
        }
        throw userError;
      }

      console.log('User account created successfully');

      // Log the activity
      if (user) {
        console.log('Logging activity...');
        await logActivity({
          action: 'create',
          entityType: 'staff',
          entityName: fullName,
          userEmail: user.email,
          details: { role: data.role, email: data.email }
        });
      }
      
      // Invalidate all staff-related queries to ensure fresh data
      console.log('Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
      await queryClient.refetchQueries({ queryKey: ['staff'] });
      
      console.log('Staff creation process completed successfully');
      toast.success(`${fullName} has been successfully added as a ${data.role}! They can now log in using their email address.`);
      
      if (onComplete) {
        onComplete();
      }
      
      form.reset();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast.error(error.message || "Failed to add staff member. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription className="flex items-center gap-1 text-amber-600">
                  <Info className="h-4 w-4" /> The Staff's Password Is The Same As Their Email
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="08012345678 or +2348012345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full md:w-auto">
          Add Staff Member
        </Button>
      </form>
    </Form>
  );
};

export default AddStaffForm;
