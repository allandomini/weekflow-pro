import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, CheckSquare, DollarSign, Users, Plus, Edit, Trash2, Clock, Sparkles, TrendingUp, AlertCircle, CheckCircle, Calendar, Zap } from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, addDays, addMonths, addYears } from "date-fns";
import { Task } from "@/types";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { tasks, projects, accounts, contacts, transactions, addTask, updateTask, deleteTask } = useAppContext();

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
  });

  const today = new Date();
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const todayTasks = tasks.filter(task => isToday(task.date));
  const completedToday = todayTasks.filter(task => task.completed);
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const generateStephanyRecommendations = () => {
    const newRecommendations = [];
    
    // Task analysis
    const overdueTasks = tasks.filter(task => 
      !task.completed && new Date(task.date) < new Date()
    );
    
    if (overdueTasks.length > 0) {
      newRecommendations.push({
        id: 'overdue-tasks',
        title: `📅 ${overdueTasks.length} tarefas em atraso`,
        description: 'Stephany sugere priorizar essas tarefas para melhorar sua produtividade.',
        type: 'tasks' as const,
        priority: 'high' as const,
        action: 'Revisar agora'
      });
    }

    // Productivity insights
    const completionRate = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length * 100).toFixed(0) : 0;
    if (Number(completionRate) < 70) {
      newRecommendations.push({
        id: 'low-completion',
        title: `📊 Taxa de conclusão: ${completionRate}%`,
        description: 'Stephany recomenda quebrar tarefas grandes em menores para aumentar a produtividade.',
        type: 'productivity' as const,
        priority: 'medium' as const,
        action: 'Ver dicas'
      });
    }

    // Financial insights
    const expenses = transactions.filter(t => t.type === 'withdrawal');
    const lastWeekExpenses = expenses.filter(t => 
      new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (lastWeekExpenses.length > 15) {
      newRecommendations.push({
        id: 'high-spending',
        title: `💰 ${lastWeekExpenses.length} gastos esta semana`,
        description: 'Stephany identificou um padrão de gastos elevado. Considere revisar seu orçamento.',
        type: 'finance' as const,
        priority: 'medium' as const,
        action: 'Analisar gastos'
      });
    }

    // Project insights
    const projectsWithoutTasks = projects.filter(project => 
      !tasks.some(task => task.projectId === project.id)
    );
    
    if (projectsWithoutTasks.length > 0) {
      newRecommendations.push({
        id: 'empty-projects',
        title: `🚀 ${projectsWithoutTasks.length} projetos precisam de tarefas`,
        description: 'Stephany sugere adicionar tarefas ou arquivar projetos inativos.',
        type: 'projects' as const,
        priority: 'low' as const,
        action: 'Organizar'
      });
    }

    // Motivation boost
    if (completedToday.length > 3) {
      newRecommendations.push({
        id: 'great-day',
        title: `🎉 Excelente produtividade hoje!`,
        description: `Stephany parabeniza: você completou ${completedToday.length} tarefas hoje. Continue assim!`,
        type: 'productivity' as const,
        priority: 'low' as const,
        action: 'Celebrar'
      });
    }

    setRecommendations(newRecommendations.slice(0, 4)); // Mostra no máximo 4 recomendações
  };

  useEffect(() => {
    generateStephanyRecommendations();
  }, [tasks, projects, transactions, completedToday.length]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <TrendingUp className="w-4 h-4" />;
      case 'finance': return <DollarSign className="w-4 h-4" />;
      case 'tasks': return <CheckSquare className="w-4 h-4" />;
      case 'projects': return <Calendar className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200';
      default: return 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => 
      task.date.toDateString() === day.toDateString()
    );
  };

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
        const getOccurrences = () => {
          if (taskForm.repeatAlways) {
            switch (taskForm.repeatUnit) {
              case "day":
                return 60;
              case "week":
                return 26;
              case "month":
                return 12;
              case "year":
                return 5;
              default:
                return 12;
            }
          }
          return Math.max(1, Number(taskForm.repeatCount) || 1);
        };

        const occurrences = getOccurrences();
        for (let i = 0; i < occurrences; i++) {
          let date = baseDate;
          if (i > 0) {
            if (taskForm.repeatUnit === "day") date = addDays(baseDate, i);
            if (taskForm.repeatUnit === "week") date = addWeeks(baseDate, i);
            if (taskForm.repeatUnit === "month") date = addMonths(baseDate, i);
            if (taskForm.repeatUnit === "year") date = addYears(baseDate, i);
          }
          addTask({
            ...baseData,
            date,
            completed: false,
          });
        }
      }
    }

    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
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
    });
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Recomendações da Stephany removidas do Dashboard por solicitação */}

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-left">
        <div>
          <h1 className="text-3xl font-bold text-foreground transition-colors duration-200">Dashboard</h1>
          <p className="text-muted-foreground transition-colors duration-200">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button 
          variant="default" 
          onClick={handleCreateTask} 
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-soft hover:shadow-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="modern-card animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Tarefas Hoje</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary transition-colors duration-200">{completedToday.length}/{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              {todayTasks.length > 0 ? `${Math.round((completedToday.length / todayTasks.length) * 100)}% completo` : 'Nenhuma tarefa'}
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Projetos Ativos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent transition-colors duration-200">{projects.length}</div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              Projetos em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success transition-colors duration-200">
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card animate-fade-in-up hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ animationDelay: '400ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning transition-colors duration-200">{contacts.length}</div>
            <p className="text-xs text-muted-foreground transition-colors duration-200">
              Total de contatos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário Semanal */}
        <Card className="modern-card animate-fade-in-left hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CalendarDays className="w-5 h-5 text-primary transition-colors duration-200" />
              Calendário Semanal
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeekDate(prev => subWeeks(prev, 1))}
                aria-label="Semana anterior"
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                ←
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeekDate(prev => addWeeks(prev, 1))}
                aria-label="Próxima semana"
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
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs">
                    {getTasksForDay(day).length} tarefa{getTasksForDay(day).length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tarefas de Hoje */}
        <Card className="modern-card animate-fade-in-right hover:shadow-medium transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckSquare className="w-5 h-5 text-success transition-colors duration-200" />
              {selectedDate ? `Tarefas de ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}` : 'Tarefas de Hoje'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(selectedDate ? getTasksForDay(selectedDate) : todayTasks).length === 0 ? (
                <p className="text-muted-foreground text-center py-4 transition-colors duration-200">
                  Nenhuma tarefa para este dia
                </p>
              ) : (
                [...(selectedDate ? getTasksForDay(selectedDate) : todayTasks)].sort((a, b) => {
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
                             <Badge variant="destructive" className="text-xs animate-pulse">
                               ATRASADA
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
                          onClick={() => handleDeleteTask(task.id)}
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
          </CardContent>
        </Card>
      </div>
      {/* Dialog para Nova Tarefa */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-foreground">Título</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da tarefa"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-foreground">Descrição</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="project" className="text-foreground">Projeto</Label>
              <Select
                value={taskForm.projectId}
                onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value === "none" ? "" : value }))}
              >
                <SelectTrigger className="modern-input">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent className="modern-dropdown">
                  <SelectItem value="none">Nenhum projeto</SelectItem>
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
                <Label htmlFor="startTime" className="text-foreground">Hora de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={taskForm.startTime}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="modern-input"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-foreground">Hora de Fim</Label>
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
              <Label htmlFor="isRoutine" className="text-foreground">Tarefa de rotina</Label>
            </div>
            {taskForm.isRoutine && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-foreground block mb-1">Frequência</Label>
                  <Select
                    value={taskForm.repeatUnit}
                    onValueChange={(value) => setTaskForm(prev => ({ ...prev, repeatUnit: value as any }))}
                  >
                    <SelectTrigger className="modern-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="modern-dropdown">
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground block mb-1">Quantidade</Label>
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
                  <Label htmlFor="repeatAlways" className="text-foreground">Sempre</Label>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSaveTask} 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-soft hover:shadow-medium"
              >
                Criar Tarefa
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsTaskDialogOpen(false)}
                className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-accent"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}