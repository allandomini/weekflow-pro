import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Plus, 
  X, 
  ListChecks, 
  StickyNote, 
  Wallet, 
  Calendar, 
  Image as ImageIcon, 
  FileText,
  Trash2,
  Edit,
  Clock,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  showInDashboard: boolean;
}

interface CanvasItem {
  id: string;
  type: 'todo' | 'note' | 'finance' | 'routine' | 'image' | 'document';
  position: { x: number; y: number };
  data: any;
  createdAt: Date;
}

export default function ProjectCanvas() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { 
    projects, 
    addTask, 
    addNote, 
    addProjectWalletEntry,
    addProjectImage 
  } = useAppContext();

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  // Load canvas items from localStorage on initial render
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`projectCanvas_${projectId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert string dates back to Date objects
          return parsed.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            data: {
              ...item.data,
              // Convert any date strings in data back to Date objects if needed
              ...(item.data.dueDate && { dueDate: new Date(item.data.dueDate) })
            }
          }));
        } catch (e) {
          console.error('Failed to parse saved canvas items', e);
          return [];
        }
      }
    }
    return [];
  });
  const [draggedItem, setDraggedItem] = useState<CanvasItem | null>(null);
  const [editingItem, setEditingItem] = useState<CanvasItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingTask, setEditingTask] = useState<{ itemId: string; taskId: string } | null>(null);

  // Forms for different item types
  const [todoForm, setTodoForm] = useState({ 
    title: "",
    tasks: [] as TodoTask[]
  });
  const [newTaskText, setNewTaskText] = useState("");
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  interface FinanceFormData {
    type: 'deposit' | 'withdrawal' | 'investment' | 'debt';
    category: string;
    amount: string;
    description: string;
    date: string;
    expectedReturn: string;
    riskLevel: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed' | 'cancelled';
    isRecurring: boolean;
    recurrence: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      endDate: string;
    };
  }

  const [financeForm, setFinanceForm] = useState<FinanceFormData>({
    type: 'deposit',
    category: 'outro',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    expectedReturn: '',
    riskLevel: 'medium',
    status: 'pending',
    isRecurring: false,
    recurrence: {
      frequency: 'monthly',
      endDate: ''
    }
  });
  const [routineForm, setRoutineForm] = useState({ 
    title: "", 
    description: "",
    timesPerDay: 1,
    weekdays: [] as number[]
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Projeto não encontrado.
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/projects')}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar para Projetos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddCanvasItem = (type: CanvasItem['type']) => {
    const newItem: CanvasItem = {
      id: Date.now().toString(),
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {},
      createdAt: new Date()
    };

    setCanvasItems(prev => {
      const updated = [...prev, newItem];
      // Save to localStorage
      if (typeof window !== 'undefined' && projectId) {
        try {
          localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save canvas items', e);
        }
      }
      return updated;
    });
    setEditingItem(newItem);
    setIsSideMenuOpen(false);
  };

  const handleSaveItem = async (item: CanvasItem) => {
    if (!project) return;
    
    switch (item.type) {
      case 'todo': {
        const dashboardTasks = item.data.tasks?.filter((task: TodoTask) => task.showInDashboard) || [];
        
        for (const task of dashboardTasks) {
          if (!task.completed) {
            addTask({
              title: task.text,
              description: `Do projeto: ${project.name}`,
              projectId: project.id,
              date: new Date(),
              completed: false,
              isRoutine: false,
              isOverdue: false
            });
          }
        }
        
        const updatedTodo = {
          ...item,
          data: { 
            ...item.data, 
            title: todoForm.title.trim(),
            tasks: todoForm.tasks,
            saved: true 
          }
        };
        
        setCanvasItems(prev => {
          const updated = prev.map(i => i.id === item.id ? updatedTodo : i);
          // Save to localStorage
            if (typeof window !== 'undefined' && projectId) {
              try {
                localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
              } catch (e) {
                console.error('Failed to save canvas items', e);
              }
            }
            return updated;
          });
        }
        break;
      
      case 'note':
        if (noteForm.title.trim()) {
          addNote({
            title: noteForm.title,
            content: noteForm.content,
            projectId: project.id
          });
          
          const updatedItem = {
            ...item,
            data: { ...noteForm, saved: true }
          };
          setCanvasItems(prev => {
            const updated = prev.map(i => i.id === item.id ? updatedItem : i);
            // Save to localStorage
            if (typeof window !== 'undefined' && projectId) {
              try {
                localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
              } catch (e) {
                console.error('Failed to save canvas items', e);
              }
            }
            return updated;
          });
        }
        break;
      
      case 'finance': {
        const amount = parseFloat(financeForm.amount);
        if (amount > 0) {
          // Create the base wallet entry with required fields
          const walletEntry = {
            projectId: project.id,
            type: financeForm.type === 'investment' || financeForm.type === 'debt' 
              ? 'withdrawal' // Map investment and debt to withdrawal type
              : financeForm.type as 'deposit' | 'withdrawal',
            amount: financeForm.type === 'deposit' ? amount : -Math.abs(amount), // Make withdrawals negative
            description: financeForm.description || `Transação de ${financeForm.type}`,
            // Store additional metadata in a meta field
            meta: {
              originalType: financeForm.type,
              category: financeForm.category,
              date: financeForm.date,
              expectedReturn: financeForm.expectedReturn ? parseFloat(financeForm.expectedReturn) : undefined,
              riskLevel: financeForm.riskLevel,
              status: financeForm.status,
              isRecurring: financeForm.isRecurring,
              recurrence: financeForm.isRecurring ? financeForm.recurrence : undefined
            }
          };

          // Add the wallet entry
          await addProjectWalletEntry(walletEntry);
          
          // Update the canvas item with the saved data
          const updatedItem = {
            ...item,
            data: { 
              ...financeForm,
              amount: amount.toString(),
              saved: true,
              // Store the formatted date for display
              formattedDate: new Date(financeForm.date).toLocaleDateString('pt-BR')
            }
          };
          
          // Update the canvas items state
          setCanvasItems(prev => {
            const updated = prev.map(i => i.id === item.id ? updatedItem : i);
            // Save to localStorage
            if (typeof window !== 'undefined' && projectId) {
              try {
                localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
              } catch (e) {
                console.error('Failed to save canvas items', e);
              }
            }
            return updated;
          });
        }
        break;
      }
    }
    
    setEditingItem(null);
    resetForms();
  };

  // Helper function to get recurrence label
  const getRecurrenceLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return '';
    }
  };

  const resetForms = () => {
    setTodoForm({ title: "", tasks: [] });
    setNewTaskText("");
    setNoteForm({ title: "", content: "" });
    setFinanceForm({
      type: 'deposit',
      category: 'outro',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      expectedReturn: '',
      riskLevel: 'medium',
      status: 'pending',
      isRecurring: false,
      recurrence: {
        frequency: 'monthly',
        endDate: ''
      }
    });
    setRoutineForm({ title: "", description: "", timesPerDay: 1, weekdays: [] });
  };

  const handleDeleteItem = (itemId: string) => {
    setCanvasItems(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      // Save to localStorage
      if (typeof window !== 'undefined' && projectId) {
        try {
          localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save canvas items', e);
        }
      }
      return updated;
    });
    if (editingItem?.id === itemId) {
      setEditingItem(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setEditingItem(null);
      setEditingTask(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, item: CanvasItem) => {
    if (editingItem?.id === item.id) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggedItem(item);
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedItem) return;
    
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;
    
    setCanvasItems(prev => {
      const updated = prev.map(item => 
        item.id === draggedItem.id 
          ? { ...item, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
          : item
      );
      // Debounce the save to localStorage for drag operations
      if (typeof window !== 'undefined' && projectId) {
        clearTimeout((window as any).saveCanvasTimeout);
        (window as any).saveCanvasTimeout = setTimeout(() => {
          try {
            localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to save canvas items', e);
          }
        }, 500);
      }
      return updated;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const addTaskToTodo = (itemId: string) => {
    if (!newTaskText.trim()) return;
    
    const newTask: TodoTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      showInDashboard: true
    };
    
    setCanvasItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId 
          ? { ...item, data: { ...item.data, tasks: [...(item.data.tasks || []), newTask] } }
          : item
      );
      // Save to localStorage
      if (typeof window !== 'undefined' && projectId) {
        try {
          localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save canvas items', e);
        }
      }
      return updated;
    });
    
    setNewTaskText("");
  };

  const toggleTask = (itemId: string, taskId: string) => {
    setCanvasItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId 
          ? {
              ...item, 
              data: {
                ...item.data,
                tasks: item.data.tasks?.map((task: TodoTask) => 
                  task.id === taskId ? { ...task, completed: !task.completed } : task
                ) || []
              }
            }
          : item
      );
      // Save to localStorage
      if (typeof window !== 'undefined' && projectId) {
        try {
          localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save canvas items', e);
        }
      }
      return updated;
    });
  };

  const deleteTask = (itemId: string, taskId: string) => {
    setCanvasItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId 
          ? {
              ...item, 
              data: {
                ...item.data,
                tasks: item.data.tasks?.filter((task: TodoTask) => task.id !== taskId) || []
              }
            }
          : item
      );
      // Save to localStorage
      if (typeof window !== 'undefined' && projectId) {
        try {
          localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save canvas items', e);
        }
      }
      return updated;
    });
  };

  const updateTask = (itemId: string, taskId: string, updates: Partial<TodoTask>) => {
    setCanvasItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId 
          ? {
              ...item, 
              data: {
                ...item.data,
                tasks: item.data.tasks?.map((task: TodoTask) => 
                  task.id === taskId ? { ...task, ...updates } : task
                ) || []
              }
            }
          : item
      );
      // Save to localStorage
      if (typeof window !== 'undefined' && projectId) {
        try {
          localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save canvas items', e);
        }
      }
      return updated;
    });
  };

  const menuItems = [
    { type: 'todo' as const, icon: ListChecks, label: 'To-Do', color: '#3B82F6' },
    { type: 'note' as const, icon: StickyNote, label: 'Nota', color: '#10B981' },
    { type: 'finance' as const, icon: Wallet, label: 'Finança', color: '#F59E0B' },
    { type: 'routine' as const, icon: Calendar, label: 'Rotina', color: '#8B5CF6' },
    { type: 'image' as const, icon: ImageIcon, label: 'Imagem', color: '#EC4899' },
    { type: 'document' as const, icon: FileText, label: 'Documento', color: '#6366F1' },
  ];

  const renderItemContent = (item: CanvasItem) => {
    const isEditing = editingItem?.id === item.id;
    
    switch (item.type) {
      case 'todo':
        return (
          <Card 
            className="w-80 shadow-lg select-none" 
            onMouseDown={(e) => handleMouseDown(e, item)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-blue-500" />
                  {isEditing ? (
                    <Input 
                      value={item.data.title || ""}
                      onChange={(e) => {
                        setCanvasItems(prev => prev.map(i => 
                          i.id === item.id ? { ...i, data: { ...i.data, title: e.target.value } } : i
                        ));
                      }}
                      placeholder="Título do card"
                      className="h-7 text-sm font-semibold"
                    />
                  ) : (
                    <CardTitle className="text-sm">{item.data.title || "To-Do"}</CardTitle>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(isEditing ? null : item);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Lista de tarefas */}
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {(item.data.tasks || []).map((task: TodoTask) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(item.id, task.id)}
                      className="flex-shrink-0"
                    />
                    {editingTask?.itemId === item.id && editingTask?.taskId === task.id ? (
                      <div className="flex-1 space-y-2">
                        <Input 
                          value={task.text}
                          onChange={(e) => updateTask(item.id, task.id, { text: e.target.value })}
                          className="h-7 text-xs"
                          placeholder="Nome da tarefa"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={task.showInDashboard}
                            onCheckedChange={(checked) => updateTask(item.id, task.id, { showInDashboard: !!checked })}
                            className="h-3 w-3"
                          />
                          <Label className="text-xs">Dashboard</Label>
                          <div className="flex gap-1 ml-auto">
                            <Button 
                              size="sm" 
                              className="h-6 px-2 text-xs"
                              onClick={() => setEditingTask(null)}
                            >
                              OK
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span 
                          className={`flex-1 text-xs cursor-pointer ${
                            task.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                          onClick={() => setEditingTask({ itemId: item.id, taskId: task.id })}
                        >
                          {task.text}
                        </span>
                        {task.showInDashboard && (
                          <Badge variant="outline" className="h-4 px-1 text-xs">Dashboard</Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteTask(item.id, task.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Adicionar nova tarefa - sempre visível */}
              <div className="flex gap-2 pt-2 border-t">
                <Input 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Nova tarefa..."
                  className="h-7 text-xs"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTaskToTodo(item.id);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    addTaskToTodo(item.id);
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Botão salvar (apenas quando editando) */}
              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSaveItem(item)}>Salvar no Sistema</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>Fechar</Button>
                </div>
              )}
              
              {item.data.saved && (
                <Badge variant="secondary" className="mt-2">Salvo no Sistema</Badge>
              )}
            </CardContent>
          </Card>
        );

      case 'note':
        return (
          <Card 
            className="w-80 shadow-lg select-none" 
            onMouseDown={(e) => handleMouseDown(e, item)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-green-500" />
                  <CardTitle className="text-sm">Nota</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <Label>Título</Label>
                    <Input 
                      value={noteForm.title}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título da nota"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <Label>Conteúdo</Label>
                    <Textarea 
                      value={noteForm.content}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Conteúdo da nota"
                      rows={4}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveItem(item);
                      }}
                    >
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div>
                  <h4 className="font-medium">{item.data.title || "Nova Nota"}</h4>
                  {item.data.content && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.data.content}</p>
                  )}
                  {item.data.saved && (
                    <Badge variant="secondary" className="mt-2">Salva</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'finance':
        return (
          <Card 
            className="w-96 shadow-lg select-none" 
            onMouseDown={(e) => handleMouseDown(e, item)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-yellow-500" />
                  <CardTitle className="text-sm">
                    {isEditing ? 'Editar Transação' : 'Transação Financeira'}
                  </CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditing) {
                        setEditingItem(null);
                        resetForms();
                      } else {
                        setEditingItem(item);
                        setFinanceForm({
                          ...item.data,
                          amount: item.data.amount?.toString() || '',
                          expectedReturn: item.data.expectedReturn?.toString() || '',
                        });
                      }
                    }}
                  >
                    {isEditing ? <X className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                  </Button>
                  {!isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Transação</Label>
                      <select 
                        className="w-full h-10 rounded border px-3 bg-card text-sm"
                        value={financeForm.type}
                        onChange={(e) => setFinanceForm(prev => ({ ...prev, type: e.target.value as any }))}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="deposit">Depósito</option>
                        <option value="withdrawal">Retirada</option>
                        <option value="investment">Investimento</option>
                        <option value="debt">Dívida</option>
                      </select>
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <select 
                        className="w-full h-10 rounded border px-3 bg-card text-sm"
                        value={financeForm.category}
                        onChange={(e) => setFinanceForm(prev => ({ ...prev, category: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="salario">Salário</option>
                        <option value="freelance">Freelance</option>
                        <option value="investimento">Investimento</option>
                        <option value="emprestimo">Empréstimo</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={financeForm.amount}
                        onChange={(e) => setFinanceForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input 
                        type="date"
                        value={financeForm.date}
                        onChange={(e) => setFinanceForm(prev => ({ ...prev, date: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {(financeForm.type === 'investment' || financeForm.type === 'debt') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Retorno Esperado (%)</Label>
                        <Input 
                          type="number"
                          step="0.1"
                          value={financeForm.expectedReturn}
                          onChange={(e) => setFinanceForm(prev => ({ ...prev, expectedReturn: e.target.value }))}
                          placeholder="0.0"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label>Nível de Risco</Label>
                        <select 
                          className="w-full h-10 rounded border px-3 bg-card text-sm"
                          value={financeForm.riskLevel}
                          onChange={(e) => setFinanceForm(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="low">Baixo</option>
                          <option value="medium">Médio</option>
                          <option value="high">Alto</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Descrição</Label>
                    <Textarea 
                      value={financeForm.description}
                      onChange={(e) => setFinanceForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detalhes da transação"
                      onClick={(e) => e.stopPropagation()}
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="recurring"
                      checked={financeForm.isRecurring}
                      onCheckedChange={(checked) => setFinanceForm(prev => ({ ...prev, isRecurring: !!checked }))}
                    />
                    <Label htmlFor="recurring" className="text-sm">Transação recorrente</Label>
                  </div>

                  {financeForm.isRecurring && (
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded">
                      <div>
                        <Label>Frequência</Label>
                        <select 
                          className="w-full h-10 rounded border px-3 bg-card text-sm"
                          value={financeForm.recurrence.frequency}
                          onChange={(e) => setFinanceForm(prev => ({
                            ...prev, 
                            recurrence: { ...prev.recurrence, frequency: e.target.value as any }
                          }))}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="daily">Diária</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                      <div>
                        <Label>Até</Label>
                        <Input 
                          type="date"
                          value={financeForm.recurrence.endDate}
                          onChange={(e) => setFinanceForm(prev => ({
                            ...prev, 
                            recurrence: { ...prev.recurrence, endDate: e.target.value }
                          }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(null);
                        resetForms();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveItem(item);
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-1">
                        {item.data.type === 'deposit' ? 'Depósito' : 
                         item.data.type === 'withdrawal' ? 'Retirada' :
                         item.data.type === 'investment' ? 'Investimento' : 'Dívida'}
                      </Badge>
                      <h4 className="font-medium">
                        {item.data.category || 'Sem categoria'}
                      </h4>
                      {item.data.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.data.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        item.data.type === 'deposit' ? 'text-green-600' : 
                        item.data.type === 'withdrawal' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {item.data.type === 'deposit' ? '+' : ''}
                        {item.data.type === 'withdrawal' ? '-' : ''}
                        R$ {parseFloat(item.data.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.data.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {(item.data.type === 'investment' || item.data.type === 'debt') && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Retorno Esperado:</span>
                        <span className="font-medium">
                          {item.data.expectedReturn ? `${parseFloat(item.data.expectedReturn)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Risco:</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            item.data.riskLevel === 'high' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
                            item.data.riskLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                            'bg-green-500/10 text-green-700 dark:text-green-400'
                          }`}
                        >
                          {item.data.riskLevel === 'high' ? 'Alto' :
                           item.data.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {item.data.isRecurring && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Recorrente • {getRecurrenceLabel(item.data.recurrence?.frequency)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="w-80 shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/projects')}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">Canvas do Projeto</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsSideMenuOpen(true)}
            className="rounded-full w-12 h-12 p-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="pt-20 min-h-screen relative bg-white dark:bg-black"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {canvasItems.map((item) => (
          <div
            key={item.id}
            className={`absolute ${
              isDragging && draggedItem?.id === item.id ? 'cursor-grabbing' : 'cursor-grab'
            } ${editingItem?.id === item.id ? 'cursor-default' : ''}`}
            style={{
              left: item.position.x,
              top: item.position.y,
              zIndex: isDragging && draggedItem?.id === item.id ? 1000 : 1,
            }}
          >
            {renderItemContent(item)}
          </div>
        ))}
      </div>

      {/* Side Menu */}
      {isSideMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsSideMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-background dark:bg-gray-900 border-l dark:border-gray-800 shadow-xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Adicionar Item</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsSideMenuOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {menuItems.map((menuItem) => {
                const Icon = menuItem.icon;
                return (
                  <Button
                    key={menuItem.type}
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => handleAddCanvasItem(menuItem.type)}
                  >
                    <Icon 
                      className="w-5 h-5 mr-3" 
                      style={{ color: menuItem.color }}
                    />
                    {menuItem.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
