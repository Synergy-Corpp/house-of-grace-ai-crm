import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      toast({
        title: "Signing out",
        description: "You are being signed out...",
      });
      await signOut();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b border-black bg-white">
      <div className="flex h-16 items-center px-6 gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-yellow-100 text-black"
          asChild
        >
          <SidebarTrigger>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="sr-only">Toggle Sidebar</span>
          </SidebarTrigger>
        </Button>

        <div className="flex items-center">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-yellow-400">HG</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">House of Grace Scents</h1>
            <p className="text-base text-black">Inventory Management System</p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-lg text-black">
            <User className="h-6 w-6" />
            <span className="font-bold">Welcome back</span>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleSignOut}
            className="flex items-center justify-center p-3 hover:bg-yellow-100 text-black"
            title="Sign Out"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
