import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Plus, Clock, Edit, Trash2, CheckSquare } from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  addYears
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task } from "@/types";

export default function Calendar() {
  const { tasks, projects, addTask, updateTask, deleteTask } = useApp();
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  // Calendário semanal
  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calendário mensal
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const weeks = eachWeekOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => isSameDay(task.date, day));
  };

  const getProjectById = (projectId?: string) => {
    return projects.find(p => p.id === projectId);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setTaskForm(prev => ({ ...prev }));
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

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) return;

    const taskData = {
      title: taskForm.title,
      description: taskForm.description,
      projectId: taskForm.projectId || undefined,
      date: selectedDate || new Date(),
      startTime: taskForm.startTime || undefined,
      endTime: taskForm.endTime || undefined,
      isRoutine: taskForm.isRoutine,
      completed: false,
      isOverdue: false
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      if (!taskForm.isRoutine) {
        addTask(taskData);
      } else {
        const baseDate = selectedDate || new Date();
        const getOccurrences = () => {
          if (taskForm.repeatAlways) {
            switch (taskForm.repeatUnit) {
              case "day":
                return 60; // próximos 60 dias
              case "week":
                return 26; // próximas 26 semanas (~6 meses)
              case "month":
                return 12; // próximos 12 meses
              case "year":
                return 5; // próximos 5 anos
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
          addTask({ ...taskData, date });
        }
      }
    }

    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendário</h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas e eventos
          </p>
        </div>
        <Button variant="gradient" onClick={handleCreateTask} className="animate-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Calendário Semanal */}
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Visão Semanal
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(weekStart, "d MMM", { locale: ptBR })} - {format(weekEnd, "d MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentWeekDate(prev => subWeeks(prev, 1))}
                >
                  ←
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentWeekDate(prev => addWeeks(prev, 1))}
                >
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div 
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-accent border-accent-foreground shadow-md' 
                        : isToday 
                          ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                          : 'bg-card border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-xs font-medium ${
                        isToday ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}>
                        {dayNames[index]}
                      </div>
                      <div className={`text-lg font-bold ${
                        isToday ? 'text-primary-foreground' : 'text-foreground'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div 
                              key={task.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                task.completed 
                                  ? 'bg-success/20 text-success' 
                                  : 'bg-accent text-accent-foreground'
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayTasks.length - 2} mais
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Calendário Mensal */}
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-accent" />
                  Visão Mensal
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                   {format(currentMonthDate, "MMMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonthDate(prev => subMonths(prev, 1))}
                >
                  ←
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonthDate(prev => addMonths(prev, 1))}
                >
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div 
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`p-2 rounded cursor-pointer transition-all min-h-[60px] ${
                      isSelected 
                        ? 'bg-accent border border-accent-foreground' 
                        : isToday 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      isToday ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          dayTasks.some(t => !t.completed) ? 'bg-warning' : 'bg-success'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      

      {/* Tarefas do Dia Selecionado */}
      {selectedDate && (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-success" />
              Tarefas de {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTasksForDay(selectedDate).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma tarefa para este dia
                </p>
              ) : (
                getTasksForDay(selectedDate).map((task) => {
                  const project = getProjectById(task.projectId);
                  return (
                     <div 
                       key={task.id} 
                       className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                         task.completed 
                           ? 'bg-success/10 border-success/20' 
                           : task.isOverdue
                             ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                             : 'bg-card border-border hover:bg-accent/50'
                       }`}
                     >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                      />
                       <div className="flex-1">
                         <div className={`font-medium flex items-center gap-2 ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                           {task.title}
                           {task.isOverdue && !task.completed && (
                             <Badge variant="destructive" className="text-xs animate-pulse">
                               ATRASADA
                             </Badge>
                           )}
                         </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {project && (
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: project.color + '20', borderColor: project.color }}
                              className="text-xs"
                            >
                              {project.name}
                            </Badge>
                          )}
                          {task.startTime && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.startTime} {task.endTime && `- ${task.endTime}`}
                            </Badge>
                          )}
                          {task.isRoutine && (
                            <Badge variant="outline" className="text-xs">
                              Rotina
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
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
      )}

      {/* Dialog para Nova/Editar Tarefa */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da tarefa"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
              />
            </div>
            <div>
              <Label htmlFor="project">Projeto</Label>
              <Select
                value={taskForm.projectId}
                onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
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
                <Label htmlFor="startTime">Hora de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={taskForm.startTime}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Hora de Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={taskForm.endTime}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRoutine"
                checked={taskForm.isRoutine}
                onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, isRoutine: !!checked }))}
              />
              <Label htmlFor="isRoutine">Tarefa de rotina</Label>
            </div>
            {taskForm.isRoutine && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="block mb-1">Frequência</Label>
                  <Select
                    value={taskForm.repeatUnit}
                    onValueChange={(value) => setTaskForm(prev => ({ ...prev, repeatUnit: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block mb-1">Quantidade</Label>
                  <Input
                    type="number"
                    min={1}
                    value={taskForm.repeatCount}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, repeatCount: Number(e.target.value) }))}
                    disabled={taskForm.repeatAlways}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="repeatAlways"
                    checked={taskForm.repeatAlways}
                    onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, repeatAlways: !!checked }))}
                  />
                  <Label htmlFor="repeatAlways">Sempre</Label>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveTask} className="flex-1">
                {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}