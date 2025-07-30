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
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task } from "@/types";

export default function Calendar() {
  const { tasks, projects, addTask, updateTask, deleteTask } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    startTime: "",
    endTime: "",
    isRoutine: false
  });

  // Calendário semanal
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calendário mensal
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
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
      isRoutine: false
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
      isRoutine: task.isRoutine
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
      completed: false
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
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
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Visão Semanal
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(weekStart, "d MMM", { locale: ptBR })} - {format(weekEnd, "d MMM yyyy", { locale: ptBR })}
            </p>
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
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  ←
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
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
              {weeks.map((week) => 
                eachDayOfInterval({ start: week, end: endOfWeek(week, { weekStartsOn: 1 }) })
                  .map((day) => {
                    const dayTasks = getTasksForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);
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
                              : isCurrentMonth 
                                ? 'bg-card hover:bg-accent/50' 
                                : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className={`text-sm font-medium ${
                          isToday ? 'text-primary-foreground' : 
                          isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
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
                  })
              )}
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
                          : 'bg-card border-border hover:bg-accent/50'
                      }`}
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
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
                onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum projeto</SelectItem>
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