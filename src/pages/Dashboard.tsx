import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/SupabaseAppContext';
import { useRoutinesOptimized } from '../hooks/useRoutinesOptimized';
import { useOffline } from '../hooks/useOffline';
import { useAnimations } from '../contexts/AnimationContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import RoutinesManager from '../components/RoutinesManager';
import { RoutineLoadingIndicator } from '@/components/RoutineLoadingIndicator';
import { OfflineStatus } from '../components/OfflineStatus';

import { 
  ArrowLeft, Plus, Edit, Trash2, Settings, Calendar, Clock, 
  Repeat, Target, Play, Pause, SkipForward, MoreHorizontal,
  CheckSquare, DollarSign, Users, TrendingUp, CheckCircle, XCircle,
  CalendarDays, Sparkles, AlertCircle, Zap, Loader2
} from 'lucide-react';
import { format, isToday, isYesterday, isTomorrow, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, addMonths, addYears } from 'date-fns';
import { Task, Project, Routine } from '../types';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, projects, accounts, contacts, transactions, addTask, updateTask, deleteTask, addRoutine, skipRoutineDay, skipRoutineBetween, hardDeleteRoutine, routineLoading } = useAppContext();
  
  // Use optimized routines hook - this provides better state management
  const { routines, routineCompletions, completeRoutine, getRoutineProgress, loading: routinesLoading } = useRoutinesOptimized();
  
  // Use offline functionality
  const { isOnline, saveOffline, loadOffline, syncOfflineData } = useOffline();
  
  const { toast } = useToast();
  const { animationsEnabled } = useAnimations();
  const { t } = useTranslation();

  // Stephany's AI Recommendations
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    title: string;
    description: string;
    type: 'productivity' | 'finance' | 'tasks' | 'projects';
    priority: 'high' | 'medium' | 'low';
    action?: string;
  }>>([]);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [routinesManagerOpen, setRoutinesManagerOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    startTime: "",
    endTime: "",
    isRoutine: false,
    repeatUnit: "day" as "day" | "week" | "month" | "year",
    repeatCount: 7,
    repeatAlways: false,
    // New routine fields
    routineTimesPerDay: 1,
    routineSpecificTimes: [] as string[],
    routineWeekdays: [] as number[],
    routineDurationDays: null as number | null,
    routinePriority: "medium" as "low" | "medium" | "high",
  });

  const today = new Date();
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; task: Task | null; mode: 'single' }>({ open: false, task: null, mode: 'single' });

  // Helper: yyyy-MM-dd from local date
  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Optimized getTasksForDay function that uses the optimized routines hook
  const getTasksForDay = useCallback((day: Date) => {
    const sameDayTasks = tasks.filter(task => task.date.toDateString() === day.toDateString());
    
    // Generate virtual routine occurrences based on routines definitions and completions
    const dayStr = toYmd(day);
    const virtuals: Task[] = [];
    
    for (const r of routines) {
      if (r.deletedAt) continue;
      
      // Active window checks
      if (r.activeFrom && r.activeFrom > dayStr) continue;
      if (r.activeTo && r.activeTo < dayStr) continue;
      
      // Get progress from the optimized hook - this ensures consistency
      const progress = getRoutineProgress(r.id, dayStr);
      
      if (progress.skipped || progress.paused) continue;
      
      // Check weekday filter
      const dow = day.getDay(); // 0-6 Sun-Sat
      if (r.weekdays && r.weekdays.length > 0 && !r.weekdays.includes(dow)) continue;
      
      // Check duration limit
      if (r.durationDays) {
        const startDate = new Date(r.activeFrom);
        const currentDate = new Date(dayStr);
        const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= r.durationDays) continue;
      }
      
      // Get specific times for this day
      const times = r.specificTimes && r.specificTimes.length > 0 ? r.specificTimes : ['09:00'];
      
      // Create virtual tasks for each time slot
      for (let i = 0; i < progress.goal; i++) {
        // Check if this specific occurrence is completed
        // Use the actual completion count from the hook
        const isCompleted = i < progress.count;
        
        virtuals.push({
          // Synthetic ID encoding routine occurrence
          id: `routine:${r.id}:${dayStr}:${i}`,
          title: r.name,
          description: r.description,
          completed: isCompleted,
          projectId: undefined,
          date: day,
          startTime: i < times.length ? times[i] : `${i + 1}ª vez`,
          endTime: undefined,
          isRoutine: true,
          isOverdue: false,
          createdAt: day,
          updatedAt: day,
        });
      }
    }
    
    return [...sameDayTasks, ...virtuals];
  }, [tasks, routines, getRoutineProgress, routineCompletions]); // Added routineCompletions dependency

  // Memoized computed values for better performance - moved after getTasksForDay definition
  const todayTasks = useMemo(() => getTasksForDay(today), [getTasksForDay]);
  const completedToday = useMemo(() => todayTasks.filter(t => t.completed), [todayTasks]);
  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  // Force re-render when routine completions change
  useEffect(() => {
    // This will trigger a re-render when routines or completions change
    // The optimized hook handles the state management automatically
  }, [routines, routineCompletions, getTasksForDay]);


  const handleRequestDelete = (task: Task) => {
    // Para rotinas, sempre usar modo single (deletar completamente)
    // Para tarefas normais, usar modo single
    setDeleteModal({ open: true, task, mode: 'single' });
  };

  const handleConfirmDeleteSingle = () => {
    if (!deleteModal.task) return;
    const task = deleteModal.task;
    if (task.id.startsWith('routine:')) {
      const [, routineId] = task.id.split(':');
      // DELETAR a rotina completamente
      hardDeleteRoutine(routineId);
      
      toast({
        title: t('routines.deleted'),
        description: t('routines.deleted_description'),
      });
    } else {
      deleteTask(task.id);
    }
    setDeleteModal({ open: false, task: null, mode: 'single' });
  };


  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getProjectById = (projectId?: string) => {
    return projects.find(p => p.id === projectId);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      projectId: "",
      startTime: "",
      endTime: "",
      isRoutine: false,
      repeatUnit: "day",
      repeatCount: 7,
      repeatAlways: false,
      // New routine fields
      routineTimesPerDay: 1,
      routineSpecificTimes: [],
      routineWeekdays: [],
      routineDurationDays: null,
      routinePriority: "medium",
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) return;

    const baseData = {
      title: taskForm.title,
      description: taskForm.description,
      projectId: taskForm.projectId || undefined,
      startTime: taskForm.startTime || undefined,
      endTime: taskForm.endTime || undefined,
      isRoutine: taskForm.isRoutine,
      isOverdue: false,
    } as const;

    if (editingTask) {
      updateTask(editingTask.id, { ...baseData });
    } else {
      const baseDate = selectedDate || new Date();
      if (!taskForm.isRoutine) {
        addTask({
          ...baseData,
          date: baseDate,
          completed: false,
        });
      } else {
        // Create a Routine definition instead of materializing occurrences
        const baseDayStr = toYmd(baseDate);
        // Map repeatUnit to a schedule; default to daily
        let schedule: { type: 'daily' | 'weekly' | 'customDays'; daysOfWeek?: number[] } = { type: 'daily' };
        if (taskForm.repeatUnit === 'week') {
          schedule = { type: 'weekly', daysOfWeek: [baseDate.getDay()] };
        }
        // For month/year we fallback to daily for now
        addRoutine({
          name: taskForm.title,
          description: taskForm.description,
          color: '#3b82f6', // Cor padrão azul
          timesPerDay: taskForm.routineTimesPerDay,
          specificTimes: taskForm.routineSpecificTimes,
          weekdays: taskForm.routineWeekdays,
          durationDays: taskForm.routineDurationDays,
          priority: taskForm.routinePriority,
          schedule,
          activeFrom: baseDayStr,
          activeTo: undefined,
          pausedUntil: undefined,
        });
      }
    }

    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (taskId.startsWith('routine:')) {
      // routine:<routineId>:<yyyy-MM-dd>:<idx>
      const parts = taskId.split(':');
      const routineId = parts[1];
      const dateStr = parts[2];
      const occurrenceIndex = parseInt(parts[3]);
      
      if (completed) {
        if (isOnline) {
          // Complete the routine online
          await completeRoutine(routineId, dateStr);
        } else {
          // Save offline when no internet connection
          const offlineCompletions = loadOffline('routineCompletions') || {};
          const dayCompletions = offlineCompletions[dateStr] || {};
          
          const currentCount = dayCompletions[routineId]?.count || 0;
          dayCompletions[routineId] = {
            id: `offline-${Date.now()}`,
            routineId,
            date: dateStr,
            count: currentCount + 1,
            goal: 1,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          offlineCompletions[dateStr] = dayCompletions;
          saveOffline('routineCompletions', offlineCompletions);
          
          toast({
            title: t('offline.routine_completed'),
            description: t('offline.sync_when_online'),
          });
        }
        
        // The optimized hook handles state updates automatically
        // No need for manual state management here
      } else {
        // For now, we don't support uncompleting routines
        // This would require more complex logic to handle partial completions
        // The user can use the routines manager to reset completions if needed
        // Uncompleting routines is not supported yet
      }
      return;
    }
    
    if (isOnline) {
      updateTask(taskId, { completed });
    } else {
      // Save task completion offline
      const offlineTasks = loadOffline('tasks') || [];
      const taskIndex = offlineTasks.findIndex(t => t.id === taskId);
      
      if (taskIndex >= 0) {
        offlineTasks[taskIndex].completed = completed;
      } else {
        offlineTasks.push({ id: taskId, completed, updatedAt: new Date().toISOString() });
      }
      
      saveOffline('tasks', offlineTasks);
      
      toast({
        title: t('offline.task_updated'),
        description: t('offline.sync_when_online'),
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      projectId: task.projectId || "",
      startTime: task.startTime || "",
      endTime: task.endTime || "",
      isRoutine: task.isRoutine,
      repeatUnit: "day",
      repeatCount: 7,
      repeatAlways: false,
      // New routine fields
      routineTimesPerDay: 1,
      routineSpecificTimes: [],
      routineWeekdays: [],
      routineDurationDays: null,
      routinePriority: "medium",
    });
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleOpenRoutinesManager = (routine: Routine) => {
    setSelectedRoutine(routine);
    setRoutinesManagerOpen(true);
  };

  const handleCloseRoutinesManager = () => {
    setRoutinesManagerOpen(false);
    setSelectedRoutine(null);
  };

  return (
    <div className={`space-y-6 ${animationsEnabled ? 'animate-fade-in' : ''}`}>
      <div className={`flex items-center justify-between ${animationsEnabled ? 'animate-slide-down' : ''}`}>
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsTaskDialogOpen(true)} className="shadow-elegant">
            <Plus className="h-4 w-4 mr-2" />
            {t('tasks.create_task')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`modern-card ${animationsEnabled ? 'animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]' : ''}`} style={animationsEnabled ? { animationDelay: '100ms' } : {}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('tasks.title')} {t('time.today')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary transition-colors duration-200">{completedToday.length}/{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              {todayTasks.length > 0 ? `${Math.round((completedToday.length / todayTasks.length) * 100)}% ${t('dashboard.complete')}` : t('dashboard.no_tasks')}
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('dashboard.active_projects')}</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent transition-colors duration-200">{projects.length}</div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              {t('dashboard.projects_in_progress')}
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('dashboard.total_balance')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success transition-colors duration-200">
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              {accounts.length} {accounts.length === 1 ? t('dashboard.account') : t('dashboard.accounts')}
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ animationDelay: '400ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('dashboard.contacts')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning transition-colors duration-200">{contacts.length}</div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              {t('dashboard.total_contacts')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Calendar */}
        <Card className="modern-card animate-fade-in-left hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CalendarDays className="w-5 h-5 text-primary transition-colors duration-200" />
{t('dashboard.weekly_calendar')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeekDate(prev => subWeeks(prev, 1))}
                aria-label={t('dashboard.previous_week')}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                ←
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeekDate(prev => addWeeks(prev, 1))}
                aria-label={t('dashboard.next_week')}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={`
                    p-2 text-center rounded-lg transition-all duration-200 cursor-pointer
                    ${isToday(day) 
                      ? 'bg-primary text-primary-foreground shadow-soft scale-105' 
                      : 'hover:bg-muted hover:scale-105'
                    }
                    ${selectedDate?.toDateString() === day.toDateString() 
                      ? 'ring-2 ring-primary/20 bg-accent' 
                      : ''
                    }
                  `}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs">
                    {getTasksForDay(day).length} {getTasksForDay(day).length === 1 ? t('tasks.task') : t('tasks.tasks')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="modern-card animate-fade-in-right hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckSquare className="w-5 h-5 text-success transition-colors duration-200" />
              {selectedDate ? `${t('tasks.title')} ${t('common.of')} ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}` : t('dashboard.tasks_today')}
            </CardTitle>
            <Button variant="ghost" size="icon" aria-label={t('dashboard.open_history')} onClick={() => navigate('/historico')} className="hover:scale-105 active:scale-95 transition-transform">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            {routinesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common.loading')}...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(selectedDate ? getTasksForDay(selectedDate) : getTasksForDay(today)).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 transition-colors duration-200">
{t('dashboard.no_tasks_for_day')}
                  </p>
                ) : (
                [...(selectedDate ? getTasksForDay(selectedDate) : getTasksForDay(today))].sort((a, b) => {
                  const aKey = a.startTime || '';
                  const bKey = b.startTime || '';
                  return aKey.localeCompare(bKey);
                }).map((task, index) => {
                  const project = getProjectById(task.projectId);
                  return (
                     <div 
                       key={task.id} 
                       className={`
                         flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01] hover:shadow-soft
                         ${task.completed 
                           ? 'bg-success/10 border-success/20' 
                           : task.isOverdue
                             ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                             : 'bg-card border-border hover:bg-accent/50'
                         }
                       `}
                       style={{ animationDelay: `${index * 50}ms` }}
                     >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                        className="transition-all duration-200 hover:scale-110"
                      />
                       <div className="flex-1">
                         <div className={`font-medium transition-all duration-200 flex items-center gap-2 ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                           {task.title}
                           {task.isOverdue && !task.completed && (
                             <Badge variant="destructive" className="text-xs">
                               {t('tasks.overdue')}
                             </Badge>
                           )}
                         </div>
                        <div className="flex items-center gap-2 mt-2">
                          {project && (
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: project.color + '20', borderColor: project.color }}
                              className="text-xs transition-all duration-200 hover:scale-105"
                            >
                              {project.name}
                            </Badge>
                          )}
                          {(task.startTime || task.endTime) && (
                            <Badge variant="secondary" className="text-xs transition-all duration-200 hover:scale-105">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.startTime && task.endTime 
                                ? `${task.startTime} - ${task.endTime}`
                                : task.startTime || task.endTime
                              }
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className={`text-sm mt-2 transition-all duration-200 ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                          className="transition-all duration-200 hover:scale-110 hover:bg-accent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRequestDelete(task)}
                          className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Dialog para Nova Tarefa */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('tasks.new_task')}</DialogTitle>
            <DialogDescription>
              {t('tasks.create_task_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-foreground">{t('tasks.title')}</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('tasks.title_placeholder')}
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-foreground">{t('tasks.description')}</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('tasks.description_placeholder')}
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="project" className="text-foreground">{t('projects.project')}</Label>
              <Select
                value={taskForm.projectId}
                onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value === "none" ? "" : value }))}
              >
                <SelectTrigger className="modern-input">
                  <SelectValue placeholder={t('projects.select_project')} />
                </SelectTrigger>
                <SelectContent className="modern-dropdown">
                  <SelectItem value="none">{t('projects.no_project')}</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-foreground">{t('tasks.start_time')}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={taskForm.startTime}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="modern-input"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-foreground">{t('tasks.end_time')}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={taskForm.endTime}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className="modern-input"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRoutine"
                checked={taskForm.isRoutine}
                onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, isRoutine: !!checked }))}
                className="transition-all duration-200 hover:scale-110"
              />
              <Label htmlFor="isRoutine" className="text-foreground">{t('tasks.routine_task')}</Label>
            </div>
            {taskForm.isRoutine && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground block mb-1">{t('routines.times_per_day')}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={taskForm.routineTimesPerDay}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, routineTimesPerDay: Number(e.target.value) }))}
                      className="modern-input"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground block mb-1">{t('routines.duration_days')}</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t('routines.leave_empty_forever')}
                      value={taskForm.routineDurationDays || ''}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, routineDurationDays: e.target.value ? Number(e.target.value) : null }))}
                      className="modern-input"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-foreground block mb-2">{t('routines.specific_times')}</Label>
                  <div className="space-y-2">
                    {taskForm.routineSpecificTimes.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...taskForm.routineSpecificTimes];
                            newTimes[index] = e.target.value;
                            setTaskForm(prev => ({ ...prev, routineSpecificTimes: newTimes }));
                          }}
                          className="modern-input flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTimes = taskForm.routineSpecificTimes.filter((_, i) => i !== index);
                            setTaskForm(prev => ({ ...prev, routineSpecificTimes: newTimes }));
                          }}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTaskForm(prev => ({ ...prev, routineSpecificTimes: [...prev.routineSpecificTimes, '09:00'] }))}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('routines.add_time')}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground block mb-2">{t('dashboard.weekdays.title')}</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {[t('dashboard.weekdays.sunday_short'), t('dashboard.weekdays.monday_short'), t('dashboard.weekdays.tuesday_short'), t('dashboard.weekdays.wednesday_short'), t('dashboard.weekdays.thursday_short'), t('dashboard.weekdays.friday_short'), t('dashboard.weekdays.saturday_short')].map((day, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`weekday-${index}`}
                          checked={taskForm.routineWeekdays.includes(index)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTaskForm(prev => ({ ...prev, routineWeekdays: [...prev.routineWeekdays, index] }));
                            } else {
                              setTaskForm(prev => ({ ...prev, routineWeekdays: prev.routineWeekdays.filter(d => d !== index) }));
                            }
                          }}
                          className="transition-all duration-200 hover:scale-110"
                        />
                        <Label htmlFor={`weekday-${index}`} className="text-xs text-center">{day}</Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {taskForm.routineWeekdays.length === 0 ? t('dashboard.weekdays.select_all_days') : 
                     taskForm.routineWeekdays.length === 7 ? t('dashboard.weekdays.all_days_selected') :
                     t('dashboard.weekdays.days_selected', { count: taskForm.routineWeekdays.length })}
                  </p>
                </div>

                <div>
                  <Label className="text-foreground block mb-1">{t('common.priority')}</Label>
                  <Select
                    value={taskForm.routinePriority}
                    onValueChange={(value) => setTaskForm(prev => ({ ...prev, routinePriority: value as "low" | "medium" | "high" }))}
                  >
                    <SelectTrigger className="modern-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="modern-dropdown">
                      <SelectItem value="low">{t('common.priority_low')}</SelectItem>
                      <SelectItem value="medium">{t('common.priority_medium')}</SelectItem>
                      <SelectItem value="high">{t('common.priority_high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-foreground block mb-1">{t('routines.frequency')}</Label>
                    <Select
                      value={taskForm.repeatUnit}
                      onValueChange={(value) => setTaskForm(prev => ({ ...prev, repeatUnit: value as any }))}
                    >
                      <SelectTrigger className="modern-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="modern-dropdown">
                        <SelectItem value="day">{t('time.day')}</SelectItem>
                        <SelectItem value="week">{t('time.week')}</SelectItem>
                        <SelectItem value="month">{t('time.month')}</SelectItem>
                        <SelectItem value="year">{t('time.year')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground block mb-1">{t('common.quantity')}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={taskForm.repeatCount}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, repeatCount: Number(e.target.value) }))}
                      className="modern-input"
                      disabled={taskForm.repeatAlways}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="repeatAlways"
                      checked={taskForm.repeatAlways}
                      onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, repeatAlways: !!checked }))}
                      className="transition-all duration-200 hover:scale-110"
                    />
                    <Label htmlFor="repeatAlways" className="text-foreground">{t('common.always')}</Label>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSaveTask} 
                disabled={routineLoading}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-soft hover:shadow-medium"
              >
                {routineLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('common.creating')}...</span>
                  </div>
                ) : (
                  t('tasks.create_task')
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsTaskDialogOpen(false)}
                disabled={routineLoading}
                className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-accent"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks.delete_task')}</DialogTitle>
            <DialogDescription>
              {deleteModal.task?.isRoutine
                ? t('tasks.delete_routine_description')
                : t('tasks.delete_task_confirmation')}
            </DialogDescription>
          </DialogHeader>
                        {deleteModal.task?.isRoutine && (
            <div className="space-y-3">
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>{t('common.attention')}:</strong> {t('routines.delete_warning')}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {deleteModal.task?.isRoutine ? (
              <Button className="flex-1" onClick={handleConfirmDeleteSingle}>
                {t('routines.delete_permanently')}
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleConfirmDeleteSingle}>{t('common.confirm')}</Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModal({ open: false, task: null, mode: 'single' })}>
              {t('common.cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routines Manager Modal */}
      {routinesManagerOpen && selectedRoutine && (
        <RoutinesManager
          routine={selectedRoutine}
          onClose={handleCloseRoutinesManager}
        />
      )}

      {/* Offline Status Component */}
      <OfflineStatus />
    </div>
  );
}