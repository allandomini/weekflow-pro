import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from './ui/button';
import { Moon, Sun, Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeSelector: React.FC = () => {
  const [theme, setTheme] = React.useState<string>(() => 
    localStorage.getItem('theme') || 'system'
  );

  const setMode = React.useCallback((mode: string) => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
    setTheme(mode);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-full justify-between">
          {theme === 'light' && <Sun className="h-5 w-5" />}
          {theme === 'dark' && <Moon className="h-5 w-5" />}
          {theme === 'horus' && <Eye className="h-5 w-5" />}
          {theme === 'cia' && <Eye className="h-5 w-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem 
          onClick={() => setMode('light')}
          className="flex items-center justify-between"
        >
          Light Mode
          {theme === 'light' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setMode('dark')}
          className="flex items-center justify-between"
        >
          Dark Mode
          {theme === 'dark' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setMode('horus')}
          className="flex items-center justify-between"
        >
          Horus Theme
          {theme === 'horus' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setMode('cia')}
          className="flex items-center justify-between"
        >
          CIA Theme
          {theme === 'cia' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
