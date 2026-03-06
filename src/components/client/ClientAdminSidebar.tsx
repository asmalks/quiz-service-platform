import { LayoutDashboard, ClipboardList, Trophy, Palette, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ClientAdminSession } from "./ClientAdminLayout";

const menuItems = [
    { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
    { title: "Quizzes", url: "/client/quizzes", icon: ClipboardList },
    { title: "Leaderboard", url: "/client/leaderboard", icon: Trophy },
    { title: "Branding", url: "/client/branding", icon: Palette },
];

interface Props {
    session: ClientAdminSession;
}

export function ClientAdminSidebar({ session }: Props) {
    const { state } = useSidebar();
    const navigate = useNavigate();
    const isCollapsed = state === "collapsed";

    const handleLogout = () => {
        localStorage.removeItem("client_admin_session");
        navigate("/client/login");
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <div className="p-4 border-b border-border">
                    {!isCollapsed && (
                        <div>
                            <h2 className="text-lg font-bold text-foreground truncate">
                                {session.client_name}
                            </h2>
                            <p className="text-xs text-muted-foreground">{session.email}</p>
                        </div>
                    )}
                </div>

                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            end
                                            className="hover:bg-muted/50"
                                            activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {!isCollapsed && <span className="ml-2">{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <div className="mt-auto p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        {!isCollapsed && <span className="ml-2">Logout</span>}
                    </Button>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}
