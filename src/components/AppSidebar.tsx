import { Calendar, ClipboardList, Users, Wallet, Home, FolderOpen, StickyNote, Settings, Clock, Trello, Repeat } from "lucide-react";
import { NavLink } from "react-router-dom";

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
} from "./ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Calendário", url: "/calendar", icon: Calendar },
  { title: "Projetos", url: "/projects", icon: FolderOpen },
  { title: "Rotinas", url: "/routines", icon: Repeat },
  { title: "Finanças", url: "/finances", icon: Wallet },
  { title: "Network", url: "/network", icon: Users },
  { title: "Clockify", url: "/clockify", icon: Clock },
  { title: "Plaky", url: "/plaky", icon: Trello },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className="border-r border-border bg-sidebar/95 backdrop-blur-md shadow-soft transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="animate-fade-in-left">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-medium text-sm px-3 py-2 opacity-70 transition-opacity duration-200">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-fade-in-left" style={{ animationDelay: `${index * 100}ms` }}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out
                        ${isActive 
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft scale-105' 
                          : 'text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02]'
                        }
                        transform hover:translate-x-1 active:scale-95
                      `}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      {!isCollapsed && (
                        <span className="font-medium transition-all duration-200 text-sidebar-foreground">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}