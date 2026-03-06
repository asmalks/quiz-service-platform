import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientAdminSidebar } from "./ClientAdminSidebar";

export interface ClientAdminSession {
    admin_id: string;
    client_id: string;
    email: string;
    role: string;
    client_name: string;
    client_slug: string;
    logged_in_at: string;
}

export function getClientAdminSession(): ClientAdminSession | null {
    try {
        const raw = localStorage.getItem("client_admin_session");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function ClientAdminLayout() {
    const navigate = useNavigate();
    const [session, setSession] = useState<ClientAdminSession | null>(null);

    useEffect(() => {
        const s = getClientAdminSession();
        if (!s) {
            navigate("/client/login");
            return;
        }
        setSession(s);
    }, [navigate]);

    if (!session) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <ClientAdminSidebar session={session} />
                <main className="flex-1 overflow-auto">
                    <Outlet context={session} />
                </main>
            </div>
        </SidebarProvider>
    );
}
