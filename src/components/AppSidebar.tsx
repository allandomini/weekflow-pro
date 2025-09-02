import { Calendar, ClipboardList, Users, Wallet, Home, FolderOpen, StickyNote, Settings, Clock, Trello, Repeat, User, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

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

const useMenuSections = () => {
  const { t } = useTranslation();
  
  return [
    {
      label: t('sidebar.sections.main'),
      items: [
        { title: t('navigation.dashboard'), url: "/", icon: Home },
        { title: t('navigation.calendar'), url: "/calendar", icon: Calendar },
      ]
    },
    {
      label: t('sidebar.sections.productivity'),
      items: [
        { title: t('navigation.projects'), url: "/projects", icon: FolderOpen },
        { title: t('navigation.routines'), url: "/routines", icon: Repeat },
      ]
    },
    {
      label: t('sidebar.sections.financial'),
      items: [
        { title: t('navigation.finances'), url: "/finances", icon: Wallet },
      ]
    },
    {
      label: t('sidebar.sections.tools'),
      items: [
        { title: t('navigation.network'), url: "/network", icon: Users },
        { title: t('navigation.clockify'), url: "/clockify", icon: Clock },
        { title: t('navigation.plaky'), url: "/plaky", icon: Trello },
      ]
    },
    {
      label: t('sidebar.sections.system'),
      items: [
        { title: t('navigation.settings'), url: "/settings", icon: Settings },
      ]
    }
  ];
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const { t } = useTranslation();
  const menuSections = useMenuSections();

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className="border-r border-border bg-sidebar/95 backdrop-blur-md shadow-soft transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="animate-fade-in-left">
        {/* User Profile Section */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-sidebar-primary-foreground" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground dark:text-white truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('sidebar.user.default_name')}
                </p>
                <p className="text-xs text-sidebar-foreground/60 dark:text-white/60 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>
        {menuSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label} className="mb-2">
            <SidebarGroupLabel className="text-sidebar-foreground font-medium text-sm px-3 py-2 opacity-70 transition-opacity duration-200">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item, index) => (
                  <SidebarMenuItem key={item.title} className="animate-fade-in-left" style={{ animationDelay: `${(sectionIndex * 100) + (index * 50)}ms` }}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out
                          ${isActive 
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft scale-105' 
                            : 'text-foreground dark:text-white hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02]'
                          }
                          transform hover:translate-x-1 active:scale-95
                        `}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 text-foreground dark:text-white" />
                        {!isCollapsed && (
                          <span className="font-medium transition-all duration-200 text-sidebar-foreground dark:text-white">
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}