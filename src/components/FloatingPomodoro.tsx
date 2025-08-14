import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, X, Minimize2, Maximize2, Settings } from 'lucide-react';

export default function FloatingPomodoro() {
  const {
    pomodoroSessions,
    pomodoroSettings,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro
  } = useAppContext();

  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Update current time when active session changes
  useEffect(() => {
    if (activeSession) {
      const session = pomodoroSessions.find(s => s.id === activeSession);
      if (session) {
        if (session.isActive && !session.isPaused) {
          // Calculate remaining time in seconds
          const now = new Date().getTime();
          const startTime = new Date(session.startTime).getTime();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const remainingTime = Math.max(0, (session.duration * 60) - elapsedSeconds);
          
          if (remainingTime <= 0) {
            handleStop();
          } else {
            setCurrentTime(remainingTime);
          }
        } else {
          // If paused, use the remaining time from the session
          const now = new Date().getTime();
          const startTime = new Date(session.startTime).getTime();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const remainingTime = Math.max(0, (session.duration * 60) - elapsedSeconds);
          setCurrentTime(remainingTime);
        }
      }
    } else {
      setCurrentTime(0);
    }
  }, [activeSession, pomodoroSessions]);
  
  // Timer effect
  useEffect(() => {
    if (!activeSession) return;
    
    const session = pomodoroSessions.find(s => s.id === activeSession);
    if (!session || !session.isActive || session.isPaused) return;
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(session.startTime).getTime();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const remainingTime = Math.max(0, (session.duration * 60) - elapsedSeconds);
      
      setCurrentTime(remainingTime);
      
      if (remainingTime <= 0) {
        handleStop();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeSession, pomodoroSessions]);

  const handleStart = async () => {
    const sessionId = await startPomodoro();
    setActiveSession(sessionId);
    setCurrentTime(pomodoroSettings.workDuration * 60);
  };

  const handlePause = () => {
    if (activeSession) {
      pausePomodoro(activeSession);
      // Não resetar o currentTime aqui, apenas pausar
    }
  };

  const handleResume = () => {
    if (activeSession) {
      resumePomodoro(activeSession);
      // Continuar de onde parou
    }
  };

  const handleStop = () => {
    if (activeSession) {
      stopPomodoro(activeSession);
      setActiveSession(null);
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!activeSession) return 0;
    const session = pomodoroSessions.find(s => s.id === activeSession);
    if (!session) return 0;
    const total = session.duration;
    const remaining = currentTime;
    return ((total - remaining) / total) * 100;
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-2xl border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              🍅 Pomodoro
              <Badge variant="outline" className="text-xs">
                {activeSession ? 'Ativo' : 'Parado'}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-primary mb-2">
              {formatTime(currentTime)}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            {!activeSession ? (
              <Button onClick={handleStart} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            ) : (
              <>
                {pomodoroSessions.find(s => s.id === activeSession)?.isPaused ? (
                  <Button onClick={handleResume} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="outline" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                )}
                <Button onClick={handleStop} variant="outline" className="flex-1">
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              </>
            )}
          </div>

          {/* Settings Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Trabalho:</span>
              <span>{pomodoroSettings.workDuration}min</span>
            </div>
            <div className="flex justify-between">
              <span>Pausa Curta:</span>
              <span>{pomodoroSettings.shortBreakDuration}min</span>
            </div>
            <div className="flex justify-between">
              <span>Pausa Longa:</span>
              <span>{pomodoroSettings.longBreakDuration}min</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Config
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Histórico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 