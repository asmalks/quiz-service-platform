import { useEffect, useState, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    checkAdminAccess();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          navigate("/admin/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      navigate("/admin/login");
      return;
    }

    // Optimistically show admin UI while verifying
    setIsAdmin(true);

    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!adminData) {
      setIsAdmin(false);
      navigate("/admin/login");
    }
  };

  // Show skeleton only on first load
  if (isAdmin === null) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <div className="w-60 border-r bg-card p-4 space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b border-border flex items-center px-4 bg-card"></header>
            <main className="flex-1 overflow-auto bg-secondary/30 p-6">
              <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto bg-secondary/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
