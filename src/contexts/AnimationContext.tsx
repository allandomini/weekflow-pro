import React, { createContext, useContext, useState, useEffect } from 'react';

interface AnimationContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  setAnimationsEnabled: (enabled: boolean) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem('animations-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('animations-enabled', JSON.stringify(animationsEnabled));
    
    // Add global CSS class to control animations
    if (animationsEnabled) {
      document.documentElement.classList.add('animations-enabled');
      document.documentElement.classList.remove('animations-disabled');
    } else {
      document.documentElement.classList.add('animations-disabled');
      document.documentElement.classList.remove('animations-enabled');
    }
  }, [animationsEnabled]);

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  return (
    <AnimationContext.Provider value={{
      animationsEnabled,
      toggleAnimations,
      setAnimationsEnabled
    }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimations() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimations must be used within an AnimationProvider');
  }
  return context;
}

// Animation utility classes
export const animations = {
  // Page transitions
  pageEnter: 'animate-in slide-in-from-right-4 duration-500 ease-out',
  pageExit: 'animate-out slide-out-to-left-4 duration-300 ease-in',
  
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300 ease-out',
  fadeOut: 'animate-out fade-out duration-200 ease-in',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-200 ease-out',
  scaleOut: 'animate-out zoom-out-95 duration-150 ease-in',
  
  // Slide animations
  slideInFromTop: 'animate-in slide-in-from-top-4 duration-300 ease-out',
  slideInFromBottom: 'animate-in slide-in-from-bottom-4 duration-300 ease-out',
  slideInFromLeft: 'animate-in slide-in-from-left-4 duration-300 ease-out',
  slideInFromRight: 'animate-in slide-in-from-right-4 duration-300 ease-out',
  
  // Bounce animations
  bounceIn: 'animate-in zoom-in-50 duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
  
  // Hover animations (CSS classes)
  hover: {
    scale: 'hover:scale-105 transition-transform duration-200 ease-out',
    lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ease-out',
    glow: 'hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 ease-out',
    rotate: 'hover:rotate-3 transition-transform duration-200 ease-out',
    pulse: 'hover:scale-105 transition-transform duration-200',
    brightness: 'hover:brightness-110 transition-all duration-200 ease-out'
  },
  
  // Loading animations
  loading: {
    spin: 'animate-spin',
    pulse: '',
    bounce: 'animate-bounce',
    ping: 'animate-ping'
  },
  
  // Stagger delays for lists
  stagger: (index: number, delay: number = 100) => `style="animation-delay: ${index * delay}ms"`
};

// Hook for conditional animation classes
export function useAnimationClass(animationClass: string, fallback: string = '') {
  const { animationsEnabled } = useAnimations();
  return animationsEnabled ? animationClass : fallback;
}
