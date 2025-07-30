import React, { useEffect } from "react";
import Header from "./Header";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Store,
  Receipt,
  ReceiptText,
  Users,
  User,
  Settings,
  Activity,
  CreditCard,
  LayoutDashboard,
  Brain,
} from "lucide-react";

const SidebarAutoCloseHandler = () => {
  const location = useLocation();
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Close sidebar on route change (only on mobile to avoid closing on desktop)
    console.log('Route changed to:', location.pathname); // Debug log
    if (isMobile) {
      setOpen(false);
    }
  }, [location.pathname, setOpen, isMobile]);

  return null;
};

const Layout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <Sidebar className="border-r border-gray-200 bg-white shadow-lg">
          <SidebarHeader className="flex items-center px-4 py-4 border-b border-black bg-white">
            <Link to="/inventory" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-yellow-400">HG</span>
              </div>
              <span className="text-2xl font-bold text-black truncate">HG Inventory</span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="bg-white">
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold text-black bg-yellow-100 px-4 py-3 rounded-md mx-2 mt-2">Inventory Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[{
                    to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard"
                  }, {
                    to: "/inventory", icon: Store, label: "Inventory", tooltip: "Inventory"
                  }, {
                    to: "/receipts", icon: Receipt, label: "Quick Receipts", tooltip: "Quick Receipts"
                  }, {
                    to: "/orders", icon: ReceiptText, label: "Orders", tooltip: "Orders"
                  }, {
                    to: "/invoices", icon: ReceiptText, label: "Invoices", tooltip: "Invoices"
                  }, {
                    to: "/payments", icon: CreditCard, label: "Payments", tooltip: "Payments"
                  }, {
                    to: "/customers", icon: Users, label: "Customers", tooltip: "Customers"
                  }].map(({ to, icon: Icon, label, tooltip }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={tooltip}
                        isActive={isActiveRoute(to)}
                        className={isActiveRoute(to) ? "bg-yellow-200 text-black hover:bg-yellow-300 border-l-4 border-black text-lg font-semibold" : "hover:bg-yellow-50 text-black text-lg"}
                      >
                        <Link to={to}>
                          <Icon className={`mr-3 h-6 w-6 ${isActiveRoute(to) ? "text-black" : "text-black"}`} />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold text-black bg-yellow-100 px-4 py-3 rounded-md mx-2 mt-2">Staff Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Manage Staff" 
                      isActive={isActiveRoute("/staff")}
                      className={isActiveRoute("/staff") ? "bg-yellow-200 text-black hover:bg-yellow-300 border-l-4 border-black text-lg font-semibold" : "hover:bg-yellow-50 text-black text-lg"}
                    >
                      <Link to="/staff">
                        <User className={`mr-3 h-6 w-6 text-black`} />
                        <span>Manage Staff</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Manage Roles"
                      isActive={isActiveRoute("/roles")}
                      className={isActiveRoute("/roles") ? "bg-yellow-200 text-black hover:bg-yellow-300 border-l-4 border-black text-lg font-semibold" : "hover:bg-yellow-50 text-black text-lg"}
                    >
                      <Link to="/roles">
                        <Settings className={`mr-3 h-6 w-6 text-black`} />
                        <span>Manage Roles</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Activity Logs"
                      isActive={isActiveRoute("/logs")}
                      className={isActiveRoute("/logs") ? "bg-yellow-200 text-black hover:bg-yellow-300 border-l-4 border-black text-lg font-semibold" : "hover:bg-yellow-50 text-black text-lg"}
                    >
                      <Link to="/logs">
                        <Activity className={`mr-3 h-6 w-6 text-black`} />
                        <span>Activity Logs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold text-black bg-yellow-100 px-4 py-3 rounded-md mx-2 mt-2">AI Assistant</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="AI Insights"
                      isActive={isActiveRoute("/ai-insights")}
                      className={isActiveRoute("/ai-insights") ? "bg-yellow-200 text-black hover:bg-yellow-300 border-l-4 border-black text-lg font-semibold" : "hover:bg-yellow-50 text-black text-lg"}
                    >
                      <Link to="/ai-insights">
                        <Brain className={`mr-3 h-6 w-6 text-black`} />
                        <span>AI Insights</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-4 py-4 text-lg text-black bg-yellow-100 border-t border-black">
            &copy; {new Date().getFullYear()} HG Inventory
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <Header />
          <div className="container mx-auto px-2 sm:px-4 flex-grow bg-white">
            <Outlet />
          </div>
        </div>
        {/* Place the auto-close handler at the end, inside SidebarProvider */}
        <SidebarAutoCloseHandler />
      </div>
    </SidebarProvider>
  );
};

export default Layout;