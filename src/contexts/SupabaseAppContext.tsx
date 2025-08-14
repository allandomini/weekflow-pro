import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Project, Task, Note, TodoList, Account, Transaction, 
  Debt, Goal, Contact, ContactGroup, Receivable, 
  ProjectImage, ProjectWalletEntry, ClockifyTimeEntry, 
  PlakyBoard, PlakyColumn, PlakyItem, PomodoroSession, PomodoroSettings, AISettings
} from '@/types';

interface AppContextType {
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

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

  // Loading states
  loading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function SupabaseAppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // All state
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // Error handler
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    toast({
      title: "Erro",
      description: `Falha ao ${operation}: ${error.message}`,
      variant: "destructive",
    });
  };

  // Transform database objects to app objects
  const transformDbProject = (dbProject: any): Project => ({
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || '',
    color: dbProject.color,
    createdAt: new Date(dbProject.created_at),
    updatedAt: new Date(dbProject.updated_at),
  });

  const transformDbTask = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    completed: dbTask.completed,
    projectId: dbTask.project_id || undefined,
    date: new Date(dbTask.date),
    startTime: dbTask.start_time || undefined,
    endTime: dbTask.end_time || undefined,
    isRoutine: dbTask.is_routine,
    isOverdue: dbTask.is_overdue,
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
  });

  // Load all data when user is authenticated
  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        projectsRes,
        tasksRes,
        notesRes,
        todoListsRes,
        accountsRes,
        transactionsRes,
        debtsRes,
        goalsRes,
        receivablesRes,
        contactsRes,
        contactGroupsRes,
        projectImagesRes,
        projectWalletRes,
        clockifyRes,
        plakyBoardsRes,
        plakyItemsRes,
        pomodoroSessionsRes,
        pomodoroSettingsRes,
        aiSettingsRes,
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('notes').select('*').eq('user_id', user.id),
        supabase.from('todo_lists').select('*').eq('user_id', user.id),
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('receivables').select('*').eq('user_id', user.id),
        supabase.from('contacts').select('*').eq('user_id', user.id),
        supabase.from('contact_groups').select('*').eq('user_id', user.id),
        supabase.from('project_images').select('*').eq('user_id', user.id),
        supabase.from('project_wallet_entries').select('*').eq('user_id', user.id),
        supabase.from('clockify_time_entries').select('*').eq('user_id', user.id),
        supabase.from('plaky_boards').select('*').eq('user_id', user.id),
        supabase.from('plaky_items').select('*').eq('user_id', user.id),
        supabase.from('pomodoro_sessions').select('*').eq('user_id', user.id),
        supabase.from('pomodoro_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('ai_settings').select('*').eq('user_id', user.id).single(),
      ]);

      // Transform and set data
      if (projectsRes.data) setProjects(projectsRes.data.map(transformDbProject));
      if (tasksRes.data) setTasks(tasksRes.data.map(transformDbTask));
      
      // ... continue with other transformations

      // Set settings with defaults if no data found
      if (pomodoroSettingsRes.data) {
        setPomodoroSettings({
          workDuration: pomodoroSettingsRes.data.work_duration,
          shortBreakDuration: pomodoroSettingsRes.data.short_break_duration,
          longBreakDuration: pomodoroSettingsRes.data.long_break_duration,
          longBreakInterval: pomodoroSettingsRes.data.long_break_interval,
          autoStartBreaks: pomodoroSettingsRes.data.auto_start_breaks,
          autoStartWork: pomodoroSettingsRes.data.auto_start_work,
          soundEnabled: pomodoroSettingsRes.data.sound_enabled,
        });
      }

      if (aiSettingsRes.data) {
        setAISettings({
          enabled: aiSettingsRes.data.enabled,
          deepAnalysis: aiSettingsRes.data.deep_analysis,
          model: aiSettingsRes.data.model || 'gemini-1.5-pro',
          maxContextItems: aiSettingsRes.data.max_context_items || 100,
        });
      }

    } catch (error) {
      handleError(error, 'carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear all data when user logs out
      setProjects([]);
      setTasks([]);
      setNotes([]);
      // ... clear all other data
      setLoading(false);
    }
  }, [user]);

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
      
      setProjects(prev => [...prev, transformDbProject(data)]);
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
      
      setProjects(prev => prev.map(p => p.id === id ? transformDbProject(data) : p));
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
    addTask,
    updateTask,
    deleteTask,

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

    // Financial - placeholder implementations
    accounts,
    transactions,
    debts,
    goals,
    receivables,
    addAccount: async () => notImplemented('addAccount'),
    addTransaction: async () => notImplemented('addTransaction'),
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

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a SupabaseAppProvider');
  }
  return context;
}