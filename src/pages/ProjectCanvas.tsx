import { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Send,
  GripVertical,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  showInDashboard: boolean;
  dueDate?: Date;
}

interface FinanceEntry {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
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
  
  // Get supabase and user from SupabaseAppContext
  const { supabase, user } = useAppContext() as any;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  // Load canvas items from localStorage with error handling
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<CanvasItem | null>(null);
  const [editingItem, setEditingItem] = useState<CanvasItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingTask, setEditingTask] = useState<{ itemId: string; taskId: string } | null>(null);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  
  // Canvas pan and zoom state
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Forms for different item types
  const [todoForm, setTodoForm] = useState({ task: '', dueDate: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [financeForm, setFinanceForm] = useState({ amount: '', type: 'credit' as 'credit' | 'debit', description: '' });
  const [imageForm, setImageForm] = useState({ title: '', description: '', imageUrl: '', imageFile: null as File | null });
  const [documentForm, setDocumentForm] = useState({ title: '', description: '', fileUrl: '', fileName: '', fileType: '', documentFile: null as File | null });
  const [newTaskText, setNewTaskText] = useState('');
  
  const project = useMemo(() => {
    const foundProject = projects.find(p => p.id === projectId);
    if (projects.length > 0) {
      setIsLoading(false);
      if (!foundProject) {
        setLoadError('Projeto não encontrado');
      }
    }
    return foundProject;
  }, [projects, projectId]);
  
  // Load canvas items from Supabase
  useEffect(() => {
    const loadCanvasItems = async () => {
      console.log('Loading canvas items...', { projectId, user: !!user, supabase: !!supabase });
      
      if (!projectId || !user || !supabase) {
        console.warn('Missing required data for loading:', { projectId: !!projectId, user: !!user, supabase: !!supabase });
        return;
      }
      
      try {
        console.log('Querying Supabase for canvas items...');
        
        const { data, error } = await supabase
          .from('canvas_items')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Supabase query error:', error);
          throw error;
        }
        
        console.log('Loaded canvas items from Supabase:', data);
        
        const items = (data || []).map((item: any) => ({
          id: item.id,
          type: item.type,
          position: { x: item.position_x, y: item.position_y },
          data: item.data,
          createdAt: new Date(item.created_at)
        }));
        
        setCanvasItems(items);
        console.log('Canvas items set:', items);
      } catch (e) {
        console.error('Failed to load canvas items from Supabase:', e);
        setLoadError(`Erro ao carregar do Supabase: ${e.message || 'Erro desconhecido'}`);
        
        // Fallback to localStorage if Supabase fails
        try {
          console.log('Falling back to localStorage...');
          const saved = localStorage.getItem(`projectCanvas_${projectId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            const items = parsed.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              data: {
                ...item.data,
                ...(item.data.dueDate && { dueDate: new Date(item.data.dueDate) })
              }
            }));
            setCanvasItems(items);
            console.log('Loaded from localStorage:', items);
          }
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError);
        }
      }
    };
    
    loadCanvasItems();
  }, [projectId, user, supabase]);
  
  // Save canvas items to Supabase
  const saveCanvasItemToSupabase = useCallback(async (item: CanvasItem) => {
    console.log('Attempting to save canvas item:', item);
    console.log('ProjectId:', projectId, 'User:', user, 'Supabase:', !!supabase);
    
    if (!projectId || !user || !supabase) {
      console.warn('Missing required data for Supabase save:', { projectId: !!projectId, user: !!user, supabase: !!supabase });
      return;
    }
    
    try {
      const canvasItemData = {
        id: item.id,
        project_id: projectId,
        user_id: user.id,
        type: item.type,
        position_x: item.position.x,
        position_y: item.position.y,
        data: item.data
      };
      
      console.log('Saving to Supabase:', canvasItemData);
      
      const { data, error } = await supabase
        .from('canvas_items')
        .upsert(canvasItemData, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully saved to Supabase:', data);
      
      // Also save to localStorage as backup
      const allItems = canvasItems.map(i => i.id === item.id ? item : i);
      localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(allItems));
    } catch (e) {
      console.error('Failed to save canvas item to Supabase:', e);
      
      // Show error to user
      setLoadError(`Erro ao salvar no Supabase: ${e.message || 'Erro desconhecido'}`);
      
      // Fallback to localStorage only
      try {
        const allItems = canvasItems.map(i => i.id === item.id ? item : i);
        localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(allItems));
        console.log('Saved to localStorage as fallback');
      } catch (localError) {
        console.error('Failed to save to localStorage:', localError);
        setLoadError('Erro ao salvar item');
      }
    }
  }, [projectId, user, supabase, canvasItems]);
  
  // Delete canvas item from Supabase
  const deleteCanvasItemFromSupabase = useCallback(async (itemId: string) => {
    if (!projectId || !user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('canvas_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Also remove from localStorage
      const updatedItems = canvasItems.filter(item => item.id !== itemId);
      localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updatedItems));
    } catch (e) {
      console.error('Failed to delete canvas item from Supabase:', e);
      // Fallback to localStorage only
      try {
        const updatedItems = canvasItems.filter(item => item.id !== itemId);
        localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updatedItems));
      } catch (localError) {
        console.error('Failed to delete from localStorage:', localError);
        setLoadError('Erro ao deletar item');
      }
    }
  }, [projectId, user, supabase, canvasItems]);
  
  // Canvas event handlers
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    } else if (isDragging && draggedItem) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const newPosition = {
        x: (e.clientX - canvasRect.left - dragOffset.x) / canvasTransform.scale,
        y: (e.clientY - canvasRect.top - dragOffset.y) / canvasTransform.scale
      };
      
      setCanvasItems(prev => {
        const updated = prev.map(item => 
          item.id === draggedItem.id 
            ? { ...item, position: newPosition }
            : item
        );
        // Save each updated item to Supabase
        updated.forEach(item => {
          if (item.id === draggedItem.id) {
            saveCanvasItemToSupabase(item);
          }
        });
        return updated;
      });
    }
  }, [isPanning, isDragging, draggedItem, panStart, dragOffset, canvasTransform.scale, saveCanvasItemToSupabase]);
  
  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedItem(null);
    setDragHandle(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando projeto...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or project not found
  if (loadError || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {loadError || 'Projeto não encontrado.'}
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


  // Generate UUID compatible with all browsers
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for browsers without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleAddCanvasItem = (type: CanvasItem['type']) => {
    const newItem: CanvasItem = {
      id: generateUUID(),
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {},
      createdAt: new Date()
    };

    setCanvasItems(prev => {
      const updated = [...prev, newItem];
      saveCanvasItemToSupabase(newItem);
      return updated;
    });
    setEditingItem(newItem);
    setIsSideMenuOpen(false);
  };

  const handleSaveItem = (item: CanvasItem) => {
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
              date: task.dueDate || new Date(),
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
            task: todoForm.task,
            dueDate: todoForm.dueDate,
            saved: true 
          }
        };
        
        setCanvasItems(prev => {
          const updated = prev.map(i => i.id === item.id ? updatedTodo : i);
          if (typeof window !== 'undefined' && projectId) {
            try {
              localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
            } catch (e) {
              console.error('Failed to save canvas items', e);
            }
          }
          return updated;
        });
        break;
      }
      
      case 'note':
        if (noteForm.title.trim()) {
          addNote({
            title: noteForm.title,
            content: noteForm.content,
            projectId: project.id
          });
        }
        
        const updatedNote = {
          ...item,
          data: { ...noteForm, saved: true }
        };
        setCanvasItems(prev => {
          const updated = prev.map(i => i.id === item.id ? updatedNote : i);
          saveCanvasItemToSupabase(updatedNote);
          return updated;
        });
        break;
      
      case 'finance':
        const updatedFinance = {
          ...item,
          data: {
            ...item.data,
            entries: item.data.entries || [],
            saved: true
          }
        };
        setCanvasItems(prev => {
          const updated = prev.map(i => i.id === item.id ? updatedFinance : i);
          saveCanvasItemToSupabase(updatedFinance);
          return updated;
        });
        break;
      case 'image': {
        let imageUrl = imageForm.imageUrl;
        
        // If user uploaded a file, create object URL
        if (imageForm.imageFile) {
          imageUrl = URL.createObjectURL(imageForm.imageFile);
        }
        
        const updatedImage = {
          ...item,
          data: {
            ...item.data,
            title: imageForm.title,
            description: imageForm.description,
            imageUrl: imageUrl,
            imageFile: imageForm.imageFile,
            saved: true
          }
        };
        setCanvasItems(prev => {
          const updated = prev.map(i => i.id === item.id ? updatedImage : i);
          saveCanvasItemToSupabase(updatedImage);
          return updated;
        });
        break;
      }
      case 'document': {
        let fileUrl = documentForm.fileUrl;
        let fileName = documentForm.fileName;
        let fileType = documentForm.fileType;
        
        // If user uploaded a file, create object URL and get file info
        if (documentForm.documentFile) {
          fileUrl = URL.createObjectURL(documentForm.documentFile);
          fileName = documentForm.documentFile.name;
          fileType = documentForm.documentFile.type;
        }
        
        const updatedDocument = {
          ...item,
          data: {
            ...item.data,
            title: documentForm.title,
            description: documentForm.description,
            fileUrl: fileUrl,
            fileName: fileName,
            fileType: fileType,
            documentFile: documentForm.documentFile,
            saved: true
          }
        };
        setCanvasItems(prev => {
          const updated = prev.map(i => i.id === item.id ? updatedDocument : i);
          saveCanvasItemToSupabase(updatedDocument);
          return updated;
        });
        break;
      }
    }
    
    setEditingItem(null);
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
    setTodoForm({ task: '', dueDate: '' });
    setNoteForm({ title: '', content: '' });
    setFinanceForm({
      amount: '',
      description: '',
      type: 'credit'
    });
    setImageForm({ title: '', description: '', imageUrl: '', imageFile: null });
    setDocumentForm({ title: '', description: '', fileUrl: '', fileName: '', fileType: '', documentFile: null });
  };

  const addFinanceEntry = (itemId: string) => {
    const amount = parseFloat(financeForm.amount);
    if (!amount || amount <= 0) return;
    
    const newEntry: FinanceEntry = {
      id: Date.now().toString(),
      type: financeForm.type,
      amount,
      description: financeForm.description || (financeForm.type === 'credit' ? 'Crédito' : 'Débito'),
      date: new Date()
    };
    
    setCanvasItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              data: { 
                ...item.data, 
                entries: [...(item.data.entries || []), newEntry]
              }
            }
          : item
      );
      
      // Save to Supabase and localStorage
      const updatedItem = updated.find(item => item.id === itemId);
      if (updatedItem) {
        saveCanvasItemToSupabase(updatedItem);
      }
      
      if (typeof window !== 'undefined' && projectId) {
        try {
          localStorage.setItem(`projectCanvas_${projectId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save canvas items', e);
        }
      }
      return updated;
    });
    
    setFinanceForm({ amount: '', description: '', type: 'credit' });
  };

  const deleteFinanceEntry = (itemId: string, entryId: string) => {
    setCanvasItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId 
          ? {
              ...item, 
              data: {
                ...item.data,
                entries: item.data.entries?.filter((entry: FinanceEntry) => entry.id !== entryId) || []
              }
            }
          : item
      );
      
      // Save to Supabase and localStorage
      const updatedItem = updated.find(item => item.id === itemId);
      if (updatedItem) {
        saveCanvasItemToSupabase(updatedItem);
      }
      
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

  const calculateTotal = (entries: FinanceEntry[]) => {
    return entries.reduce((total, entry) => {
      return total + (entry.type === 'credit' ? entry.amount : -entry.amount);
    }, 0);
  };

  const handleDeleteItem = (itemId: string) => {
    setCanvasItems(prev => prev.filter(item => item.id !== itemId));
    deleteCanvasItemFromSupabase(itemId);
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

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDragging) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasTransform.x, y: e.clientY - canvasTransform.y });
      e.preventDefault();
    }
  };

  const handleZoom = (delta: number) => {
    setCanvasTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale + delta))
    }));
  };

  const resetCanvas = () => {
    setCanvasTransform({ x: 0, y: 0, scale: 1 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    }
  };

  const handleDragHandleMouseDown = (e: React.MouseEvent, item: CanvasItem) => {
    if (editingItem?.id === item.id) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggedItem(item);
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    setDragHandle(item.id);
    
    e.preventDefault();
    e.stopPropagation();
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

  const syncTasksToDashboard = (itemId: string) => {
    const item = canvasItems.find(i => i.id === itemId);
    if (!item || !project) return;
    
    const dashboardTasks = item.data.tasks?.filter((task: TodoTask) => task.showInDashboard && !task.completed) || [];
    
    dashboardTasks.forEach((task: TodoTask) => {
      addTask({
        title: task.text,
        description: `Do projeto: ${project.name}`,
        projectId: project.id,
        date: task.dueDate || new Date(),
        completed: false,
        isRoutine: false,
        isOverdue: false
      });
    });
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

  const itemTypes = [
    { type: 'todo' as const, icon: ListChecks, label: 'To-Do', color: '#3B82F6' },
    { type: 'note' as const, icon: FileText, label: 'Nota', color: '#10B981' },
    { type: 'finance' as const, icon: DollarSign, label: 'Finanças', color: '#F59E0B' },
    { type: 'image' as const, icon: FileText, label: 'Imagem', color: '#EF4444' },
    { type: 'document' as const, icon: FileText, label: 'Documento', color: '#6366F1' },
  ];

  const renderItemContent = (item: CanvasItem) => {
    const isEditing = editingItem?.id === item.id;
    
    switch (item.type) {
      case 'todo':
        return (
          <Card 
            className="w-80 shadow-lg select-none relative" 
          >
            {/* Drag Handle */}
            <div 
              className="absolute top-2 right-2 p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing z-10"
              onMouseDown={(e) => handleDragHandleMouseDown(e, item)}
              title="Arrastar card"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-blue-500" />
                  {isEditing ? (
                    <Input 
                      value={todoForm.task}
                      onChange={(e) => setTodoForm(prev => ({ ...prev, task: e.target.value }))}
                      placeholder="Título do card"
                      className="h-7 text-sm font-semibold"
                    />
                  ) : (
                    <CardTitle className="text-sm">{item.data.task || "To-Do"}</CardTitle>
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
                          <Input 
                            type="date"
                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateTask(item.id, task.id, { dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                            className="h-6 text-xs flex-1"
                          />
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
                        <div className="flex-1">
                          <span 
                            className={`text-xs cursor-pointer block ${
                              task.completed ? 'line-through text-muted-foreground' : ''
                            }`}
                            onClick={() => setEditingTask({ itemId: item.id, taskId: task.id })}
                          >
                            {task.text}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
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
              
              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={() => handleSaveItem(item)}>Salvar no Sistema</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>Fechar</Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      syncTasksToDashboard(item.id);
                    }}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Enviar para Dashboard
                  </Button>
                )}
              </div>
              
              {item.data.saved && (
                <Badge variant="secondary" className="mt-2">Salvo no Sistema</Badge>
              )}
            </CardContent>
          </Card>
        );

      case 'note':
        return (
          <Card 
            className="w-80 max-h-96 shadow-lg select-none relative flex flex-col" 
          >
            {/* Drag Handle */}
            <div 
              className="absolute top-2 right-2 p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing z-10"
              onMouseDown={(e) => handleDragHandleMouseDown(e, item)}
              title="Arrastar card"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
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
            <CardContent className="space-y-3 flex-1 overflow-hidden flex flex-col">
              {isEditing ? (
                <>
                  <div className="flex-shrink-0">
                    <Label>Título</Label>
                    <Input 
                      value={noteForm.title}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título da nota"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <Label>Conteúdo (Markdown)</Label>
                    <Textarea 
                      value={noteForm.content}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Escreva em markdown...\n\n**Negrito** *Itálico*\n# Título\n- Lista\n[Link](url)"
                      rows={4}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-sm flex-1 resize-none"
                    />
                  </div>
                  {noteForm.content && (
                    <div className="flex-shrink-0">
                      <Label>Preview</Label>
                      <div className="border rounded p-3 bg-muted/20 max-h-24 overflow-y-auto">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {noteForm.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
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
                <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="font-medium flex-shrink-0">{item.data.title || "Nova Nota"}</h4>
                  {item.data.content && (
                    <div className="mt-2 flex-1 overflow-y-auto">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>
                          {item.data.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {item.data.saved && (
                    <Badge variant="secondary" className="mt-2 flex-shrink-0">Salva</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'finance':
        const entries = item.data.entries || [];
        const total = calculateTotal(entries);
        return (
          <Card 
            className="w-80 shadow-lg select-none relative" 
          >
            {/* Drag Handle */}
            <div 
              className="absolute top-2 right-2 p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing z-10"
              onMouseDown={(e) => handleDragHandleMouseDown(e, item)}
              title="Arrastar card"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-yellow-500" />
                  {isEditing ? (
                    <Input 
                      value={item.data.title || ""}
                      onChange={(e) => {
                        setCanvasItems(prev => prev.map(i => 
                          i.id === item.id ? { ...i, data: { ...i.data, title: e.target.value } } : i
                        ));
                      }}
                      placeholder="Nome do card"
                      className="h-7 text-sm font-semibold"
                    />
                  ) : (
                    <CardTitle className="text-sm">{item.data.title || "Finanças"}</CardTitle>
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
            <CardContent className="space-y-3">
              {/* Total Display */}
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className={`text-2xl font-bold ${
                  total >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Entries List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {entries.map((entry: FinanceEntry) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.date.toLocaleDateString ? entry.date.toLocaleDateString('pt-BR') : new Date(entry.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.type === 'credit' ? 'default' : 'destructive'} className="text-xs">
                        {entry.type === 'credit' ? '+' : '-'}R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFinanceEntry(item.id, entry.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Entry Form */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    step="0.01"
                    value={financeForm.amount}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Valor"
                    className="flex-1 h-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <select 
                    className="h-8 rounded border px-3 bg-card text-sm"
                    value={financeForm.type}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, type: e.target.value as 'credit' | 'debit' }))}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="credit">Crédito</option>
                    <option value="debit">Débito</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={financeForm.description}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição (opcional)"
                    className="flex-1 h-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button 
                    size="sm" 
                    className="h-8 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      addFinanceEntry(item.id);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {/* Save Button (apenas quando editando) */}
              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSaveItem(item)}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>Fechar</Button>
                </div>
              )}
              
              {item.data.saved && (
                <Badge variant="secondary" className="mt-2">Salvo</Badge>
              )}
            </CardContent>
          </Card>
        );


      case 'image':
        return (
          <Card className="w-80 shadow-lg select-none relative">
            {/* Drag Handle */}
            <div 
              className="absolute top-2 right-2 p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing z-10"
              onMouseDown={(e) => handleDragHandleMouseDown(e, item)}
              title="Arrastar card"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <CardTitle className="text-sm">Imagem</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                      setImageForm({
                        title: item.data.title || '',
                        description: item.data.description || '',
                        imageUrl: item.data.imageUrl || '',
                        imageFile: null
                      });
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
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
                      value={imageForm.title}
                      onChange={(e) => setImageForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título da imagem"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <Label>Imagem</Label>
                    <div className="space-y-2">
                      <Input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setImageForm(prev => ({ ...prev, imageFile: file || null, imageUrl: '' }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer"
                      />
                      <div className="text-xs text-muted-foreground text-center">ou</div>
                      <Input 
                        value={imageForm.imageUrl}
                        onChange={(e) => setImageForm(prev => ({ ...prev, imageUrl: e.target.value, imageFile: null }))}
                        placeholder="https://exemplo.com/imagem.jpg"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea 
                      value={imageForm.description}
                      onChange={(e) => setImageForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da imagem..."
                      rows={3}
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
                  <h4 className="font-medium">{item.data.title || "Nova Imagem"}</h4>
                  {item.data.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={item.data.imageUrl} 
                        alt={item.data.title || 'Imagem'}
                        className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.data.imageUrl, '_blank');
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        title="Clique para ver em tamanho completo"
                      />
                    </div>
                  )}
                  {item.data.description && (
                    <p className="text-sm text-muted-foreground mt-2">{item.data.description}</p>
                  )}
                  {item.data.saved && (
                    <Badge variant="secondary" className="mt-2">Salva</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'document':
        return (
          <Card className="w-80 shadow-lg select-none relative">
            {/* Drag Handle */}
            <div 
              className="absolute top-2 right-2 p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing z-10"
              onMouseDown={(e) => handleDragHandleMouseDown(e, item)}
              title="Arrastar card"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-sm">Documento</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                      setDocumentForm({
                        title: item.data.title || '',
                        description: item.data.description || '',
                        fileUrl: item.data.fileUrl || '',
                        fileName: item.data.fileName || '',
                        fileType: item.data.fileType || '',
                        documentFile: null
                      });
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
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
                      value={documentForm.title}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do documento"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <Label>Documento</Label>
                    <div className="space-y-2">
                      <Input 
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setDocumentForm(prev => ({ ...prev, documentFile: file || null, fileUrl: '', fileName: '', fileType: '' }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer"
                      />
                      <div className="text-xs text-muted-foreground text-center">ou</div>
                      <Input 
                        value={documentForm.fileUrl}
                        onChange={(e) => setDocumentForm(prev => ({ ...prev, fileUrl: e.target.value, documentFile: null }))}
                        placeholder="https://exemplo.com/documento.pdf"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {documentForm.fileUrl && (
                        <Input 
                          value={documentForm.fileName}
                          onChange={(e) => setDocumentForm(prev => ({ ...prev, fileName: e.target.value }))}
                          placeholder="Nome do arquivo"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea 
                      value={documentForm.description}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do documento..."
                      rows={3}
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
                  <h4 className="font-medium">{item.data.title || "Novo Documento"}</h4>
                  {item.data.fileName && (
                    <div className="mt-2 p-3 bg-muted/20 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{item.data.fileName}</span>
                      </div>
                      {item.data.fileType === 'application/pdf' && item.data.fileUrl && (
                        <div className="mt-2">
                          <iframe 
                            src={item.data.fileUrl}
                            className="w-full h-32 border rounded"
                            title="PDF Preview"
                          />
                        </div>
                      )}
                      {item.data.fileUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(item.data.fileUrl, '_blank');
                          }}
                        >
                          Abrir Documento
                        </Button>
                      )}
                    </div>
                  )}
                  {item.data.description && (
                    <p className="text-sm text-muted-foreground mt-2">{item.data.description}</p>
                  )}
                  {item.data.saved && (
                    <Badge variant="secondary" className="mt-2">Salvo</Badge>
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
              <p className="text-muted-foreground">Tipo de item não suportado</p>
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
          <div className="flex items-center gap-2">
            {/* Canvas Controls */}
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleZoom(0.1)}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleZoom(-0.1)}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetCanvas}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {Math.round(canvasTransform.scale * 100)}%
              </span>
            </div>
            <Button 
              onClick={() => setIsSideMenuOpen(true)}
              className="rounded-full w-12 h-12 p-0"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="pt-20 min-h-screen relative bg-white dark:bg-black overflow-hidden"
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div 
          className="relative"
          style={{
            transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0',
            transition: isPanning || isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {canvasItems.map((item) => (
            <div
              key={item.id}
              className={`absolute ${
                isDragging && draggedItem?.id === item.id ? 'cursor-grabbing' : 'cursor-default'
              }`}
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
              {itemTypes.map((menuItem) => {
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
