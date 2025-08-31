import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useAnimations } from '@/contexts/AnimationContext';

// CSS-in-JS for 3D rotation animation
const spin3DStyles = `
  @keyframes spin3d {
    0% { transform: rotateZ(0deg) rotateY(0deg); }
    25% { transform: rotateZ(90deg) rotateY(90deg); }
    50% { transform: rotateZ(180deg) rotateY(180deg); }
    75% { transform: rotateZ(270deg) rotateY(270deg); }
    100% { transform: rotateZ(360deg) rotateY(360deg); }
  }
  
  .animate-spin-3d {
    animation: spin3d 4s linear infinite;
    transform-style: preserve-3d;
  }
`;

interface LoadingScreenProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export default function LoadingScreen({ 
  isLoading, 
  progress = 0, 
  message = "Carregando Domini Horus..." 
}: LoadingScreenProps) {
  const { animationsEnabled } = useAnimations();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  // Simulate smooth progress animation
  useEffect(() => {
    if (progress > displayProgress) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(prev + 2, progress));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress]);

  // Loading messages sequence
  useEffect(() => {
    if (!isLoading) return;

    const messages = [
      "Inicializando Domini Horus...",
      "Carregando projetos...",
      "Sincronizando rotinas...",
      "Preparando dashboard...",
      "Quase pronto..."
    ];

    let messageIndex = 0;
    const messageTimer = setInterval(() => {
      if (messageIndex < messages.length - 1) {
        messageIndex++;
        setCurrentMessage(messages[messageIndex]);
      }
    }, 1500);

    return () => clearInterval(messageTimer);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <>
      {/* Inject 3D animation styles */}
      <style dangerouslySetInnerHTML={{ __html: spin3DStyles }} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.05)_50%,transparent_75%)]" />
      </div>

      {/* Main Loading Content */}
      <div className="relative flex flex-col items-center justify-center space-y-8 p-8">
        {/* Logo Container */}
        <div className="relative">
          {/* Outer Ring Animation */}
          <div 
            className={`absolute inset-0 w-32 h-32 rounded-full border-2 border-primary/20 ${
              animationsEnabled ? 'animate-spin' : ''
            }`}
            style={{ 
              animationDuration: '3s',
              animationTimingFunction: 'linear'
            }}
          />
          
          {/* Inner Ring Animation */}
          <div 
            className={`absolute inset-2 w-28 h-28 rounded-full border-2 border-primary/40 ${
              animationsEnabled ? 'animate-spin' : ''
            }`}
            style={{ 
              animationDuration: '2s',
              animationTimingFunction: 'linear',
              animationDirection: 'reverse'
            }}
          />

          {/* Logo */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div 
              className={`w-20 h-20 ${animationsEnabled ? 'animate-spin-3d' : ''}`}
              style={{
                transformStyle: 'preserve-3d',
                animation: animationsEnabled ? 'spin3d 4s linear infinite' : 'none'
              }}
            >
              <img 
                src="src/assets/images/file.svg"
                onError={(e) => {
                  // Fallback to public directory if assets path fails
                  const target = e.target as HTMLImageElement;
                  target.src = "/domini-logo.png";
                }} 
                alt="Domini Horus" 
                className="w-full h-full object-contain"
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                }}
              />
            </div>
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-primary/10 blur-xl" />
        </div>

        {/* Brand Name */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Domini Horus
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Weekflow Pro
          </p>
        </div>

        {/* Progress Section */}
        <div className="w-80 space-y-4">
          {/* Progress Bar */}
          <div className="relative">
            <Progress 
              value={displayProgress} 
              className="h-2 bg-muted/50"
            />
            {/* Progress Glow */}
            <div 
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-primary/50 to-primary rounded-full blur-sm transition-all duration-300"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          {/* Progress Text */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {currentMessage}
            </span>
            <span className="text-primary font-medium">
              {Math.round(displayProgress)}%
            </span>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 bg-primary rounded-full ${
                animationsEnabled ? 'animate-bounce' : ''
              }`}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* Tip Text */}
        <div className="text-center text-xs text-muted-foreground max-w-md">
          <p>Organizando seus projetos, rotinas e metas para máxima produtividade</p>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/20 rounded-tl-lg" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/20 rounded-tr-lg" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/20 rounded-bl-lg" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/20 rounded-br-lg" />
    </div>
    </>
  );
}
