import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Project, Task, Note, TodoList, Account, Transaction, 
  Debt, Goal, Contact, ContactGroup, Receivable, 
  ProjectImage, ProjectWalletEntry, ClockifyTimeEntry, 
  PlakyBoard, PlakyColumn, PlakyItem, PomodoroSession, PomodoroSettings, AISettings,
  Activity, ActivityEntityRef, Routine, RoutineCompletion, RoutineExceptionRecord, RoutineBulkOperation
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

  // Routines
  routines: Routine[];
  routineCompletions: Record<string, Record<string, RoutineCompletion>>;
  routineExceptions: RoutineExceptionRecord[];
  routineBulkOperations: RoutineBulkOperation[];
  routineLoading: boolean;
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'exceptions'>) => Promise<void>;
  updateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  softDeleteRoutine: (id: string) => Promise<void>;
  hardDeleteRoutine: (id: string) => Promise<void>;
  completeRoutineOnce: (routineId: string, date?: string, specificTime?: string) => Promise<void>;
  skipRoutineDay: (routineId: string, date?: string) => Promise<void>;
  skipRoutineBetween: (routineId: string, startDate: string, endDate: string) => Promise<void>;
  setRoutineException: (routineId: string, date: string, ex: { skip?: boolean; overrideTimesPerDay?: number; overrideTimes?: string[] }) => Promise<void>;
  pauseRoutineUntil: (routineId: string, untilDate: string) => Promise<void>;
  setRoutineActiveTo: (routineId: string, endDate: string) => Promise<void>;
  getRoutineProgress: (routineId: string, date?: string) => Promise<{ count: number; goal: number; skipped: boolean; paused: boolean }>;
  getRoutineOccurrences: (routineId: string, startDate: string, endDate: string) => Promise<Array<{ date: string; times: string[]; count: number }>>;
  bulkDeleteRoutineOccurrences: (routineId: string, dates: string[]) => Promise<void>;
  bulkSkipRoutinePeriod: (routineId: string, startDate: string, endDate: string) => Promise<void>;

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
  logActivity: (activity: Omit<Activity, 'id' | 'at' | 'actor'>) => Promise<void>;
  clearActivities: () => Promise<void>;

  // Loading states
  loading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function SupabaseAppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState({
    global: true,
    projects: false,
    tasks: false,
    routines: false,
    notes: false,
    todoLists: false,
    finances: false,
    contacts: false,
    clockify: false,
    plaky: false,
    pomodoro: false
  });
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
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineCompletions, setRoutineCompletions] = useState<Record<string, Record<string, RoutineCompletion>>>({});
  const [routineExceptions, setRoutineExceptions] = useState<RoutineExceptionRecord[]>([]);
  const [routineBulkOperations, setRoutineBulkOperations] = useState<RoutineBulkOperation[]>([]);
  const [routineLoading, setRoutineLoading] = useState(false);
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

  // Transform database note to app note
  const transformDbNote = (dbNote: any): Note => ({
    id: dbNote.id,
    title: dbNote.title,
    content: dbNote.content,
    projectId: dbNote.project_id,
    createdAt: new Date(dbNote.created_at),
    updatedAt: new Date(dbNote.updated_at),
  });

  // Transform database account to app account
  const transformDbAccount = (dbAccount: any): Account => ({
    id: dbAccount.id,
    name: dbAccount.name,
    balance: parseFloat(dbAccount.balance),
    type: dbAccount.type,
    createdAt: new Date(dbAccount.created_at),
    updatedAt: new Date(dbAccount.updated_at),
  });

  // Transform database transaction to app transaction
  const transformDbTransaction = (dbTransaction: any): Transaction => ({
    id: dbTransaction.id,
    description: dbTransaction.description,
    amount: parseFloat(dbTransaction.amount),
    type: dbTransaction.type,
    category: dbTransaction.category,
    date: new Date(dbTransaction.date),
    accountId: dbTransaction.account_id,
    createdAt: new Date(dbTransaction.created_at)
  });

  // Transform database debt to app debt
  const transformDbDebt = (dbDebt: any): Debt => ({
    id: dbDebt.id,
    name: dbDebt.name,
    totalAmount: parseFloat(dbDebt.total_amount),
    remainingAmount: parseFloat(dbDebt.remaining_amount),
    dueDate: new Date(dbDebt.due_date),
    createdAt: new Date(dbDebt.created_at),
    updatedAt: new Date(dbDebt.updated_at),
  });

  // Transform database goal to app goal
  const transformDbGoal = (dbGoal: any): Goal => ({
    id: dbGoal.id,
    name: dbGoal.name,
    targetAmount: parseFloat(dbGoal.target_amount),
    currentAmount: parseFloat(dbGoal.current_amount),
    targetDate: dbGoal.target_date ? new Date(dbGoal.target_date) : undefined,
    createdAt: new Date(dbGoal.created_at),
    updatedAt: new Date(dbGoal.updated_at),
  });

  // Transform database receivable to app receivable
  const transformDbReceivable = (dbReceivable: any): Receivable => ({
    id: dbReceivable.id,
    name: dbReceivable.name,
    amount: parseFloat(dbReceivable.amount),
    dueDate: new Date(dbReceivable.due_date),
    status: dbReceivable.status as 'pending' | 'received',
    description: dbReceivable.description,
    projectId: dbReceivable.project_id,
    receivedAt: dbReceivable.received_at ? new Date(dbReceivable.received_at) : undefined,
    createdAt: new Date(dbReceivable.created_at),
    updatedAt: new Date(dbReceivable.updated_at),
  });

  // Transform database contact to app contact
  const transformDbContact = (dbContact: any): Contact => ({
    id: dbContact.id,
    name: dbContact.name,
    avatarUrl: dbContact.avatar_url,
    email: dbContact.email,
    phone: dbContact.phone,
    linkedin: dbContact.linkedin,
    whatsapp: dbContact.whatsapp,
    skills: Array.isArray(dbContact.skills) ? dbContact.skills : 
            (typeof dbContact.skills === 'string' ? JSON.parse(dbContact.skills || '[]') : []),
    notes: dbContact.notes,
    projectIds: Array.isArray(dbContact.project_ids) ? dbContact.project_ids : 
               (typeof dbContact.project_ids === 'string' ? JSON.parse(dbContact.project_ids || '[]') : []),
    groupIds: Array.isArray(dbContact.group_ids) ? dbContact.group_ids : 
              (typeof dbContact.group_ids === 'string' ? JSON.parse(dbContact.group_ids || '[]') : []),
    attachments: Array.isArray(dbContact.attachments) ? dbContact.attachments : 
                (typeof dbContact.attachments === 'string' ? JSON.parse(dbContact.attachments || '[]') : []),
    createdAt: new Date(dbContact.created_at),
    updatedAt: new Date(dbContact.updated_at),
  });

  // Transform database contact group to app contact group
  const transformDbContactGroup = (dbContactGroup: any): ContactGroup => ({
    id: dbContactGroup.id,
    name: dbContactGroup.name,
    description: dbContactGroup.description,
    memberIds: Array.isArray(dbContactGroup.member_ids) ? dbContactGroup.member_ids : 
               (typeof dbContactGroup.member_ids === 'string' ? JSON.parse(dbContactGroup.member_ids || '[]') : []),
    createdAt: new Date(dbContactGroup.created_at),
    updatedAt: new Date(dbContactGroup.updated_at),
  });

  // Transform database clockify time entry to app clockify time entry
  const transformDbClockifyTimeEntry = (dbEntry: any): ClockifyTimeEntry => ({
    id: dbEntry.id,
    description: dbEntry.description,
    projectId: dbEntry.project_id,
    personIds: Array.isArray(dbEntry.person_ids) ? dbEntry.person_ids : 
               (typeof dbEntry.person_ids === 'string' ? JSON.parse(dbEntry.person_ids || '[]') : []),
    startTime: new Date(dbEntry.start_time),
    endTime: dbEntry.end_time ? new Date(dbEntry.end_time) : undefined,
    duration: dbEntry.duration,
    billable: dbEntry.billable,
    hourlyRate: dbEntry.hourly_rate,
    tags: Array.isArray(dbEntry.tags) ? dbEntry.tags : 
          (typeof dbEntry.tags === 'string' ? JSON.parse(dbEntry.tags || '[]') : []),
    status: dbEntry.status,
    createdAt: new Date(dbEntry.created_at),
    updatedAt: new Date(dbEntry.updated_at),
  });

  // Load all data function - OPTIMIZED VERSION
  const loadAllData = async () => {
    if (!user) return;
    
    console.log('Loading all data for user:', user.id);
    setLoadingStates(prev => ({
      ...prev,
      global: true
    }));
    try {
      // Load all data in parallel for better performance
      const [
        { data: projectsData },
        { data: tasksData },
        { data: routinesData, error: routinesError },
        { data: routineCompletionsData, error: routineCompletionsError },
        { data: notesData },
        { data: contactsData, error: contactsError },
        { data: contactGroupsData, error: contactGroupsError },
        { data: clockifyData, error: clockifyError },
        { data: accountsData },
        { data: transactionsData },
        { data: debtsData, error: debtsError },
        { data: goalsData, error: goalsError },
        { data: receivablesData, error: receivablesError },
        { data: pomodoroSettingsData },
        { data: aiSettingsData },
        { data: activitiesData, error: activitiesError }
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('routines').select('*').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('routine_completions').select('*').eq('user_id', user.id),
        supabase.from('notes').select('*').eq('user_id', user.id),
        supabase.from('contacts').select('*').eq('user_id', user.id),
        supabase.from('contact_groups').select('*').eq('user_id', user.id),
        supabase.from('clockify_time_entries').select('*').eq('user_id', user.id),
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('receivables').select('*').eq('user_id', user.id),
        supabase.from('pomodoro_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('ai_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('activities').select('*').eq('user_id', user.id).order('at', { ascending: false }).limit(100)
      ]);

      // Handle errors
      if (routinesError) console.error('Error loading routines:', routinesError);
      if (routineCompletionsError) console.error('Error loading routine completions:', routineCompletionsError);
      if (contactsError) console.error('Error loading contacts:', contactsError);
      if (contactGroupsError) console.error('Error loading contact groups:', contactGroupsError);
      if (clockifyError) console.error('Error loading clockify time entries:', clockifyError);
      if (debtsError) console.error('Error loading debts:', debtsError);
      if (goalsError) console.error('Error loading goals:', goalsError);
      if (receivablesError) console.error('Error loading receivables:', receivablesError);
      if (activitiesError) console.error('Error loading activities:', activitiesError);

      // Set projects
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

      // Set tasks
      if (tasksData) {
        setTasks(tasksData.map(transformDbTask));
      }

      // Set routines
      if (routinesData) {
        console.log('Routines loaded:', routinesData.length);
        setRoutines(routinesData.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          color: r.color,
          timesPerDay: r.times_per_day,
          specificTimes: r.specific_times || [],
          weekdays: r.weekdays || [],
          durationDays: r.duration_days || null,
          priority: (r.priority as 'low' | 'medium' | 'high') || 'medium',
          schedule: typeof r.schedule === 'string' ? JSON.parse(r.schedule) : r.schedule,
          activeFrom: r.active_from,
          activeTo: r.active_to || undefined,
          pausedUntil: r.paused_until || undefined,
          exceptions: typeof r.exceptions === 'string' ? JSON.parse(r.exceptions) : r.exceptions,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
          deletedAt: r.deleted_at || null,
        })));
      }

      // Set routine completions - OPTIMIZED TRANSFORMATION
      if (routineCompletionsData) {
        console.log('Routine completions loaded:', routineCompletionsData.length);
        const completionsMap: Record<string, Record<string, RoutineCompletion>> = {};
        
        // Use reduce for better performance
        routineCompletionsData.reduce((acc, completion) => {
          const date = completion.date;
          const routineId = completion.routine_id;
          
          if (!acc[date]) {
            acc[date] = {};
          }
          
          acc[date][routineId] = {
            id: completion.id,
            routineId: completion.routine_id,
            date: completion.date,
            count: completion.count,
            goal: completion.goal,
            skipped: completion.skipped,
            paused: completion.paused,
            specificTime: completion.specific_time || undefined,
            completedAt: completion.completed_at ? new Date(completion.completed_at) : undefined,
            createdAt: new Date(completion.created_at),
            updatedAt: new Date(completion.updated_at)
          };
          
          return acc;
        }, completionsMap);
        
        setRoutineCompletions(completionsMap);
      }

      // Set notes
      if (notesData) {
        setNotes(notesData.map(transformDbNote));
      }

      // Set contacts
      if (contactsData) {
        console.log('Contacts loaded:', contactsData);
        setContacts(contactsData.map(transformDbContact));
      }

      // Set contact groups
      if (contactGroupsData) {
        console.log('Contact groups loaded:', contactGroupsData);
        setContactGroups(contactGroupsData.map(transformDbContactGroup));
      }

      // Set Clockify time entries
      if (clockifyData) {
        console.log('Clockify time entries loaded:', clockifyData);
        setClockifyTimeEntries(clockifyData.map(transformDbClockifyTimeEntry));
      }

      // Set accounts
      if (accountsData) {
        setAccounts(accountsData.map(transformDbAccount));
      }

      // Set transactions
      if (transactionsData) {
        setTransactions(transactionsData.map(transformDbTransaction));
      }

      // Set debts
      if (debtsData) {
        console.log('Debts loaded:', debtsData);
        setDebts(debtsData.map(transformDbDebt));
      }

      // Set goals
      if (goalsData) {
        console.log('Goals loaded:', goalsData);
        setGoals(goalsData.map(transformDbGoal));
      }

      // Set receivables
      if (receivablesData) {
        console.log('Receivables loaded:', receivablesData);
        setReceivables(receivablesData.map(transformDbReceivable));
      }

      // Set pomodoro settings
      if (pomodoroSettingsData) {
        setPomodoroSettings({
          workDuration: pomodoroSettingsData.work_duration,
          shortBreakDuration: pomodoroSettingsData.short_break_duration,
          longBreakDuration: pomodoroSettingsData.long_break_duration,
          longBreakInterval: pomodoroSettingsData.long_break_interval,
          autoStartBreaks: pomodoroSettingsData.auto_start_breaks,
          autoStartWork: pomodoroSettingsData.auto_start_work,
          soundEnabled: pomodoroSettingsData.sound_enabled,
        });
      }

      // Set AI settings
      if (aiSettingsData) {
        setAISettings({
          enabled: aiSettingsData.enabled,
          deepAnalysis: aiSettingsData.deep_analysis,
          model: aiSettingsData.model,
          maxContextItems: aiSettingsData.max_context_items,
        });
      }

      // Set activities
      if (activitiesData) {
        console.log('Activities loaded:', activitiesData);
        setActivities(activitiesData.map(a => ({
          id: a.id,
          action: a.action as any,
          actor: 'user',
          entity: a.entity as any,
          meta: a.meta as Record<string, any>,
          at: new Date(a.at),
        })));
      }

      console.log('loadAllData completed successfully');
      setLoadingStates(prev => ({
        ...prev,
        global: false
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingStates(prev => ({
        ...prev,
        global: false
      }));
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
      
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setProjects(prev => [...prev, newProject]);
      await logActivity({ action: 'project_added', entity: { type: 'project', id: newProject.id, label: newProject.name } });
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
      
      const updatedProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      await logActivity({ action: 'project_updated', entity: { type: 'project', id, label: updates.name } });
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
      await logActivity({ action: 'project_deleted', entity: { type: 'project', id } });
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
          priority: task.priority,
          status: task.status,
          labels: task.labels,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTask = transformDbTask(data);
      setTasks(prev => [...prev, newTask]);
      await logActivity({
        action: 'task_created',
        entity: { type: 'task', id: newTask.id, label: newTask.title },
        meta: { date: newTask.date }
      });
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
          priority: updates.priority,
          status: updates.status,
          labels: updates.labels,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedTask = transformDbTask(data);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      // Log completion toggle
      if (typeof updates.completed === 'boolean') {
        const existing = tasks.find(t => t.id === id);
        if (existing && updates.completed !== existing.completed) {
          await logActivity({
            action: updates.completed ? 'task_completed' : 'task_uncompleted',
            entity: { type: 'task', id: existing.id, label: existing.title },
            meta: { date: existing.date }
          });
        }
      }
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
      await logActivity({ action: 'task_deleted', entity: { type: 'task', id } });
    } catch (error) {
      handleError(error, 'deletar tarefa');
    }
  };

  // Note methods
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
      
      const newNote = transformDbNote(data);
      setNotes(prev => [...prev, newNote]);
      await logActivity({ action: 'note_added', entity: { type: 'project', id: newNote.projectId || '', label: newNote.title }, meta: { noteId: newNote.id } });
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
      
      const updatedNote = transformDbNote(data);
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
      await logActivity({ action: 'note_updated', entity: { type: 'project', id: updates.projectId || '', label: updates.title }, meta: { noteId: id } });
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
      await logActivity({ action: 'note_deleted', meta: { noteId: id } });
    } catch (error) {
      handleError(error, 'deletar nota');
    }
  };

  // TodoList methods
  const addTodoList = async (todoList: Omit<TodoList, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('todo_lists')
        .insert([{
          user_id: user.id,
          title: todoList.title,
          items: JSON.stringify(todoList.items),
          project_id: todoList.projectId,
        }])
        .select()
        .single();

      if (error) throw error;
      
      const newTodoList: TodoList = {
        id: data.id,
        title: data.title,
        items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items || [],
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setTodoLists(prev => [...prev, newTodoList]);
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
          items: updates.items ? JSON.stringify(updates.items) : undefined,
          project_id: updates.projectId,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedTodoList: TodoList = {
        id: data.id,
        title: data.title,
        items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items || [],
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setTodoLists(prev => prev.map(tl => tl.id === id ? updatedTodoList : tl));
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
    } catch (error) {
      handleError(error, 'deletar lista de tarefas');
    }
  };

  // Account methods
  const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: account.name,
          balance: account.balance,
          type: account.type,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newAccount = transformDbAccount(data);
      setAccounts(prev => [...prev, newAccount]);
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
          balance: updates.balance,
          type: updates.type,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedAccount = transformDbAccount(data);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
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
      
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (error) {
      handleError(error, 'deletar conta');
    }
  };

  // Transaction methods
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: transaction.accountId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
          date: transaction.date.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTransaction = transformDbTransaction(data);
      setTransactions(prev => [...prev, newTransaction]);

      // Update account balance
      setAccounts(prev => prev.map(account => {
        if (account.id === transaction.accountId) {
          const balanceChange = transaction.type === 'deposit' ? transaction.amount : -transaction.amount;
          return { ...account, balance: account.balance + balanceChange, updatedAt: new Date() };
        }
        return account;
      }));

      await logActivity({
        action: 'transaction_added',
        entity: { type: 'transaction', id: newTransaction.id, label: newTransaction.description },
        meta: { amount: newTransaction.amount, type: newTransaction.type, accountId: newTransaction.accountId }
      });
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
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedTransaction = transformDbTransaction(data);
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
      
      await logActivity({
        action: 'transaction_deleted',
        entity: {
          type: 'transaction',
          id,
          label: `Transaction ${id}`
        }
      });
    } catch (error) {
      handleError(error, 'excluir transação');
      throw error;
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
      setLoadingStates(prev => ({
        ...prev,
        global: false
      }));
    }
  }, [user]);
  
  // Add activity to the log
  const logActivity = async (activity: Omit<Activity, 'id' | 'at' | 'actor'>) => {
    try {
      if (!user?.id) {
        console.warn('Cannot log activity: No authenticated user');
        return;
      }

      const now = new Date();
      const activityEntry: Activity = {
        id: `temp-${Date.now()}`,
        at: now,
        actor: user?.email || 'system',
        action: activity.action,
        ...(activity.entity && { entity: activity.entity }),
        ...(activity.meta && { meta: activity.meta })
      };

      // Add to local state optimistically
      setActivities(prev => [activityEntry, ...prev].slice(0, 100)); // Keep only last 100 activities
    } catch (error) {
      console.error('Error in logActivity:', error);
    }
  };
  
  // Clear all activities
  const clearActivities = async () => {
    setActivities([]);
    
    // Optionally clear from Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('activities')
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error clearing activities:', error);
        }
      } catch (error) {
        console.error('Error clearing activities:', error);
      }
    }
  };

  // Helper function to log unimplemented methods
  const notImplemented = (method: string) => {
    console.warn(`${method} not yet implemented in Supabase context - using placeholder`);
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
    addDebt: async (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('debts')
          .insert({
            name: debt.name,
            total_amount: debt.totalAmount,
            remaining_amount: debt.remainingAmount,
            due_date: debt.dueDate.toISOString(),
            user_id: user?.id
          })
          .select()
          .single();

        if (error) throw error;
        
        setDebts(prev => [...prev, {
          ...debt,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }]);
        
        toast({
          title: "Débito criado",
          description: `Débito "${debt.name}" foi criado com sucesso.`,
        });
      } catch (error) {
        console.error('Error adding debt:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o débito.",
          variant: "destructive",
        });
      }
    },
    addGoal: async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('goals')
          .insert({
            name: goal.name,
            target_amount: goal.targetAmount,
            current_amount: goal.currentAmount,
            target_date: goal.targetDate?.toISOString(),
            user_id: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        setGoals(prev => [...prev, {
          ...goal,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }]);
        
        toast({
          title: "Meta criada",
          description: `Meta "${goal.name}" foi criada com sucesso.`,
        });
      } catch (error) {
        console.error('Error adding goal:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar a meta.",
          variant: "destructive",
        });
        throw error;
      }
    },
    updateDebt: async (id: string, updates: Partial<Debt>) => {
      try {
        const { error } = await supabase
          .from('debts')
          .update({
            name: updates.name,
            total_amount: updates.totalAmount,
            remaining_amount: updates.remainingAmount,
            due_date: updates.dueDate?.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
        
        setDebts(prev => prev.map(debt => 
          debt.id === id ? { ...debt, ...updates, updatedAt: new Date() } : debt
        ));
        
        toast({
          title: "Débito atualizado",
          description: "Débito foi atualizado com sucesso.",
        });
      } catch (error) {
        console.error('Error updating debt:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o débito.",
          variant: "destructive",
        });
      }
    },
    updateGoal: async (id: string, updates: Partial<Goal>) => {
      try {
        const { error } = await supabase
          .from('goals')
          .update({
            name: updates.name,
            target_amount: updates.targetAmount,
            current_amount: updates.currentAmount,
            target_date: updates.targetDate?.toISOString() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
        
        setGoals(prev => prev.map(goal => 
          goal.id === id ? { ...goal, ...updates, updatedAt: new Date() } : goal
        ));
        
        toast({
          title: "Meta atualizada",
          description: "Meta foi atualizada com sucesso.",
        });
      } catch (error) {
        console.error('Error updating goal:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a meta.",
          variant: "destructive",
        });
      }
    },
    payDebt: async (debtId: string, accountId: string, amount: number) => {
      try {
        // Update debt remaining amount
        const debt = debts.find(d => d.id === debtId);
        if (!debt) throw new Error('Debt not found');
        
        const newRemainingAmount = Math.max(0, debt.remainingAmount - amount);
        
        const { error: debtError } = await supabase
          .from('debts')
          .update({
            remaining_amount: newRemainingAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', debtId);

        if (debtError) throw debtError;

        // Update account balance
        const account = accounts.find(a => a.id === accountId);
        if (!account) throw new Error('Account not found');
        
        const { error: accountError } = await supabase
          .from('accounts')
          .update({
            balance: account.balance - amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', accountId);

        if (accountError) throw accountError;

        // Update local state
        setDebts(prev => prev.map(d => 
          d.id === debtId ? { ...d, remainingAmount: newRemainingAmount, updatedAt: new Date() } : d
        ));
        
        setAccounts(prev => prev.map(a => 
          a.id === accountId ? { ...a, balance: a.balance - amount, updatedAt: new Date() } : a
        ));
        
        toast({
          title: "Pagamento realizado",
          description: `Pagamento de R$ ${amount.toFixed(2)} foi realizado com sucesso.`,
        });
      } catch (error) {
        console.error('Error paying debt:', error);
        toast({
          title: "Erro",
          description: "Não foi possível realizar o pagamento.",
          variant: "destructive",
        });
      }
    },
    allocateToGoal: async (goalId: string, accountId: string, amount: number) => {
      try {
        // Update goal current amount
        const goal = goals.find(g => g.id === goalId);
        if (!goal) throw new Error('Goal not found');
        
        const newCurrentAmount = goal.currentAmount + amount;
        
        const { error: goalError } = await supabase
          .from('goals')
          .update({
            current_amount: newCurrentAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', goalId);

        if (goalError) throw goalError;

        // Update account balance
        const account = accounts.find(a => a.id === accountId);
        if (!account) throw new Error('Account not found');
        
        const { error: accountError } = await supabase
          .from('accounts')
          .update({
            balance: account.balance - amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', accountId);

        if (accountError) throw accountError;

        // Update local state
        setGoals(prev => prev.map(g => 
          g.id === goalId ? { ...g, currentAmount: newCurrentAmount, updatedAt: new Date() } : g
        ));
        
        setAccounts(prev => prev.map(a => 
          a.id === accountId ? { ...a, balance: a.balance - amount, updatedAt: new Date() } : a
        ));
        
        toast({
          title: "Alocação realizada",
          description: `R$ ${amount.toFixed(2)} foi alocado para a meta "${goal.name}".`,
        });
      } catch (error) {
        console.error('Error allocating to goal:', error);
        toast({
          title: "Erro",
          description: "Não foi possível realizar a alocação.",
          variant: "destructive",
        });
      }
    },
    addReceivable: async (receivable: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'receivedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('receivables')
          .insert({
            name: receivable.name,
            amount: receivable.amount,
            due_date: receivable.dueDate.toISOString(),
            description: receivable.description,
            project_id: receivable.projectId,
            status: 'pending',
            user_id: user?.id
          })
          .select()
          .single();

        if (error) throw error;
        
        setReceivables(prev => [...prev, {
          ...receivable,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          status: 'pending',
          receivedAt: null
        }]);
        
        toast({
          title: "Recebível criado",
          description: `Recebível "${receivable.name}" foi criado com sucesso.`,
        });
      } catch (error) {
        console.error('Error adding receivable:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o recebível.",
          variant: "destructive",
        });
      }
    },
    updateReceivable: async (id: string, updates: Partial<Receivable>) => {
      try {
        const { error } = await supabase
          .from('receivables')
          .update({
            name: updates.name,
            amount: updates.amount,
            due_date: updates.dueDate?.toISOString(),
            description: updates.description,
            project_id: updates.projectId,
            status: updates.status,
            received_at: updates.receivedAt?.toISOString() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
        
        setReceivables(prev => prev.map(receivable => 
          receivable.id === id ? { ...receivable, ...updates, updatedAt: new Date() } : receivable
        ));
        
        toast({
          title: "Recebível atualizado",
          description: "Recebível foi atualizado com sucesso.",
        });
      } catch (error) {
        console.error('Error updating receivable:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o recebível.",
          variant: "destructive",
        });
      }
    },
    deleteReceivable: async (id: string) => {
      try {
        const { error } = await supabase
          .from('receivables')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        setReceivables(prev => prev.filter(receivable => receivable.id !== id));
        
        toast({
          title: "Recebível excluído",
          description: "Recebível foi excluído com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting receivable:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o recebível.",
          variant: "destructive",
        });
      }
    },
    receiveReceivable: async (receivableId: string, accountId: string) => {
      try {
        const receivable = receivables.find(r => r.id === receivableId);
        if (!receivable) throw new Error('Receivable not found');
        
        const { error: receivableError } = await supabase
          .from('receivables')
          .update({
            status: 'received',
            received_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', receivableId);

        if (receivableError) throw receivableError;

        // Update account balance
        const account = accounts.find(a => a.id === accountId);
        if (!account) throw new Error('Account not found');
        
        const { error: accountError } = await supabase
          .from('accounts')
          .update({
            balance: account.balance + receivable.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', accountId);

        if (accountError) throw accountError;

        // Update local state
        setReceivables(prev => prev.map(r => 
          r.id === receivableId ? { ...r, status: 'received', receivedAt: new Date(), updatedAt: new Date() } : r
        ));
        
        setAccounts(prev => prev.map(a => 
          a.id === accountId ? { ...a, balance: a.balance + receivable.amount, updatedAt: new Date() } : a
        ));
        
        toast({
          title: "Recebível recebido",
          description: `Recebível "${receivable.name}" foi recebido com sucesso.`,
        });
      } catch (error) {
        console.error('Error receiving receivable:', error);
        toast({
          title: "Erro",
          description: "Não foi possível receber o recebível.",
          variant: "destructive",
        });
      }
    },

    // Routines - placeholder implementations
    routines,
    routineCompletions,
    routineExceptions: [],
    routineBulkOperations: [],
    routineLoading,
    addRoutine: async (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'exceptions'>) => {
      if (!user) return;
      
      setRoutineLoading(true);
      
      try {
        // Create a temporary ID for optimistic update
        const tempId = `temp-${Date.now()}`;
        const now = new Date();
        
        // Create the routine object for optimistic update
        const optimisticRoutine: Routine = {
          id: tempId,
          name: routine.name,
          description: routine.description,
          color: routine.color,
          timesPerDay: routine.timesPerDay,
          specificTimes: routine.specificTimes,
          weekdays: routine.weekdays,
          durationDays: routine.durationDays,
          priority: routine.priority || 'medium',
          schedule: routine.schedule,
          activeFrom: routine.activeFrom,
          activeTo: routine.activeTo,
          pausedUntil: routine.pausedUntil,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          exceptions: {} as any
        };
        
        // Optimistic update - add to state immediately
        setRoutines(prev => [...prev, optimisticRoutine]);
        
        // Perform the actual database insert
        const { data, error } = await supabase
          .from('routines')
          .insert({
            user_id: user.id,
            name: routine.name,
            description: routine.description,
            color: routine.color,
            times_per_day: routine.timesPerDay,
            specific_times: routine.specificTimes || [],
            weekdays: routine.weekdays || [],
            duration_days: routine.durationDays || null,
            priority: routine.priority || 'medium',
            schedule: routine.schedule as any,
            active_from: routine.activeFrom,
            active_to: routine.activeTo || null,
            paused_until: routine.pausedUntil || null,
            exceptions: {} as any
          } as any)
          .select('id, created_at, updated_at')
          .single();

        if (error) {
          // Rollback optimistic update on error
          setRoutines(prev => prev.filter(r => r.id !== tempId));
          throw error;
        }
        
        // Update the routine with the real ID from database
        const finalRoutine: Routine = {
          ...optimisticRoutine,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        
        // Replace the temporary routine with the real one
        setRoutines(prev => prev.map(r => r.id === tempId ? finalRoutine : r));
        
        toast({
          title: "Rotina criada",
          description: `Rotina "${routine.name}" foi criada com sucesso.`,
        });
      } catch (error) {
        console.error('Error adding routine:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar a rotina.",
          variant: "destructive",
        });
      } finally {
        setRoutineLoading(false);
      }
    },
    updateRoutine: async (id: string, updates: Partial<Routine>) => {
      if (!user) return;
      
      try {
        const { error } = await supabase
          .from('routines')
          .update({
            name: updates.name,
            description: updates.description,
            color: updates.color,
            times_per_day: updates.timesPerDay,
            specific_times: updates.specificTimes,
            weekdays: updates.weekdays,
            duration_days: updates.durationDays,
            priority: updates.priority,
            schedule: updates.schedule as any,
            active_from: updates.activeFrom,
            active_to: updates.activeTo || null,
            paused_until: updates.pausedUntil || null,
            exceptions: updates.exceptions as any || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r));
        
        await logActivity({
          action: 'routine_updated',
          entity: { type: 'routine', id } as any,
          meta: { updates }
        });
        
        toast({
          title: "Rotina atualizada",
          description: "Rotina foi atualizada com sucesso.",
        });
      } catch (error) {
        console.error('Error updating routine:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a rotina.",
          variant: "destructive",
        });
      }
    },
    softDeleteRoutine: async (id: string) => {
      if (!user) return;
      
      try {
        const { error } = await supabase
          .from('routines')
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setRoutines(prev => prev.map(r => r.id === id ? { ...r, deletedAt: new Date().toISOString(), updatedAt: new Date() } : r));
        
        await logActivity({
          action: 'routine_deleted',
          entity: { type: 'routine', id } as any,
          meta: { mode: 'soft' }
        });
        
        toast({
          title: "Rotina excluída",
          description: "Rotina foi excluída com sucesso.",
        });
      } catch (error) {
        console.error('Error soft deleting routine:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a rotina.",
          variant: "destructive",
        });
      }
    },
    hardDeleteRoutine: async (id: string) => {
      if (!user) return;
      
      try {
        const { error } = await supabase
          .from('routines')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setRoutines(prev => prev.filter(r => r.id !== id));
        
        await logActivity({
          action: 'routine_deleted',
          entity: { type: 'routine', id } as any,
          meta: { mode: 'hard' }
        });
        
        toast({
          title: "Rotina removida",
          description: "Rotina foi removida permanentemente.",
        });
      } catch (error) {
        console.error('Error hard deleting routine:', error);
        toast({
          title: "Erro",
          description: "Não foi possível remover a rotina.",
          variant: "destructive",
        });
      }
    },
    completeRoutineOnce: async (routineId: string, date?: string, specificTime?: string): Promise<void> => {
      if (!user) return;
      
      const d = date || new Date().toISOString().split('T')[0]; // yyyy-MM-dd format
      
      // OPTIMISTIC UPDATE: Update local state immediately for better UX
      const currentCompletion = routineCompletions[d]?.[routineId];
      const currentCount = currentCompletion?.count || 0;
      
      // Create optimistic completion data
      const optimisticCompletion: RoutineCompletion = {
        id: currentCompletion?.id || `temp-${Date.now()}`,
        routineId: routineId,
        date: d,
        count: currentCount + 1,
        goal: currentCompletion?.goal || 1,
        skipped: false,
        paused: false,
        specificTime: specificTime || currentCompletion?.specificTime,
        completedAt: new Date(),
        createdAt: currentCompletion?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      // Update local state immediately (optimistic update)
      setRoutineCompletions(prev => {
        const dayMap = { ...(prev[d] || {}) };
        return { ...prev, [d]: { ...dayMap, [routineId]: optimisticCompletion } };
      });

      try {
        // Call the RPC function to complete the routine
        const { data: occurrences, error: rpcError } = await supabase
          .rpc('get_routine_occurrences', {
            p_routine_id: routineId,
            p_start_date: d,
            p_end_date: d // Using same date for start and end to get single day
          });

        if (rpcError) throw rpcError;
        
        // Check if we got any occurrences back
        if (!occurrences || occurrences.length === 0) {
          throw new Error('No routine occurrences found for the specified date');
        }
        
        // Get the updated completion count from the RPC result
        const updatedCount = occurrences[0]?.count || currentCount + 1;
        
        // Update with real data from database
        const finalCompletion: RoutineCompletion = {
          id: currentCompletion?.id || `db-${Date.now()}`,
          routineId: routineId,
          date: d,
          count: updatedCount,
          goal: optimisticCompletion.goal,
          skipped: false,
          paused: false,
          specificTime: specificTime || currentCompletion?.specificTime,
          completedAt: new Date(),
          createdAt: currentCompletion?.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        // Update local state with real data
        setRoutineCompletions(prev => {
          const dayMap = { ...(prev[d] || {}) };
          return { ...prev, [d]: { ...dayMap, [routineId]: finalCompletion } };
        });
        
        // Get routine name for toast
        const routine = routines.find(r => r.id === routineId);
        
        toast({
          title: "Rotina completada",
          description: `"${routine?.name || 'Rotina'}" foi marcada como completada.`,
        });
        
      } catch (error) {
        // Rollback optimistic update on error
        setRoutineCompletions(prev => {
          const dayMap = { ...(prev[d] || {}) };
          if (currentCompletion) {
            return { ...prev, [d]: { ...dayMap, [routineId]: currentCompletion } };
          } else {
            const newDayMap = { ...dayMap };
            delete newDayMap[routineId];
            return { ...prev, [d]: newDayMap };
          }
        });
        
        console.error('Error completing routine:', error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Não foi possível completar a rotina.",
          variant: "destructive",
        });
        throw error;
      }
    },
    skipRoutineDay: async (routineId: string, date: string) => {
      try {
        // Get the routine to check if it exists
        const routine = routines.find(r => r.id === routineId);
        if (!routine) {
          throw new Error('Routine not found');
        }
        
        // Update the routine's exceptions to mark this date as skipped
        const currentExceptions = routine.exceptions || {};
        const updatedExceptions = {
          ...currentExceptions,
          [date]: {
            ...currentExceptions[date],
            skip: true
          }
        };
        
        // Update the routine in the database
        const { error: updateError } = await supabase
          .from('routines')
          .update({
            exceptions: JSON.stringify(updatedExceptions),
            updated_at: new Date().toISOString()
          })
          .eq('id', routineId)
          .eq('user_id', user?.id);
        
        if (updateError) throw updateError;
        
        // Update local state
        setRoutines(prev => prev.map(r => 
          r.id === routineId 
            ? { ...r, exceptions: updatedExceptions, updatedAt: new Date() }
            : r
        ));
        
        toast({
          title: "Rotina pulada",
          description: `"${routine.name}" foi pulada para ${date}.`,
        });
        
      } catch (error) {
        console.error('Error skipping routine:', error);
        toast({
          title: "Erro",
          description: "Não foi possível pular a rotina.",
          variant: "destructive",
        });
        throw error;
      }
    },
    skipRoutineBetween: async (routineId: string, fromDate: string, toDate: string) => {
      try {
        // Get the routine to check if it exists
        const routine = routines.find(r => r.id === routineId);
        if (!routine) {
          throw new Error('Routine not found');
        }
        
        // Parse dates and generate date range
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const currentExceptions = routine.exceptions || {};
        const updatedExceptions = { ...currentExceptions };
        
        // Mark all dates in the range as skipped
        const current = new Date(from);
        while (current <= to) {
          const dateStr = current.toISOString().split('T')[0];
          updatedExceptions[dateStr] = {
            ...updatedExceptions[dateStr],
            skip: true
          };
          current.setDate(current.getDate() + 1);
        }
        
        // Update the routine in the database
        const { error: updateError } = await supabase
          .from('routines')
          .update({
            exceptions: JSON.stringify(updatedExceptions),
            updated_at: new Date().toISOString()
          })
          .eq('id', routineId)
          .eq('user_id', user?.id);
        
        if (updateError) throw updateError;
        
        // Update local state
        setRoutines(prev => prev.map(r => 
          r.id === routineId 
            ? { ...r, exceptions: updatedExceptions, updatedAt: new Date() }
            : r
        ));
        
        toast({
          title: "Rotina pulada",
          description: `"${routine.name}" foi pulada de ${fromDate} até ${toDate}.`,
        });
        
      } catch (error) {
        console.error('Error skipping routine between dates:', error);
        toast({
          title: "Erro",
          description: "Não foi possível pular a rotina no período selecionado.",
          variant: "destructive",
        });
        throw error;
      }
    },
    setRoutineException: async () => notImplemented('setRoutineException'),
    pauseRoutineUntil: async () => notImplemented('pauseRoutineUntil'),
    setRoutineActiveTo: async () => notImplemented('setRoutineActiveTo'),
    getRoutineProgress: async (routineId: string, date?: string) => {
      try {
        const d = date || new Date().toISOString().split('T')[0]; // yyyy-MM-dd format
        
        // Get the routine to check if it's paused or has exceptions
        const routine = routines.find(r => r.id === routineId);
        if (!routine) {
          return { count: 0, goal: 0, skipped: false, paused: false };
        }
        
        // Check if routine is paused on this date
        const paused = routine.pausedUntil && routine.pausedUntil >= d;
        
        // Check if routine is skipped on this date
        const skipped = routine.exceptions?.[d]?.skip || false;
        
        // Get the goal (times per day, or override from exceptions)
        const goal = routine.exceptions?.[d]?.overrideTimesPerDay || routine.timesPerDay;
        
        // Try to get completion count from local state first
        const localCompletions = routineCompletions[d]?.[routineId];
        if (localCompletions) {
          return { 
            count: localCompletions.count, 
            goal, 
            skipped, 
            paused 
          };
        }
        
        // If not in local state, try to get from database
        try {
          const { data: completionData, error } = await supabase
            .from('routine_completions')
            .select('*')
            .eq('routine_id', routineId)
            .eq('user_id', user?.id)
            .eq('date', d)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching routine completion:', error);
            return { count: 0, goal, skipped, paused };
          }
          
          const count = completionData?.count || 0;
          
          // Update local state with the fetched data
          if (completionData) {
            setRoutineCompletions(prev => {
              const dayMap = { ...(prev[d] || {}) };
              const completion: RoutineCompletion = {
                id: completionData.id || `temp-${Date.now()}`,
                routineId: routineId,
                date: d,
                count: completionData.count,
                goal: completionData.goal || goal,
                skipped: completionData.skipped || skipped,
                paused: completionData.paused || paused,
                specificTime: completionData.specific_time || undefined,
                completedAt: completionData.completed_at ? new Date(completionData.completed_at) : new Date(),
                createdAt: completionData.created_at ? new Date(completionData.created_at) : new Date(),
                updatedAt: completionData.updated_at ? new Date(completionData.updated_at) : new Date()
              };
              
              return { ...prev, [d]: { ...dayMap, [routineId]: completion } };
            });
          }
          
          return { count, goal, skipped, paused };
        } catch (dbError) {
          console.error('Database error in getRoutineProgress:', dbError);
          return { count: 0, goal, skipped, paused };
        }
      } catch (error) {
        console.error('Error getting routine progress:', error);
        return { count: 0, goal: 1, skipped: false, paused: false };
      }
    },
    getRoutineOccurrences: async (routineId: string, startDate: string, endDate: string) => {
      try {
        const { data, error } = await supabase
          .rpc('get_routine_occurrences', {
            p_routine_id: routineId,
            p_start_date: startDate,
            p_end_date: endDate
          });

        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('Error getting routine occurrences:', error);
        return [];
      }
    },
    bulkDeleteRoutineOccurrences: async (routineId: string, dates: string[]) => {
      try {
        // Create bulk operation record
        const { data: bulkOp, error: bulkError } = await supabase
          .from('routine_bulk_operations')
          .insert({
            user_id: user?.id,
            routine_id: routineId,
            operation_type: 'delete_occurrences',
            start_date: dates[0],
            end_date: dates[dates.length - 1],
            affected_dates: dates
          })
          .select()
          .single();

        if (bulkError) throw bulkError;

        // Delete routine completions for these dates
        const { error: deleteError } = await supabase
          .from('routine_completions')
          .delete()
          .eq('routine_id', routineId)
          .in('date', dates);

        if (deleteError) throw deleteError;

        // Update local state
        setRoutineCompletions(prev => {
          const newState = { ...prev };
          dates.forEach(date => {
            if (newState[routineId] && newState[routineId][date]) {
              delete newState[routineId][date];
            }
          });
          return newState;
        });

        toast({
          title: "Ocorrências excluídas",
          description: `${dates.length} ocorrências da rotina foram excluídas.`,
        });
      } catch (error) {
        console.error('Error bulk deleting routine occurrences:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir as ocorrências.",
          variant: "destructive",
        });
      }
    },
    bulkSkipRoutinePeriod: async (routineId: string, startDate: string, endDate: string) => {
      try {
        // Get all dates in the range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates: string[] = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }

        // Create bulk operation record
        const { data: bulkOp, error: bulkError } = await supabase
          .from('routine_bulk_operations')
          .insert({
            user_id: user?.id,
            routine_id: routineId,
            operation_type: 'skip_period',
            start_date: startDate,
            end_date: endDate,
            affected_dates: dates
          })
          .select()
          .single();

        if (bulkError) throw bulkError;

        // Create exceptions for each date
        const exceptions = dates.map(date => ({
          user_id: user?.id,
          routine_id: routineId,
          date,
          action: 'skip',
          value: null
        }));

        const { error: exceptionsError } = await supabase
          .from('routine_exceptions')
          .insert(exceptions);

        if (exceptionsError) throw exceptionsError;

        // Update local state
        setRoutineExceptions(prev => [...prev, ...exceptions.map(ex => ({
          id: ex.routine_id + '-' + ex.date,
          routineId: ex.routine_id,
          date: ex.date,
          action: ex.action as any,
          value: ex.value,
          createdAt: new Date(),
          updatedAt: new Date()
        }))]);

        toast({
          title: "Período pulado",
          description: `Rotina pausada de ${startDate} até ${endDate}.`,
        });
      } catch (error) {
        console.error('Error bulk skipping routine period:', error);
        toast({
          title: "Erro",
          description: "Não foi possível pausar o período.",
          variant: "destructive",
        });
      }
    },

    // Network - placeholder implementations
    contacts,
    contactGroups,
    addContact: async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            user_id: user?.id,
            name: contact.name,
            avatar_url: contact.avatarUrl,
            email: contact.email,
            phone: contact.phone,
            linkedin: contact.linkedin,
            whatsapp: contact.whatsapp,
            skills: JSON.stringify(contact.skills),
            notes: contact.notes,
            project_ids: JSON.stringify(contact.projectIds),
            group_ids: JSON.stringify(contact.groupIds),
            attachments: JSON.stringify(contact.attachments),
          })
          .select()
          .single();

        if (error) throw error;
        
        setContacts(prev => [...prev, {
          ...contact,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }]);
        
        toast({
          title: "Contato criado",
          description: `Contato "${contact.name}" foi criado com sucesso.`,
        });
      } catch (error) {
        console.error('Error adding contact:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o contato.",
          variant: "destructive",
        });
      }
    },
    updateContact: async (id: string, updates: Partial<Contact>) => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .update({
            name: updates.name,
            avatar_url: updates.avatarUrl,
            email: updates.email,
            phone: updates.phone,
            linkedin: updates.linkedin,
            whatsapp: updates.whatsapp,
            skills: JSON.stringify(updates.skills),
            notes: updates.notes,
            project_ids: JSON.stringify(updates.projectIds),
            group_ids: JSON.stringify(updates.groupIds),
            attachments: JSON.stringify(updates.attachments),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user?.id)
          .select()
          .single();

        if (error) throw error;
        
        setContacts(prev => prev.map(contact => 
          contact.id === id ? { ...contact, ...updates, updatedAt: new Date() } : contact
        ));
        
        toast({
          title: "Contato atualizado",
          description: "Contato foi atualizado com sucesso.",
        });
      } catch (error) {
        console.error('Error updating contact:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o contato.",
          variant: "destructive",
        });
      }
    },
    deleteContact: async (id: string) => {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', id)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setContacts(prev => prev.filter(contact => contact.id !== id));
        
        toast({
          title: "Contato excluído",
          description: "Contato foi excluído com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting contact:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o contato.",
          variant: "destructive",
        });
      }
    },
    addContactGroup: async (group: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('contact_groups')
          .insert({
            user_id: user?.id,
            name: group.name,
            description: group.description,
            member_ids: JSON.stringify(group.memberIds),
          })
          .select()
          .single();

        if (error) throw error;
        
        setContactGroups(prev => [...prev, {
          ...group,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }]);
        
        toast({
          title: "Grupo de contatos criado",
          description: `Grupo "${group.name}" foi criado com sucesso.`,
        });
      } catch (error) {
        console.error('Error adding contact group:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o grupo de contatos.",
          variant: "destructive",
        });
      }
    },
    updateContactGroup: async (id: string, updates: Partial<ContactGroup>) => {
      try {
        const { data, error } = await supabase
          .from('contact_groups')
          .update({
            name: updates.name,
            description: updates.description,
            member_ids: JSON.stringify(updates.memberIds),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user?.id)
          .select()
          .single();

        if (error) throw error;
        
        setContactGroups(prev => prev.map(group => 
          group.id === id ? { ...group, ...updates, updatedAt: new Date() } : group
        ));
        
        toast({
          title: "Grupo de contatos atualizado",
          description: "Grupo de contatos foi atualizado com sucesso.",
        });
      } catch (error) {
        console.error('Error updating contact group:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o grupo de contatos.",
          variant: "destructive",
        });
      }
    },
    deleteContactGroup: async (id: string) => {
      try {
        const { error } = await supabase
          .from('contact_groups')
          .delete()
          .eq('id', id)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setContactGroups(prev => prev.filter(group => group.id !== id));
        
        toast({
          title: "Grupo de contatos excluído",
          description: "Grupo de contatos foi excluído com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting contact group:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o grupo de contatos.",
          variant: "destructive",
        });
      }
    },

    // Project media and wallet - placeholder implementations
    projectImages,
    addProjectImage: async () => notImplemented('addProjectImage'),
    deleteProjectImage: async () => notImplemented('deleteProjectImage'),
    projectWalletEntries,
    addProjectWalletEntry: async () => notImplemented('addProjectWalletEntry'),
    deleteProjectWalletEntry: async () => notImplemented('deleteProjectWalletEntry'),

    // Clockify - placeholder implementations
    clockifyTimeEntries,
    addClockifyTimeEntry: async (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('clockify_time_entries')
          .insert({
            user_id: user?.id,
            description: entry.description,
            project_id: entry.projectId,
            person_ids: JSON.stringify(entry.personIds),
            start_time: entry.startTime.toISOString(),
            end_time: entry.endTime?.toISOString(),
            duration: entry.duration,
            billable: entry.billable,
            hourly_rate: entry.hourlyRate,
            tags: JSON.stringify(entry.tags),
            status: entry.status,
          })
          .select()
          .single();

        if (error) throw error;
        
        const newEntry: ClockifyTimeEntry = {
          ...entry,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        
        setClockifyTimeEntries(prev => [...prev, newEntry]);
        
        toast({
          title: "Entrada de tempo criada",
          description: "Entrada de tempo foi criada com sucesso.",
        });
        
        return data.id;
      } catch (error) {
        console.error('Error adding clockify time entry:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar a entrada de tempo.",
          variant: "destructive",
        });
        return '';
      }
    },
    updateClockifyTimeEntry: async (id: string, updates: Partial<ClockifyTimeEntry>) => {
      try {
        const updateData: any = {};
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
        if (updates.personIds !== undefined) updateData.person_ids = JSON.stringify(updates.personIds);
        if (updates.startTime !== undefined) updateData.start_time = updates.startTime.toISOString();
        if (updates.endTime !== undefined) updateData.end_time = updates.endTime?.toISOString();
        if (updates.duration !== undefined) updateData.duration = updates.duration;
        if (updates.billable !== undefined) updateData.billable = updates.billable;
        if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate;
        if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);
        if (updates.status !== undefined) updateData.status = updates.status;
        
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('clockify_time_entries')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setClockifyTimeEntries(prev => prev.map(entry => 
          entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
        ));
        
        toast({
          title: "Entrada de tempo atualizada",
          description: "Entrada de tempo foi atualizada com sucesso.",
        });
      } catch (error) {
        console.error('Error updating clockify time entry:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a entrada de tempo.",
          variant: "destructive",
        });
      }
    },
    deleteClockifyTimeEntry: async (id: string) => {
      try {
        const { error } = await supabase
          .from('clockify_time_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setClockifyTimeEntries(prev => prev.filter(entry => entry.id !== id));
        
        toast({
          title: "Entrada de tempo excluída",
          description: "Entrada de tempo foi excluída com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting clockify time entry:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a entrada de tempo.",
          variant: "destructive",
        });
      }
    },
    startClockifyTimer: async (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('clockify_time_entries')
          .insert({
            user_id: user?.id,
            description: entry.description,
            project_id: entry.projectId,
            person_ids: JSON.stringify(entry.personIds),
            start_time: new Date().toISOString(),
            end_time: null,
            duration: 0,
            billable: entry.billable,
            hourly_rate: entry.hourlyRate,
            tags: JSON.stringify(entry.tags),
            status: 'active',
          })
          .select()
          .single();

        if (error) throw error;
        
        const newEntry: ClockifyTimeEntry = {
          ...entry,
          id: data.id,
          startTime: new Date(),
          endTime: undefined,
          duration: 0,
          status: 'active',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        
        setClockifyTimeEntries(prev => [...prev, newEntry]);
        
        toast({
          title: "Timer iniciado",
          description: "Timer foi iniciado com sucesso.",
        });
        
        return data.id;
      } catch (error) {
        console.error('Error starting clockify timer:', error);
        toast({
          title: "Erro",
          description: "Não foi possível iniciar o timer.",
          variant: "destructive",
        });
        return '';
      }
    },
    stopClockifyTimer: async (entryId: string) => {
      try {
        const entry = clockifyTimeEntries.find(e => e.id === entryId);
        if (!entry) throw new Error('Entry not found');
        
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);
        
        const { error } = await supabase
          .from('clockify_time_entries')
          .update({
            end_time: endTime.toISOString(),
            duration: duration,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setClockifyTimeEntries(prev => prev.map(e => 
          e.id === entryId ? { ...e, endTime, duration, status: 'completed', updatedAt: new Date() } : e
        ));
        
        toast({
          title: "Timer parado",
          description: "Timer foi parado com sucesso.",
        });
      } catch (error) {
        console.error('Error stopping clockify timer:', error);
        toast({
          title: "Erro",
          description: "Não foi possível parar o timer.",
          variant: "destructive",
        });
      }
    },
    pauseClockifyTimer: async (entryId: string) => {
      try {
        const entry = clockifyTimeEntries.find(e => e.id === entryId);
        if (!entry) throw new Error('Entry not found');
        
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);
        
        const { error } = await supabase
          .from('clockify_time_entries')
          .update({
            end_time: endTime.toISOString(),
            duration: duration,
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setClockifyTimeEntries(prev => prev.map(e => 
          e.id === entryId ? { ...e, endTime, duration, status: 'paused', updatedAt: new Date() } : e
        ));
        
        toast({
          title: "Timer pausado",
          description: "Timer foi pausado com sucesso.",
        });
      } catch (error) {
        console.error('Error pausing clockify timer:', error);
        toast({
          title: "Erro",
          description: "Não foi possível pausar o timer.",
          variant: "destructive",
        });
      }
    },
    resumeClockifyTimer: async (entryId: string) => {
      try {
        const entry = clockifyTimeEntries.find(e => e.id === entryId);
        if (!entry) throw new Error('Entry not found');
        
        const startTime = new Date();
        const previousDuration = entry.duration || 0;
        
        const { error } = await supabase
          .from('clockify_time_entries')
          .update({
            start_time: startTime.toISOString(),
            end_time: null,
            duration: previousDuration,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setClockifyTimeEntries(prev => prev.map(e => 
          e.id === entryId ? { ...e, startTime, endTime: undefined, status: 'active', updatedAt: new Date() } : e
        ));
        
        toast({
          title: "Timer retomado",
          description: "Timer foi retomado com sucesso.",
        });
      } catch (error) {
        console.error('Error resuming clockify timer:', error);
        toast({
          title: "Erro",
          description: "Não foi possível retomar o timer.",
          variant: "destructive",
        });
      }
    },

    // Plaky - placeholder implementations
    plakyBoards: [],
    plakyItems: [],
    addPlakyBoard: async () => { notImplemented('addPlakyBoard'); },
    updatePlakyBoard: async () => { notImplemented('updatePlakyBoard'); },
    deletePlakyBoard: async () => { notImplemented('deletePlakyBoard'); },
    addPlakyItem: async () => { notImplemented('addPlakyItem'); },
    updatePlakyItem: async () => { notImplemented('updatePlakyItem'); },
    deletePlakyItem: async () => { notImplemented('deletePlakyItem'); },

    // Pomodoro - placeholder implementations
    pomodoroSessions: [],
    pomodoroSettings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: true,
      autoStartWork: true,
      soundEnabled: true,
    },
    addPomodoroSession: async () => { notImplemented('addPomodoroSession'); },
    updatePomodoroSession: async () => { notImplemented('updatePomodoroSession'); },
    deletePomodoroSession: async () => { notImplemented('deletePomodoroSession'); },
    updatePomodoroSettings: async () => { notImplemented('updatePomodoroSettings'); },
    startPomodoro: async () => { notImplemented('startPomodoro'); return ''; },
    pausePomodoro: async () => { notImplemented('pausePomodoro'); },
    resumePomodoro: async () => { notImplemented('resumePomodoro'); },
    stopPomodoro: async () => { notImplemented('stopPomodoro'); },

    // AI / Assistant - placeholder implementations
    aiSettings: {
      enabled: true,
      deepAnalysis: false,
      model: 'gpt-4',
      maxContextItems: 10,
    },
    updateAISettings: async () => { notImplemented('updateAISettings'); },

    // User Settings
    actorName: actorName || 'User',
    updateActorName,
    
    // Add missing methods
    updateAccount: async (id: string, updates: Partial<Account>) => {
      // Implementation for updateAccount
      notImplemented('updateAccount');
    },
    deleteAccount: async (id: string) => {
      // Implementation for deleteAccount
      notImplemented('deleteAccount');
    },

    // Activity Tracking
    activities,
    logActivity,
    clearActivities,

    // Loading and refresh
    loading: loadingStates.global,
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
