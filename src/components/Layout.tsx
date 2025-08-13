import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReactNode, useEffect, useState } from "react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import logoUrl from "@/assets/images/file.svg";
import FloatingClockify from "./FloatingClockify";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isDominiDark, setIsDominiDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const shouldEnable = stored === "domini-dark";
    setIsDominiDark(shouldEnable);
    const root = document.documentElement;
    root.classList.toggle("domini-dark", shouldEnable);
    root.classList.toggle("dark", shouldEnable);
    // Remover classes antigas se existirem
    document.body.classList.remove("kaiko-pro", "dark-calendar");
  }, []);

  const toggleTheme = () => {
    const next = !isDominiDark;
    setIsDominiDark(next);
    const root = document.documentElement;
    root.classList.toggle("domini-dark", next);
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "domini-dark" : "light");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-6 shadow-soft transition-all duration-300">
            <SidebarTrigger className="mr-4 transition-transform duration-200 hover:scale-105" />
            <div className="flex items-center gap-3 animate-fade-in-left">
              <img src={logoUrl} alt="Logo" className="h-8 w-auto drop-shadow-sm dark:invert" />
              <h1 className="text-xl font-semibold text-foreground transition-colors duration-200">Domini Horus</h1>
            </div>
            <div className="ml-auto animate-fade-in-right">
              <Button 
                variant="outline" 
                size="icon" 
                aria-label="Alternar tema" 
                onClick={toggleTheme}
                className="transition-all duration-200 hover:scale-105 hover:shadow-soft active:scale-95"
              >
                {isDominiDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 animate-fade-in-up">
            <NotificationCenter />
            <div className="animate-scale-in">
              {children}
            </div>
          </main>
        </div>
        <FloatingClockify />
      </div>
    </SidebarProvider>
  );
}