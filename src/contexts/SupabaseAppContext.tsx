import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Project, Task, Note, TodoList, Account, Transaction, 
  Debt, Goal, Contact, ContactGroup, Receivable, 
  ProjectImage, ProjectWalletEntry, ClockifyTimeEntry, 
  PlakyBoard, PlakyColumn, PlakyItem, PomodoroSession, PomodoroSettings, AISettings,
  Activity, ActivityEntityRef
} from '@/types';

// Using Activity and ActivityEntityRef from types.ts

interface AppContextType {
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  routines: any[]; // TODO: Replace 'any' with the correct Routine type
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addRoutine: (routine: any) => Promise<void>; // TODO: Replace 'any' with the correct Routine type
  completeRoutineOnce: (routineId: string, date: string) => Promise<void>;
  skipRoutineDay: (routineId: string, date: string) => Promise<void>;
  skipRoutineBetween: (routineId: string, startDate: string, endDate: string) => Promise<void>;
  getRoutineProgress: (routineId: string, startDate: string, endDate: string) => Promise<any>;

  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // TodoLists
  todoLists: TodoList[];
  addTodoList: (todoList: Omit<TodoList, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodoList: (id: string, updates: Partial<TodoList>) => Promise<void>;
  deleteTodoList: (id: string) => Promise<void>;

  // Financial
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  receivables: Receivable[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  payDebt: (debtId: string, accountId: string, amount: number) => Promise<void>;
  allocateToGoal: (goalId: string, accountId: string, amount: number) => Promise<void>;
  addReceivable: (receivable: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'receivedAt'>) => Promise<void>;
  updateReceivable: (id: string, updates: Partial<Receivable>) => Promise<void>;
  deleteReceivable: (id: string) => Promise<void>;
  receiveReceivable: (receivableId: string, accountId: string) => Promise<void>;

  // Network
  contacts: Contact[];
  contactGroups: ContactGroup[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addContactGroup: (group: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContactGroup: (id: string, updates: Partial<ContactGroup>) => Promise<void>;
  deleteContactGroup: (id: string) => Promise<void>;

  // Project media and wallet
  projectImages: ProjectImage[];
  addProjectImage: (image: Omit<ProjectImage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteProjectImage: (id: string) => Promise<void>;
  projectWalletEntries: ProjectWalletEntry[];
  addProjectWalletEntry: (entry: Omit<ProjectWalletEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteProjectWalletEntry: (id: string) => Promise<void>;

  // Clockify
  clockifyTimeEntries: ClockifyTimeEntry[];
  addClockifyTimeEntry: (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateClockifyTimeEntry: (id: string, updates: Partial<ClockifyTimeEntry>) => Promise<void>;
  deleteClockifyTimeEntry: (id: string) => Promise<void>;
  startClockifyTimer: (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  stopClockifyTimer: (entryId: string) => Promise<void>;
  pauseClockifyTimer: (entryId: string) => Promise<void>;
  resumeClockifyTimer: (entryId: string) => Promise<void>;

  // Plaky
  plakyBoards: PlakyBoard[];
  plakyItems: PlakyItem[];
  addPlakyBoard: (board: Omit<PlakyBoard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlakyBoard: (id: string, updates: Partial<PlakyBoard>) => Promise<void>;
  deletePlakyBoard: (id: string) => Promise<void>;
  addPlakyItem: (item: Omit<PlakyItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlakyItem: (id: string, updates: Partial<PlakyItem>) => Promise<void>;
  deletePlakyItem: (id: string) => Promise<void>;

  // Pomodoro
  pomodoroSessions: PomodoroSession[];
  pomodoroSettings: PomodoroSettings;
  addPomodoroSession: (session: Omit<PomodoroSession, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePomodoroSession: (id: string, updates: Partial<PomodoroSession>) => Promise<void>;
  deletePomodoroSession: (id: string) => Promise<void>;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
  startPomodoro: (projectId?: string, taskId?: string) => Promise<string>;
  pausePomodoro: (sessionId: string) => Promise<void>;
  resumePomodoro: (sessionId: string) => Promise<void>;
  stopPomodoro: (sessionId: string) => Promise<void>;

  // AI / Assistant
  aiSettings: AISettings;
  updateAISettings: (settings: Partial<AISettings>) => Promise<void>;

  // User Settings
  actorName: string;
  updateActorName: (name: string) => Promise<void>;

  // Activity Tracking
  activities: Activity[];
  addActivity: (action: string, entity?: ActivityEntityRef, metadata?: Record<string, any>) => void;
  clearActivities: () => void;

  // Loading states
  loading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function SupabaseAppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actorName, setActorName] = useState('System');

  // Helper function to handle errors consistently
  const handleError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    toast({
      title: `Error ${action}`,
      description: error.message || 'An unexpected error occurred',
      variant: 'destructive',
    });
  };

  // All state
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<any[]>([]); // TODO: Replace 'any' with the correct Routine type
  const [notes, setNotes] = useState<Note[]>([]);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [projectWalletEntries, setProjectWalletEntries] = useState<ProjectWalletEntry[]>([]);
  const [clockifyTimeEntries, setClockifyTimeEntries] = useState<ClockifyTimeEntry[]>([]);
  const [plakyBoards, setPlakyBoards] = useState<PlakyBoard[]>([]);
  const [plakyItems, setPlakyItems] = useState<PlakyItem[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartWork: true,
    soundEnabled: true,
  });
  const [aiSettings, setAISettings] = useState<AISettings>({
    enabled: true,
    deepAnalysis: true,
    model: 'gemini-1.5-pro',
    maxContextItems: 100,
  });
  
  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);

  // Transform database task to app task
  const transformDbTask = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    completed: dbTask.completed,
    date: new Date(dbTask.date),
    startTime: dbTask.start_time,
    endTime: dbTask.end_time,
    projectId: dbTask.project_id,
    isRoutine: dbTask.is_routine,
    isOverdue: dbTask.is_overdue,
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
    priority: dbTask.priority || 'medium',
    status: dbTask.status || 'todo',
    labels: dbTask.labels || [],
  });

  // Load all data function
  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);
      
      if (projectsData) {
        setProjects(projectsData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          color: p.color,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        })));
      }

      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);
      
      if (tasksData) {
        setTasks(tasksData.map(transformDbTask));
      }
    } catch (error) {
      handleError(error, 'loading data');
    } finally {
      setLoading(false);
    }
  };

  // Project methods
  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: project.name,
          description: project.description,
          color: project.color,
        })
        .select()
        .single();

      if (error) throw error;
      
      setProjects(prev => [...prev, {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
    } catch (error) {
      handleError(error, 'adicionar projeto');
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProjects(prev => prev.map(p => p.id === id ? {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : p));
    } catch (error) {
      handleError(error, 'atualizar projeto');
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProjects(prev => prev.filter(p => p.id !== id));
      // Also remove related data
      setTasks(prev => prev.filter(t => t.projectId !== id));
      setNotes(prev => prev.filter(n => n.projectId !== id));
      setTodoLists(prev => prev.filter(tl => tl.projectId !== id));
    } catch (error) {
      handleError(error, 'deletar projeto');
    }
  };

  // User settings
  const updateActorName = async (name: string) => {
    setActorName(name);
  };

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  // Add activity to the log
  const addActivity = (action: string, entity?: ActivityEntityRef, meta?: Record<string, any>) => {
    try {
      if (!user?.id) {
        console.warn('Cannot log activity: No authenticated user');
        return;
      }

      const now = new Date();
      const activity: Activity = {
        id: `temp-${Date.now()}`,
        at: now,
        actor: user?.email || 'system',
        action: action as any, // Bypass type checking temporarily
        ...(entity && { entity }),
        ...(meta && { meta })
      };

      // Add to local state optimistically
      setActivities(prev => [activity, ...prev].slice(0, 100)); // Keep only last 100 activities
    } catch (error) {
      console.error('Error in addActivity:', error);
    }
  };
  
  // Clear all activities
  const clearActivities = () => {
    setActivities([]);
    
    // Optionally clear from Supabase
    if (user) {
      supabase
        .from('activities')
        .delete()
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error clearing activities:', error);
          }
        });
    }
  };

  // Routine methods - placeholder implementations
  const addRoutine = async (routine: any) => {
    notImplemented('addRoutine');
  };

  const completeRoutineOnce = async (routineId: string, date: string) => {
    notImplemented('completeRoutineOnce');
  };

  const skipRoutineDay = async (routineId: string, date: string) => {
    notImplemented('skipRoutineDay');
  };

  const skipRoutineBetween = async (routineId: string, startDate: string, endDate: string) => {
    notImplemented('skipRoutineBetween');
  };

  const getRoutineProgress = async (routineId: string, startDate: string, endDate: string) => {
    notImplemented('getRoutineProgress');
    return { completed: 0, skipped: 0, paused: 0, total: 0 };
  };

  // Transaction methods
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any) // Type assertion to handle Supabase types
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Transform the database response to match our Transaction type
      const updatedTransaction: Transaction = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        type: data.type as "deposit" | "withdrawal" | "transfer",
        category: data.category,
        date: new Date(data.date),
        accountId: data.account_id,
        createdAt: new Date(data.created_at)
      };
      
      setTransactions(prev => 
        prev.map(tx => tx.id === id ? updatedTransaction : tx)
      );
    } catch (error) {
      handleError(error, 'atualizar transação');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      
      // Log activity
      addActivity('transaction_deleted', { 
        type: 'transaction', 
        id,
        label: `Transaction ${id}`
      });
    } catch (error) {
      handleError(error, 'excluir transação');
      throw error;
    }
  };


  // Task methods
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          project_id: task.projectId,
          date: task.date.toISOString(),
          start_time: task.startTime,
          end_time: task.endTime,
          is_routine: task.isRoutine,
          is_overdue: task.isOverdue || false,
        })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [...prev, transformDbTask(data)]);
    } catch (error) {
      handleError(error, 'adicionar tarefa');
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          completed: updates.completed,
          project_id: updates.projectId,
          date: updates.date?.toISOString(),
          start_time: updates.startTime,
          end_time: updates.endTime,
          is_routine: updates.isRoutine,
          is_overdue: updates.isOverdue,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === id ? transformDbTask(data) : t));
    } catch (error) {
      handleError(error, 'atualizar tarefa');
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      handleError(error, 'deletar tarefa');
    }
  };

  // Implement all other methods following the same pattern...
  // For brevity, I'll implement placeholder methods that throw errors

  const notImplemented = (method: string) => {
    throw new Error(`${method} not yet implemented in Supabase context`);
  };

  const value: AppContextType = {
    // Projects
    projects,
    addProject,
    updateProject,
    deleteProject,

    // Tasks
    tasks,
    routines,
    addTask,
    updateTask,
    deleteTask,
    addRoutine,
    completeRoutineOnce,
    skipRoutineDay,
    skipRoutineBetween,
    getRoutineProgress,

    // Notes - placeholder implementations
    notes,
    addNote: async () => notImplemented('addNote'),
    updateNote: async () => notImplemented('updateNote'),
    deleteNote: async () => notImplemented('deleteNote'),

    // TodoLists - placeholder implementations
    todoLists,
    addTodoList: async () => notImplemented('addTodoList'),
    updateTodoList: async () => notImplemented('updateTodoList'),
    deleteTodoList: async () => notImplemented('deleteTodoList'),

    // Financial
    accounts,
    transactions,
    debts,
    goals,
    receivables,
    addAccount: async () => notImplemented('addAccount'),
    addTransaction: async () => notImplemented('addTransaction'),
    updateTransaction,
    deleteTransaction,
    addDebt: async () => notImplemented('addDebt'),
    addGoal: async () => notImplemented('addGoal'),
    updateAccount: async () => notImplemented('updateAccount'),
    deleteAccount: async () => notImplemented('deleteAccount'),
    updateDebt: async () => notImplemented('updateDebt'),
    updateGoal: async () => notImplemented('updateGoal'),
    payDebt: async () => notImplemented('payDebt'),
    allocateToGoal: async () => notImplemented('allocateToGoal'),
    addReceivable: async () => notImplemented('addReceivable'),
    updateReceivable: async () => notImplemented('updateReceivable'),
    deleteReceivable: async () => notImplemented('deleteReceivable'),
    receiveReceivable: async () => notImplemented('receiveReceivable'),

    // Network - placeholder implementations
    contacts,
    contactGroups,
    addContact: async () => notImplemented('addContact'),
    updateContact: async () => notImplemented('updateContact'),
    deleteContact: async () => notImplemented('deleteContact'),
    addContactGroup: async () => notImplemented('addContactGroup'),
    updateContactGroup: async () => notImplemented('updateContactGroup'),
    deleteContactGroup: async () => notImplemented('deleteContactGroup'),

    // Project media and wallet - placeholder implementations
    projectImages,
    addProjectImage: async () => notImplemented('addProjectImage'),
    deleteProjectImage: async () => notImplemented('deleteProjectImage'),
    projectWalletEntries,
    addProjectWalletEntry: async () => notImplemented('addProjectWalletEntry'),
    deleteProjectWalletEntry: async () => notImplemented('deleteProjectWalletEntry'),

    // Clockify - placeholder implementations
    clockifyTimeEntries,
    addClockifyTimeEntry: async () => { notImplemented('addClockifyTimeEntry'); return ''; },
    updateClockifyTimeEntry: async () => notImplemented('updateClockifyTimeEntry'),
    deleteClockifyTimeEntry: async () => notImplemented('deleteClockifyTimeEntry'),
    startClockifyTimer: async () => { notImplemented('startClockifyTimer'); return ''; },
    stopClockifyTimer: async () => notImplemented('stopClockifyTimer'),
    pauseClockifyTimer: async () => notImplemented('pauseClockifyTimer'),
    resumeClockifyTimer: async () => notImplemented('resumeClockifyTimer'),

    // Plaky - placeholder implementations
    plakyBoards,
    plakyItems,
    addPlakyBoard: async () => notImplemented('addPlakyBoard'),
    updatePlakyBoard: async () => notImplemented('updatePlakyBoard'),
    deletePlakyBoard: async () => notImplemented('deletePlakyBoard'),
    addPlakyItem: async () => notImplemented('addPlakyItem'),
    updatePlakyItem: async () => notImplemented('updatePlakyItem'),
    deletePlakyItem: async () => notImplemented('deletePlakyItem'),

    // Pomodoro - placeholder implementations
    pomodoroSessions,
    pomodoroSettings,
    addPomodoroSession: async () => notImplemented('addPomodoroSession'),
    updatePomodoroSession: async () => notImplemented('updatePomodoroSession'),
    deletePomodoroSession: async () => notImplemented('deletePomodoroSession'),
    updatePomodoroSettings: async () => notImplemented('updatePomodoroSettings'),
    startPomodoro: async () => { notImplemented('startPomodoro'); return ''; },
    pausePomodoro: async () => notImplemented('pausePomodoro'),
    resumePomodoro: async () => notImplemented('resumePomodoro'),
    stopPomodoro: async () => notImplemented('stopPomodoro'),

    // AI / Assistant - placeholder implementations
    aiSettings,
    updateAISettings: async () => notImplemented('updateAISettings'),

    // User Settings
    actorName,
    updateActorName,

    // Activity Tracking
    activities,
    addActivity,
    clearActivities,

    // Loading and refresh
    loading,
    refreshData: loadAllData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Export the AppContext for direct usage if needed
export { AppContext };

// Export the typed useAppContext hook
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a SupabaseAppProvider');
  }
  return context;
}