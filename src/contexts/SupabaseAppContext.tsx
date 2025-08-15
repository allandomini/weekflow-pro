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
  
  // Add activity to the log
  const addActivity = async (action: string, entity?: ActivityEntityRef, meta?: Record<string, any>) => {
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
        action,
        ...(entity && { entity }),
        ...(meta && { meta })
      };

      // Add to local state optimistically
      setActivities(prev => [activity, ...prev].slice(0, 100)); // Keep only last 100 activities

      try {
        const activityData: any = {
          action,
          actor: user?.email || 'system',
          user_id: user.id,
          created_at: now.toISOString(),
          metadata: meta || {}
        };

        if (entity) {
          activityData.entity_type = entity.type;
          activityData.entity_id = entity.id;
          activityData.entity_label = entity.label;
        }

        const { data, error } = await supabase
          .from('activities')
          .insert(activityData)
          .select()
          .single();

        if (error) throw error;

        // Update the activity with the server-generated ID
        setActivities(prev => 
          prev.map(a => 
            a.id === activity.id 
              ? { ...a, id: data.id } 
              : a
          )
        );

        return { ...activity, id: data.id };
      } catch (dbError) {
        // Revert optimistic update on error
        setActivities(prev => prev.filter(a => a.id !== activity.id));
        console.error('Database error logging activity:', dbError);
        throw dbError;
      }
    } catch (error) {
      console.error('Error in addActivity:', error);
      handleError(error, 'log activity');
      throw error;
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

  // Routine methods
  const addRoutine = async (routine: any) => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .insert(routine)
        .select()
        .single();

      if (error) throw error;
      
      setRoutines(prev => [...prev, data]);
      return data;
    } catch (error) {
      handleError(error, 'adicionar rotina');
      throw error;
    }
  };

  const completeRoutineOnce = async (routineId: string, date: string) => {
    try {
      const { error } = await supabase
        .from('routine_completions')
        .upsert({
          routine_id: routineId,
          date,
          completed: true
        });

      if (error) throw error;
      
      // Refresh routines data
      await refreshData();
    } catch (error) {
      handleError(error, 'marcar rotina como concluída');
      throw error;
    }
  };

  const skipRoutineDay = async (routineId: string, date: string) => {
    try {
      const { error } = await supabase
        .from('routine_skips')
        .upsert({
          routine_id: routineId,
          date,
          skipped: true
        });

      if (error) throw error;
      
      // Refresh routines data
      await refreshData();
    } catch (error) {
      handleError(error, 'pular rotina');
      throw error;
    }
  };

  const skipRoutineBetween = async (routineId: string, startDate: string, endDate: string) => {
    try {
      // Get all dates between start and end
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
      
      // Insert skips for all dates
      const { error } = await supabase
        .from('routine_skips')
        .upsert(
          dates.map(date => ({
            routine_id: routineId,
            date,
            skipped: true
          })),
          { onConflict: 'routine_id,date' }
        );

      if (error) throw error;
      
      // Refresh routines data
      await refreshData();
    } catch (error) {
      handleError(error, 'pausar rotina');
      throw error;
    }
  };

  const getRoutineProgress = async (routineId: string, startDate: string, endDate: string) => {
    try {
      // Get completions in date range
      const { data: completions } = await supabase
        .from('routine_completions')
        .select('date')
        .eq('routine_id', routineId)
        .gte('date', startDate)
        .lte('date', endDate);

      // Get skips in date range
      const { data: skips } = await supabase
        .from('routine_skips')
        .select('date')
        .eq('routine_id', routineId)
        .gte('date', startDate)
        .lte('date', endDate);

      // Get paused periods in date range
      const { data: paused } = await supabase
        .from('routine_pauses')
        .select('start_date, end_date')
        .eq('routine_id', routineId)
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      return {
        completed: completions?.length || 0,
        skipped: skips?.length || 0,
        paused: paused?.length || 0,
        total: 0 // Will be calculated in the component
      };
    } catch (error) {
      handleError(error, 'obter progresso da rotina');
      throw error;
    }
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
      
      setTransactions(prev => 
        prev.map(tx => tx.id === id ? { ...tx, ...data } : tx)
      );
      
      return data;
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
      await addActivity('transaction_deleted', { 
        type: 'transaction', 
        id,
        label: `Transaction ${id}`
      });
      
      return true;
    } catch (error) {
      handleError(error, 'excluir transação');
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      
      await addActivity('task_deleted', {
        type: 'task',
        id,
        label: task.title
      });

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const now = new Date();
      const taskToInsert = {
        title: taskData.title,
        description: taskData.description || null,
        completed: taskData.completed || false,
        project_id: taskData.projectId || null,
        date: taskData.date instanceof Date ? taskData.date.toISOString().split('T')[0] : taskData.date,
        start_time: taskData.startTime || null,
        end_time: taskData.endTime || null,
        is_routine: taskData.isRoutine || false,
        is_overdue: taskData.isOverdue || false,
        user_id: user.id,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        labels: taskData.labels || [],
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToInsert)
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        projectId: data.project_id,
        date: new Date(data.date),
        startTime: data.start_time,
        endTime: data.end_time,
        isRoutine: data.is_routine,
        isOverdue: data.is_overdue,
        priority: data.priority,
        status: data.status,
        labels: data.labels || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setTasks(prev => [...prev, newTask]);
      
      // Log activity
      await addActivity('task_created', { 
        type: 'task', 
        id: data.id,
        label: data.title
      }, {
        projectId: data.project_id,
        priority: data.priority,
        status: data.status
      });
      
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      handleError(error, 'adding task');
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const now = new Date();
      const taskUpdates: Record<string, any> = {
        ...updates,
        updated_at: now.toISOString()
      };

      // Handle date conversion if provided
      if (updates.date) {
        taskUpdates.date = updates.date instanceof Date 
          ? updates.date.toISOString().split('T')[0] 
          : updates.date;
      }

      // Map frontend field names to database column names
      if ('projectId' in updates) {
        taskUpdates.project_id = updates.projectId;
        delete taskUpdates.projectId;
      }
      if ('startTime' in updates) {
        taskUpdates.start_time = updates.startTime;
        delete taskUpdates.startTime;
      }
      if ('endTime' in updates) {
        taskUpdates.end_time = updates.endTime;
        delete taskUpdates.endTime;
      }
      if ('isRoutine' in updates) {
        taskUpdates.is_routine = updates.isRoutine;
        delete taskUpdates.isRoutine;
      }
      if ('isOverdue' in updates) {
        taskUpdates.is_overdue = updates.isOverdue;
        delete taskUpdates.isOverdue;
      }

      // Get the task before updating to track changes
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (!existingTask) {
        throw new Error('Task not found');
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(taskUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        projectId: data.project_id,
        date: new Date(data.date),
        startTime: data.start_time,
        endTime: data.end_time,
        isRoutine: data.is_routine,
        isOverdue: data.is_overdue,
        priority: data.priority,
        status: data.status,
        labels: data.labels || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updatedTask } : task
      ));
      
      // Log activity with detailed change information
      const changedFields: Record<string, { from: any; to: any }> = {};
      
      Object.entries(updates).forEach(([key, value]) => {
        if (JSON.stringify(existingTask[key]) !== JSON.stringify(value)) {
          changedFields[key] = {
            from: existingTask[key],
            to: value
          };
        }
      });

      if (Object.keys(changedFields).length > 0) {
        await addActivity('task_updated', {
          type: 'task',
          id,
          label: updates.title || existingTask.title
        }, {
          changes: changedFields,
          projectId: data.project_id
        });
      }

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      handleError(error, 'updating task');
      throw error;
    }
  };

const deleteProject = async (id: string) => {
  try {
    const project = projects.find(p => p.id === id);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setProjects(prev => prev.filter(project => project.id !== id));

    // Log activity
    if (project) {
      addActivity('project_deleted', {
        type: 'project',
        id,
        label: project.name
      });
    }

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;

    setProjects(prev => [...prev, data]);

    // Log activity
    addActivity('project_created', {
      type: 'project',
      id: data.id,
      label: project.name
    });

    return data;
  } catch (error) {
    if (error) throw error;

    setProjects(prev => prev.map(project =>
      project.id === id ? { ...project, ...data } : project
    ));
    try {
      // First, check if there are any transactions linked to this account
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (transactionsError) throw transactionsError;
      
      if (transactions && transactions.length > 0) {
        throw new Error('Não é possível excluir uma conta que possui transações vinculadas.');
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (error) {
      handleError(error, 'excluir conta');
      throw error;
    }
  };

  // Transaction methods
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update the account balance
      if (transaction.accountId) {
        const account = accounts.find(acc => acc.id === transaction.accountId);
        if (account) {
          const amount = transaction.amount || 0;
          const newBalance = account.balance + amount;
          await updateAccount(transaction.accountId, { balance: newBalance });
        }
      }
      
      setTransactions(prev => [...prev, data]);
      return data;
    } catch (error) {
      handleError(error, 'adicionar transação');
      throw error;
    }
  };

  // Refresh all data from the database
  const refreshData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        { data: projectsData },
        { data: tasksData },
        { data: routinesData },
        { data: notesData },
        { data: todoListsData },
        { data: accountsData },
        { data: transactionsData },
        { data: debtsData },
        { data: goalsData },
        { data: receivablesData },
        { data: contactsData },
        { data: contactGroupsData },
        { data: projectImagesData },
        { data: projectWalletEntriesData },
        { data: clockifyTimeEntriesData },
        { data: plakyBoardsData },
        { data: plakyItemsData },
        { data: pomodoroSessionsData },
        { data: pomodoroSettingsData },
        { data: aiSettingsData }
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('routines').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('todo_lists').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('receivables').select('*'),
        supabase.from('contacts').select('*'),
        supabase.from('contact_groups').select('*'),
        supabase.from('project_images').select('*'),
        supabase.from('project_wallet_entries').select('*'),
        supabase.from('clockify_time_entries').select('*'),
        supabase.from('plaky_boards').select('*'),
        supabase.from('plaky_items').select('*'),
        supabase.from('pomodoro_sessions').select('*'),
        supabase.from('pomodoro_settings').select('*').single(),
        supabase.from('ai_settings').select('*').single()
      ]);

      // Update state with the fetched data
      if (projectsData) setProjects(projectsData.map(transformDbProject));
      if (tasksData) setTasks(tasksData.map(transformDbTask));
      if (routinesData) setRoutines(routinesData);
      if (notesData) setNotes(notesData);
      if (todoListsData) setTodoLists(todoListsData);
      if (accountsData) setAccounts(accountsData);
      if (transactionsData) setTransactions(transactionsData);
      if (debtsData) setDebts(debtsData);
      if (goalsData) setGoals(goalsData);
      if (receivablesData) setReceivables(receivablesData);
      if (contactsData) setContacts(contactsData);
      if (contactGroupsData) setContactGroups(contactGroupsData);
      if (projectImagesData) setProjectImages(projectImagesData);
      if (projectWalletEntriesData) setProjectWalletEntries(projectWalletEntriesData);
      if (clockifyTimeEntriesData) setClockifyTimeEntries(clockifyTimeEntriesData);
      if (plakyBoardsData) setPlakyBoards(plakyBoardsData);
      if (plakyItemsData) setPlakyItems(plakyItemsData);
      if (pomodoroSessionsData) setPomodoroSessions(pomodoroSessionsData);
      if (pomodoroSettingsData) setPomodoroSettings(pomodoroSettingsData);
      if (aiSettingsData) setAISettings(aiSettingsData);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar os dados. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    // Load actor name from local storage
    const savedName = localStorage.getItem('actorName');
    if (savedName) {
      setActorName(savedName);
    }
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
    addAccount,
    addTransaction,
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