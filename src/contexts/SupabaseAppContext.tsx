import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Project, Task, Note, TodoList, Account, Transaction, 
  Debt, Goal, Contact, ContactGroup, Receivable, 
  ProjectImage, ProjectWalletEntry, ClockifyTimeEntry, 
  PlakyBoard, PlakyColumn, PlakyItem, PomodoroSession, PomodoroSettings, AISettings,
  Activity, ActivityEntityRef, TodoItem
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

      // Load other data...
      await loadFinancialData();
      await loadContactsData();
      await loadNotesData();
      await loadTodoListsData();
      
    } catch (error) {
      handleError(error, 'loading data');
    } finally {
      setLoading(false);
    }
  };

  // Load financial data
  const loadFinancialData = async () => {
    if (!user) return;

    // Load accounts
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);
    
    if (accountsData) {
      setAccounts(accountsData.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type as "checking" | "savings" | "investment",
        balance: a.balance,
        createdAt: new Date(a.created_at),
        updatedAt: new Date(a.updated_at),
      })));
    }

    // Load transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);
    
    if (transactionsData) {
      setTransactions(transactionsData.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type as "deposit" | "withdrawal" | "transfer",
        category: t.category,
        date: new Date(t.date),
        accountId: t.account_id,
        createdAt: new Date(t.created_at),
      })));
    }

    // Load debts
    const { data: debtsData } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id);
    
    if (debtsData) {
      setDebts(debtsData.map(d => ({
        id: d.id,
        name: d.name,
        totalAmount: d.total_amount,
        remainingAmount: d.remaining_amount,
        dueDate: new Date(d.due_date),
        allocatedReceivableIds: d.allocated_receivable_ids || [],
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      })));
    }

    // Load goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id);
    
    if (goalsData) {
      setGoals(goalsData.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.target_amount,
        currentAmount: g.current_amount,
        targetDate: g.target_date ? new Date(g.target_date) : undefined,
        createdAt: new Date(g.created_at),
        updatedAt: new Date(g.updated_at),
      })));
    }

    // Load receivables
    const { data: receivablesData } = await supabase
      .from('receivables')
      .select('*')
      .eq('user_id', user.id);
    
    if (receivablesData) {
      setReceivables(receivablesData.map(r => ({
        id: r.id,
        name: r.name,
        amount: r.amount,
        dueDate: new Date(r.due_date),
        description: r.description,
        projectId: r.project_id,
        status: r.status,
        receivedAt: r.received_at ? new Date(r.received_at) : undefined,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })));
    }
  };

  // Load contacts data
  const loadContactsData = async () => {
    if (!user) return;

    // Load contacts
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);
    
    if (contactsData) {
      setContacts(contactsData.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        linkedin: c.linkedin,
        avatarUrl: c.avatar_url,
        notes: c.notes,
        skills: c.skills || [],
        projectIds: c.project_ids || [],
        groupIds: c.group_ids || [],
        attachments: c.attachments || [],
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })));
    }

    // Load contact groups
    const { data: groupsData } = await supabase
      .from('contact_groups')
      .select('*')
      .eq('user_id', user.id);
    
    if (groupsData) {
      setContactGroups(groupsData.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        memberIds: g.member_ids || [],
        createdAt: new Date(g.created_at),
        updatedAt: new Date(g.updated_at),
      })));
    }
  };

  // Load notes data
  const loadNotesData = async () => {
    if (!user) return;

    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id);
    
    if (notesData) {
      setNotes(notesData.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        projectId: n.project_id,
        createdAt: new Date(n.created_at),
        updatedAt: new Date(n.updated_at),
      })));
    }
  };

  // Load todo lists data
  const loadTodoListsData = async () => {
    if (!user) return;

    const { data: todoListsData } = await supabase
      .from('todo_lists')
      .select('*')
      .eq('user_id', user.id);
    
    if (todoListsData) {
      setTodoLists(todoListsData.map(tl => ({
        id: tl.id,
        title: tl.title,
        items: tl.items as TodoItem[],
        projectId: tl.project_id,
        createdAt: new Date(tl.created_at),
        updatedAt: new Date(tl.updated_at),
      })));
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
      addActivity('project_created', { type: 'project', id: data.id, label: project.name });
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
      addActivity('project_updated', { type: 'project', id, label: updates.name || 'Project' });
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
      addActivity('project_deleted', { type: 'project', id, label: 'Project' });
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

  // Task methods implementation
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
      addActivity('task_created', { type: 'task', id: data.id, label: task.title });
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
      addActivity('task_updated', { type: 'task', id, label: updates.title || 'Task' });
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
      addActivity('task_deleted', { type: 'task', id, label: 'Task' });
    } catch (error) {
      handleError(error, 'deletar tarefa');
    }
  };

  // Notes methods
  const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: note.title,
          content: note.content,
          project_id: note.projectId,
        })
        .select()
        .single();

      if (error) throw error;
      
      setNotes(prev => [...prev, {
        id: data.id,
        title: data.title,
        content: data.content,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('note_created', { type: 'note', id: data.id, label: note.title });
    } catch (error) {
      handleError(error, 'adicionar nota');
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: updates.title,
          content: updates.content,
          project_id: updates.projectId,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setNotes(prev => prev.map(n => n.id === id ? {
        id: data.id,
        title: data.title,
        content: data.content,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : n));
      addActivity('note_updated', { type: 'note', id, label: updates.title || 'Note' });
    } catch (error) {
      handleError(error, 'atualizar nota');
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setNotes(prev => prev.filter(n => n.id !== id));
      addActivity('note_deleted', { type: 'note', id, label: 'Note' });
    } catch (error) {
      handleError(error, 'deletar nota');
    }
  };

  // Todo Lists methods
  const addTodoList = async (todoList: Omit<TodoList, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('todo_lists')
        .insert({
          user_id: user.id,
          title: todoList.title,
          items: todoList.items,
          project_id: todoList.projectId,
        })
        .select()
        .single();

      if (error) throw error;
      
      setTodoLists(prev => [...prev, {
        id: data.id,
        title: data.title,
        items: data.items,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('todo_list_created', { type: 'todo_list', id: data.id, label: todoList.title });
    } catch (error) {
      handleError(error, 'adicionar lista de tarefas');
    }
  };

  const updateTodoList = async (id: string, updates: Partial<TodoList>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('todo_lists')
        .update({
          title: updates.title,
          items: updates.items,
          project_id: updates.projectId,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setTodoLists(prev => prev.map(tl => tl.id === id ? {
        id: data.id,
        title: data.title,
        items: data.items,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : tl));
      addActivity('todo_list_updated', { type: 'todo_list', id, label: updates.title || 'Todo List' });
    } catch (error) {
      handleError(error, 'atualizar lista de tarefas');
    }
  };

  const deleteTodoList = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('todo_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTodoLists(prev => prev.filter(tl => tl.id !== id));
      addActivity('todo_list_deleted', { type: 'todo_list', id, label: 'Todo List' });
    } catch (error) {
      handleError(error, 'deletar lista de tarefas');
    }
  };

  // Financial methods
  const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: account.name,
          type: account.type,
          balance: account.balance,
        })
        .select()
        .single();

      if (error) throw error;
      
      setAccounts(prev => [...prev, {
        id: data.id,
        name: data.name,
        type: data.type,
        balance: data.balance,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('account_created', { type: 'account', id: data.id, label: account.name });
    } catch (error) {
      handleError(error, 'adicionar conta');
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          name: updates.name,
          type: updates.type,
          balance: updates.balance,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setAccounts(prev => prev.map(a => a.id === id ? {
        id: data.id,
        name: data.name,
        type: data.type,
        balance: data.balance,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : a));
      addActivity('account_updated', { type: 'account', id, label: updates.name || 'Account' });
    } catch (error) {
      handleError(error, 'atualizar conta');
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setAccounts(prev => prev.filter(a => a.id !== id));
      addActivity('account_deleted', { type: 'account', id, label: 'Account' });
    } catch (error) {
      handleError(error, 'deletar conta');
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: transaction.accountId,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTransaction: Transaction = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        type: data.type as "deposit" | "withdrawal" | "transfer",
        category: data.category,
        date: new Date(data.date),
        accountId: data.account_id,
        createdAt: new Date(data.created_at)
      };
      
      setTransactions(prev => [...prev, newTransaction]);
      addActivity('transaction_created', { type: 'transaction', id: data.id, label: transaction.description });
    } catch (error) {
      handleError(error, 'adicionar transação');
    }
  };

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

  // Debts methods
  const addDebt = async (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: user.id,
          name: debt.name,
          total_amount: debt.totalAmount,
          remaining_amount: debt.remainingAmount,
          due_date: debt.dueDate.toISOString(),
          allocated_receivable_ids: debt.allocatedReceivableIds || [],
        })
        .select()
        .single();

      if (error) throw error;
      
      setDebts(prev => [...prev, {
        id: data.id,
        name: data.name,
        totalAmount: data.total_amount,
        remainingAmount: data.remaining_amount,
        dueDate: new Date(data.due_date),
        allocatedReceivableIds: data.allocated_receivable_ids,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('debt_created', { type: 'debt', id: data.id, label: debt.name });
    } catch (error) {
      handleError(error, 'adicionar dívida');
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('debts')
        .update({
          name: updates.name,
          total_amount: updates.totalAmount,
          remaining_amount: updates.remainingAmount,
          due_date: updates.dueDate?.toISOString(),
          allocated_receivable_ids: updates.allocatedReceivableIds,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setDebts(prev => prev.map(d => d.id === id ? {
        id: data.id,
        name: data.name,
        totalAmount: data.total_amount,
        remainingAmount: data.remaining_amount,
        dueDate: new Date(data.due_date),
        allocatedReceivableIds: data.allocated_receivable_ids,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : d));
      addActivity('debt_updated', { type: 'debt', id, label: updates.name || 'Debt' });
    } catch (error) {
      handleError(error, 'atualizar dívida');
    }
  };

  // Goals methods
  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          target_date: goal.targetDate?.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => [...prev, {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        targetDate: data.target_date ? new Date(data.target_date) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('goal_created', { type: 'goal', id: data.id, label: goal.name });
    } catch (error) {
      handleError(error, 'adicionar meta');
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .update({
          name: updates.name,
          target_amount: updates.targetAmount,
          current_amount: updates.currentAmount,
          target_date: updates.targetDate?.toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => prev.map(g => g.id === id ? {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        targetDate: data.target_date ? new Date(data.target_date) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : g));
      addActivity('goal_updated', { type: 'goal', id, label: updates.name || 'Goal' });
    } catch (error) {
      handleError(error, 'atualizar meta');
    }
  };

  // Receivables methods
  const addReceivable = async (receivable: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'receivedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('receivables')
        .insert({
          user_id: user.id,
          name: receivable.name,
          amount: receivable.amount,
          due_date: receivable.dueDate.toISOString(),
          description: receivable.description,
          project_id: receivable.projectId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      setReceivables(prev => [...prev, {
        id: data.id,
        name: data.name,
        amount: data.amount,
        dueDate: new Date(data.due_date),
        description: data.description,
        projectId: data.project_id,
        status: data.status,
        receivedAt: data.received_at ? new Date(data.received_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('receivable_created', { type: 'receivable', id: data.id, label: receivable.name });
    } catch (error) {
      handleError(error, 'adicionar recebível');
    }
  };

  const updateReceivable = async (id: string, updates: Partial<Receivable>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('receivables')
        .update({
          name: updates.name,
          amount: updates.amount,
          due_date: updates.dueDate?.toISOString(),
          description: updates.description,
          project_id: updates.projectId,
          status: updates.status,
          received_at: updates.receivedAt?.toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setReceivables(prev => prev.map(r => r.id === id ? {
        id: data.id,
        name: data.name,
        amount: data.amount,
        dueDate: new Date(data.due_date),
        description: data.description,
        projectId: data.project_id,
        status: data.status,
        receivedAt: data.received_at ? new Date(data.received_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : r));
      addActivity('receivable_updated', { type: 'receivable', id, label: updates.name || 'Receivable' });
    } catch (error) {
      handleError(error, 'atualizar recebível');
    }
  };

  const deleteReceivable = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('receivables')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setReceivables(prev => prev.filter(r => r.id !== id));
      addActivity('receivable_deleted', { type: 'receivable', id, label: 'Receivable' });
    } catch (error) {
      handleError(error, 'deletar recebível');
    }
  };

  // Financial operations
  const payDebt = async (debtId: string, accountId: string, amount: number) => {
    if (!user) return;
    
    try {
      // Find the debt
      const debt = debts.find(d => d.id === debtId);
      if (!debt) throw new Error('Debt not found');

      // Update debt remaining amount
      await updateDebt(debtId, {
        remainingAmount: debt.remainingAmount - amount
      });

      // Create transaction for debt payment
      await addTransaction({
        accountId,
        amount: -amount,
        type: 'withdrawal',
        category: 'Debt Payment',
        description: `Payment for debt: ${debt.name}`,
        date: new Date(),
      });

      addActivity('debt_payment', { type: 'debt', id: debtId, label: debt.name }, { amount });
    } catch (error) {
      handleError(error, 'pagar dívida');
    }
  };

  const allocateToGoal = async (goalId: string, accountId: string, amount: number) => {
    if (!user) return;
    
    try {
      // Find the goal
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      // Update goal current amount
      await updateGoal(goalId, {
        currentAmount: goal.currentAmount + amount
      });

      // Create transaction for goal allocation
      await addTransaction({
        accountId,
        amount: -amount,
        type: 'withdrawal',
        category: 'Goal Allocation',
        description: `Allocation to goal: ${goal.name}`,
        date: new Date(),
      });

      addActivity('goal_allocation', { type: 'goal', id: goalId, label: goal.name }, { amount });
    } catch (error) {
      handleError(error, 'alocar para meta');
    }
  };

  const receiveReceivable = async (receivableId: string, accountId: string) => {
    if (!user) return;
    
    try {
      // Find the receivable
      const receivable = receivables.find(r => r.id === receivableId);
      if (!receivable) throw new Error('Receivable not found');

      // Update receivable status
      await updateReceivable(receivableId, {
        status: 'received',
        receivedAt: new Date()
      });

      // Create transaction for receivable payment
      await addTransaction({
        accountId,
        amount: receivable.amount,
        type: 'deposit',
        category: 'Receivable',
        description: `Received: ${receivable.name}`,
        date: new Date(),
      });

      addActivity('receivable_received', { type: 'receivable', id: receivableId, label: receivable.name });
    } catch (error) {
      handleError(error, 'receber recebível');
    }
  };

  // Contact methods
  const addContact = async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          linkedin: contact.linkedin,
          avatar_url: contact.avatarUrl,
          notes: contact.notes,
          skills: contact.skills,
          project_ids: contact.projectIds,
          group_ids: contact.groupIds,
          attachments: contact.attachments,
        })
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => [...prev, {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        linkedin: data.linkedin,
        avatarUrl: data.avatar_url,
        notes: data.notes,
        skills: data.skills || [],
        projectIds: data.project_ids || [],
        groupIds: data.group_ids || [],
        attachments: data.attachments || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('contact_created', { type: 'contact', id: data.id, label: contact.name });
    } catch (error) {
      handleError(error, 'adicionar contato');
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          whatsapp: updates.whatsapp,
          linkedin: updates.linkedin,
          avatar_url: updates.avatarUrl,
          notes: updates.notes,
          skills: updates.skills,
          project_ids: updates.projectIds,
          group_ids: updates.groupIds,
          attachments: updates.attachments,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => prev.map(c => c.id === id ? {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        linkedin: data.linkedin,
        avatarUrl: data.avatar_url,
        notes: data.notes,
        skills: data.skills || [],
        projectIds: data.project_ids || [],
        groupIds: data.group_ids || [],
        attachments: data.attachments || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : c));
      addActivity('contact_updated', { type: 'contact', id, label: updates.name || 'Contact' });
    } catch (error) {
      handleError(error, 'atualizar contato');
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setContacts(prev => prev.filter(c => c.id !== id));
      addActivity('contact_deleted', { type: 'contact', id, label: 'Contact' });
    } catch (error) {
      handleError(error, 'deletar contato');
    }
  };

  const addContactGroup = async (group: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_groups')
        .insert({
          user_id: user.id,
          name: group.name,
          description: group.description,
          member_ids: group.memberIds,
        })
        .select()
        .single();

      if (error) throw error;
      
      setContactGroups(prev => [...prev, {
        id: data.id,
        name: data.name,
        description: data.description,
        memberIds: data.member_ids || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);
      addActivity('contact_group_created', { type: 'contact_group', id: data.id, label: group.name });
    } catch (error) {
      handleError(error, 'adicionar grupo de contatos');
    }
  };

  const updateContactGroup = async (id: string, updates: Partial<ContactGroup>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_groups')
        .update({
          name: updates.name,
          description: updates.description,
          member_ids: updates.memberIds,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setContactGroups(prev => prev.map(g => g.id === id ? {
        id: data.id,
        name: data.name,
        description: data.description,
        memberIds: data.member_ids || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } : g));
      addActivity('contact_group_updated', { type: 'contact_group', id, label: updates.name || 'Contact Group' });
    } catch (error) {
      handleError(error, 'atualizar grupo de contatos');
    }
  };

  const deleteContactGroup = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('contact_groups')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setContactGroups(prev => prev.filter(g => g.id !== id));
      addActivity('contact_group_deleted', { type: 'contact_group', id, label: 'Contact Group' });
    } catch (error) {
      handleError(error, 'deletar grupo de contatos');
    }
  };

  // Routine methods - placeholder implementations
  const addRoutine = async (routine: any) => {
    console.warn('Routine functionality not yet implemented in Supabase');
    toast({
      title: 'Funcionalidade não implementada',
      description: 'Rotinas ainda não estão disponíveis no modo Supabase',
      variant: 'destructive',
    });
  };

  const completeRoutineOnce = async (routineId: string, date: string) => {
    console.warn('Routine functionality not yet implemented in Supabase');
  };

  const skipRoutineDay = async (routineId: string, date: string) => {
    console.warn('Routine functionality not yet implemented in Supabase');
  };

  const skipRoutineBetween = async (routineId: string, startDate: string, endDate: string) => {
    console.warn('Routine functionality not yet implemented in Supabase');
  };

  const getRoutineProgress = async (routineId: string, startDate: string, endDate: string) => {
    console.warn('Routine functionality not yet implemented in Supabase');
    return { completed: 0, skipped: 0, paused: 0, total: 0 };
  };

  // Implementation helper
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

    // Notes
    notes,
    addNote,
    updateNote,
    deleteNote,

    // TodoLists
    todoLists,
    addTodoList,
    updateTodoList,
    deleteTodoList,

    // Financial
    accounts,
    transactions,
    debts,
    goals,
    receivables,
    addAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addDebt,
    addGoal,
    updateAccount,
    deleteAccount,
    updateDebt,
    updateGoal,
    payDebt,
    allocateToGoal,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    receiveReceivable,

    // Network
    contacts,
    contactGroups,
    addContact,
    updateContact,
    deleteContact,
    addContactGroup,
    updateContactGroup,
    deleteContactGroup,

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
