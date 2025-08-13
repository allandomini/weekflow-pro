import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, Task, Note, TodoList, Account, Transaction, 
  Debt, Goal, Contact, ContactGroup, Receivable, 
  ProjectImage, ProjectWalletEntry, ClockifyTimeEntry, 
  PlakyBoard, PlakyColumn, PlakyItem, PomodoroSession, PomodoroSettings, AISettings,
  Activity, Routine, RoutineCompletion
} from '@/types';

// Activity type moved to src/types

interface AppContextType {
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // TodoLists
  todoLists: TodoList[];
  addTodoList: (todoList: Omit<TodoList, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodoList: (id: string, updates: Partial<TodoList>) => void;
  deleteTodoList: (id: string) => void;

  // Financial
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  receivables: Receivable[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  payDebt: (debtId: string, accountId: string, amount: number) => void;
  allocateToGoal: (goalId: string, accountId: string, amount: number) => void;
  addReceivable: (receivable: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'receivedAt'>) => void;
  updateReceivable: (id: string, updates: Partial<Receivable>) => void;
  deleteReceivable: (id: string) => void;
  receiveReceivable: (receivableId: string, accountId: string) => void;

  // Routines
  routines: Routine[];
  routineCompletions: Record<string, Record<string, RoutineCompletion>>; // date -> routineId -> completion
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'exceptions'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  softDeleteRoutine: (id: string) => void;
  hardDeleteRoutine: (id: string) => void;
  completeRoutineOnce: (routineId: string, date?: string) => void;
  skipRoutineDay: (routineId: string, date?: string) => void;
  skipRoutineBetween: (routineId: string, startDate: string, endDate: string) => void;
  setRoutineException: (routineId: string, date: string, ex: { skip?: boolean; overrideTimesPerDay?: number }) => void;
  pauseRoutineUntil: (routineId: string, untilDate: string) => void;
  setRoutineActiveTo: (routineId: string, endDate: string) => void;
  getRoutineProgress: (routineId: string, date?: string) => { count: number; goal: number; skipped: boolean; paused: boolean };

  // Network
  contacts: Contact[];
  contactGroups: ContactGroup[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addContactGroup: (group: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContactGroup: (id: string, updates: Partial<ContactGroup>) => void;
  deleteContactGroup: (id: string) => void;

  // Project media and wallet
  projectImages: ProjectImage[];
  addProjectImage: (image: Omit<ProjectImage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteProjectImage: (id: string) => void;
  projectWalletEntries: ProjectWalletEntry[];
  addProjectWalletEntry: (entry: Omit<ProjectWalletEntry, 'id' | 'createdAt'>) => void;
  deleteProjectWalletEntry: (id: string) => void;

  // Clockify - Integrado com projetos e pessoas existentes
  clockifyTimeEntries: ClockifyTimeEntry[];
  addClockifyTimeEntry: (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateClockifyTimeEntry: (id: string, updates: Partial<ClockifyTimeEntry>) => void;
  deleteClockifyTimeEntry: (id: string) => void;
  startClockifyTimer: (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  stopClockifyTimer: (entryId: string) => void;
  pauseClockifyTimer: (entryId: string) => void;
  resumeClockifyTimer: (entryId: string) => void;

  // Plaky - Integrado com projetos e tarefas existentes
  plakyBoards: PlakyBoard[];
  plakyItems: PlakyItem[];
  addPlakyBoard: (board: Omit<PlakyBoard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlakyBoard: (id: string, updates: Partial<PlakyBoard>) => void;
  deletePlakyBoard: (id: string) => void;
  addPlakyItem: (item: Omit<PlakyItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlakyItem: (id: string, updates: Partial<PlakyItem>) => void;
  deletePlakyItem: (id: string) => void;

  // Pomodoro
  pomodoroSessions: PomodoroSession[];
  pomodoroSettings: PomodoroSettings;
  addPomodoroSession: (session: Omit<PomodoroSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePomodoroSession: (id: string, updates: Partial<PomodoroSession>) => void;
  deletePomodoroSession: (id: string) => void;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  startPomodoro: (projectId?: string, taskId?: string) => string;
  pausePomodoro: (sessionId: string) => void;
  resumePomodoro: (sessionId: string) => void;
  stopPomodoro: (sessionId: string) => void;

  // AI / Assistant
  aiSettings: AISettings;
  updateAISettings: (settings: Partial<AISettings>) => void;

  // Activity log
  activities: Activity[];
  logActivity: (activity: Omit<Activity, 'id' | 'at' | 'actor'>) => void;
  actorName: string;
  updateActorName: (name: string) => void;
  clearActivities: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineCompletions, setRoutineCompletions] = useState<Record<string, Record<string, RoutineCompletion>>>({});
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actorName, setActorName] = useState<string>(() => localStorage.getItem('actorName') || 'Você');
  const [aiSettings, setAISettings] = useState<AISettings>({
    enabled: true,
    deepAnalysis: true,
    model: 'gemini-1.5-pro',
    maxContextItems: 100,
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('weekflow_projects');
    const savedTasks = localStorage.getItem('tasks');
    const savedNotes = localStorage.getItem('notes');
    const savedTodoLists = localStorage.getItem('todoLists');
    const savedAccounts = localStorage.getItem('accounts');
    const savedTransactions = localStorage.getItem('transactions');
    const savedDebts = localStorage.getItem('debts');
    const savedGoals = localStorage.getItem('goals');
    const savedReceivables = localStorage.getItem('weekflow_receivables');
    const savedContacts = localStorage.getItem('contacts');
    const savedContactGroups = localStorage.getItem('contactGroups');
    const savedProjectImages = localStorage.getItem('projectImages');
    const savedProjectWalletEntries = localStorage.getItem('projectWalletEntries');
    const savedClockifyTimeEntries = localStorage.getItem('clockifyTimeEntries');
    const savedPlakyBoards = localStorage.getItem('plakyBoards');
    const savedPlakyItems = localStorage.getItem('plakyItems');
    const savedPomodoroSessions = localStorage.getItem('pomodoroSessions');
    const savedPomodoroSettings = localStorage.getItem('pomodoroSettings');
    const savedAISettings = localStorage.getItem('aiSettings');
    const savedActivities = localStorage.getItem('activities');
    const savedActorName = localStorage.getItem('actorName');
    const savedRoutines = localStorage.getItem('weekflow_routines');
    const savedRoutineCompletions = localStorage.getItem('weekflow_routine_completions');

    if (savedProjects) setProjects(JSON.parse(savedProjects, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedTasks) setTasks(JSON.parse(savedTasks, (key, value) => {
      if (key === 'date' || key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedNotes) setNotes(JSON.parse(savedNotes, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedTodoLists) setTodoLists(JSON.parse(savedTodoLists, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedAccounts) setAccounts(JSON.parse(savedAccounts, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions, (key, value) => {
      if (key === 'date' || key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedActivities) setActivities(JSON.parse(savedActivities, (key, value) => {
      if (key === 'at') return new Date(value);
      return value;
    }));
    if (savedActorName) setActorName(savedActorName);
    if (savedDebts) setDebts(JSON.parse(savedDebts, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedGoals) setGoals(JSON.parse(savedGoals, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedReceivables) setReceivables(JSON.parse(savedReceivables, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedContacts) setContacts(JSON.parse(savedContacts, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedContactGroups) setContactGroups(JSON.parse(savedContactGroups, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedProjectImages) setProjectImages(JSON.parse(savedProjectImages, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedProjectWalletEntries) setProjectWalletEntries(JSON.parse(savedProjectWalletEntries, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedClockifyTimeEntries) setClockifyTimeEntries(JSON.parse(savedClockifyTimeEntries, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedPlakyBoards) setPlakyBoards(JSON.parse(savedPlakyBoards, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedPlakyItems) setPlakyItems(JSON.parse(savedPlakyItems, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedPomodoroSessions) setPomodoroSessions(JSON.parse(savedPomodoroSessions, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedPomodoroSettings) setPomodoroSettings(JSON.parse(savedPomodoroSettings));
    if (savedAISettings) setAISettings(JSON.parse(savedAISettings));
    if (savedRoutines) setRoutines(JSON.parse(savedRoutines, (key, value) => {
      if (key === 'createdAt' || key === 'updatedAt') return new Date(value);
      return value;
    }));
    if (savedRoutineCompletions) setRoutineCompletions(JSON.parse(savedRoutineCompletions));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('weekflow_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('todoLists', JSON.stringify(todoLists));
  }, [todoLists]);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('weekflow_receivables', JSON.stringify(receivables));
  }, [receivables]);

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('contactGroups', JSON.stringify(contactGroups));
  }, [contactGroups]);
  
  useEffect(() => {
    localStorage.setItem('projectImages', JSON.stringify(projectImages));
  }, [projectImages]);
  
  useEffect(() => {
    localStorage.setItem('projectWalletEntries', JSON.stringify(projectWalletEntries));
  }, [projectWalletEntries]);

  useEffect(() => {
    localStorage.setItem('clockifyTimeEntries', JSON.stringify(clockifyTimeEntries));
  }, [clockifyTimeEntries]);

  useEffect(() => {
    localStorage.setItem('plakyBoards', JSON.stringify(plakyBoards));
  }, [plakyBoards]);

  useEffect(() => {
    localStorage.setItem('plakyItems', JSON.stringify(plakyItems));
  }, [plakyItems]);

  useEffect(() => {
    localStorage.setItem('pomodoroSessions', JSON.stringify(pomodoroSessions));
  }, [pomodoroSessions]);

  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
  }, [pomodoroSettings]);

  // Persist AI settings
  useEffect(() => {
    localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // Persist Activities (activity log)
  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

  // Persist actor name
  useEffect(() => {
    localStorage.setItem('actorName', actorName);
  }, [actorName]);

  // Persist routines
  useEffect(() => {
    localStorage.setItem('weekflow_routines', JSON.stringify(routines));
  }, [routines]);
  useEffect(() => {
    localStorage.setItem('weekflow_routine_completions', JSON.stringify(routineCompletions));
  }, [routineCompletions]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);
 
  // --------- Routine helpers (AppProvider scope) ---------
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isPausedOn = (routine: Routine, dateStr: string) => {
    if (!routine.pausedUntil) return false;
    return routine.pausedUntil >= dateStr; // compare yyyy-MM-dd strings
  };

  const effectiveGoal = (routine: Routine, dateStr: string) => {
    const ex = routine.exceptions?.[dateStr];
    return ex?.overrideTimesPerDay ?? routine.timesPerDay;
  };

  const addRoutine = (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'exceptions'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: generateId(),
      deletedAt: null,
      exceptions: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRoutines(prev => [...prev, newRoutine]);
    logActivity({ action: 'routine_added', entity: { type: 'routine', id: newRoutine.id, label: newRoutine.name } });
  };

  const updateRoutine = (id: string, updates: Partial<Routine>) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r));
    logActivity({ action: 'routine_updated', entity: { type: 'routine', id }, meta: { updates } });
  };

  const softDeleteRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, deletedAt: formatDate(new Date()), updatedAt: new Date() } : r));
    logActivity({ action: 'routine_deleted', entity: { type: 'routine', id }, meta: { mode: 'soft' } });
  };

  const hardDeleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    setRoutineCompletions(prev => {
      const next: typeof prev = {};
      for (const date of Object.keys(prev)) {
        const map = { ...prev[date] };
        delete map[id];
        if (Object.keys(map).length) next[date] = map;
      }
      return next;
    });
    logActivity({ action: 'routine_deleted', entity: { type: 'routine', id }, meta: { mode: 'hard' } });
  };

  const setRoutineException = (routineId: string, date: string, ex: { skip?: boolean; overrideTimesPerDay?: number }) => {
    setRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      const exceptions = { ...(r.exceptions || {}) };
      exceptions[date] = { ...(exceptions[date] || {}), ...ex };
      return { ...r, exceptions, updatedAt: new Date() };
    }));
  };

  const skipRoutineDay = (routineId: string, date?: string) => {
    const d = date || formatDate(new Date());
    setRoutineException(routineId, d, { skip: true });
    logActivity({ action: 'routine_skipped', entity: { type: 'routine', id: routineId }, meta: { date: d } });
  };

  const skipRoutineBetween = (routineId: string, startDate: string, endDate: string) => {
    // Iterate inclusive from startDate to endDate (both yyyy-MM-dd)
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    const forward = start.getTime() <= end.getTime();
    const from = forward ? start : end;
    const to = forward ? end : start;
    const dates: string[] = [];
    const cur = new Date(from);
    while (cur.getTime() <= to.getTime()) {
      dates.push(formatDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    setRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      const exceptions = { ...(r.exceptions || {}) } as NonNullable<Routine['exceptions']>;
      for (const d of dates) {
        exceptions[d] = { ...(exceptions[d] || {}), skip: true };
      }
      return { ...r, exceptions, updatedAt: new Date() };
    }));
    logActivity({ action: 'routine_skipped', entity: { type: 'routine', id: routineId }, meta: { startDate, endDate, mode: 'range' } });
  };

  const pauseRoutineUntil = (routineId: string, untilDate: string) => {
    updateRoutine(routineId, { pausedUntil: untilDate });
    logActivity({ action: 'routine_paused', entity: { type: 'routine', id: routineId }, meta: { untilDate } });
  };

  const setRoutineActiveTo = (routineId: string, endDate: string) => {
    updateRoutine(routineId, { activeTo: endDate });
  };

  const getRoutineProgress = (routineId: string, date?: string) => {
    const d = date || formatDate(new Date());
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return { count: 0, goal: 0, skipped: false, paused: false };
    const skipped = !!routine.exceptions?.[d]?.skip;
    const paused = isPausedOn(routine, d);
    const goal = effectiveGoal(routine, d);
    const count = routineCompletions[d]?.[routineId]?.count || 0;
    return { count, goal, skipped, paused };
  };

  const completeRoutineOnce = (routineId: string, date?: string) => {
    const d = date || formatDate(new Date());
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    if (isPausedOn(routine, d)) return;
    if (routine.exceptions?.[d]?.skip) return;
    const goal = effectiveGoal(routine, d);

    setRoutineCompletions(prev => {
      const dayMap = { ...(prev[d] || {}) };
      const existing = dayMap[routineId] || { routineId, date: d, count: 0, timestamps: [] as string[] };
      if (existing.count >= goal) return prev; // already complete
      const next: RoutineCompletion = {
        ...existing,
        count: existing.count + 1,
        timestamps: [...(existing.timestamps || []), new Date().toISOString()]
      };
      return { ...prev, [d]: { ...dayMap, [routineId]: next } };
    });
    logActivity({ action: 'routine_completed', entity: { type: 'routine', id: routineId }, meta: { date: d } });
  };

  // Project methods
  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...project,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => [...prev, newProject]);
    logActivity({ action: 'project_added', entity: { type: 'project', id: newProject.id, label: newProject.name } });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
    ));
    logActivity({ action: 'project_updated', entity: { type: 'project', id, label: updates.name } });
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    // Also delete related tasks and notes
    setTasks(prev => prev.filter(task => task.projectId !== id));
    setNotes(prev => prev.filter(note => note.projectId !== id));
    setTodoLists(prev => prev.filter(list => list.projectId !== id));
    setProjectImages(prev => prev.filter(img => img.projectId !== id));
    setProjectWalletEntries(prev => prev.filter(e => e.projectId !== id));
    logActivity({ action: 'project_deleted', entity: { type: 'project', id } });
  };

  // Check for overdue tasks and move them to today
  useEffect(() => {
    const checkOverdueTasks = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      setTasks(prev => prev.map(task => {
        if (!task.completed && !task.isRoutine) {
          const taskDate = new Date(task.date);
          taskDate.setHours(0, 0, 0, 0);
          
          if (taskDate < today) {
            // Move task to today and mark as overdue
            return {
              ...task,
              date: new Date(),
              isOverdue: true,
              updatedAt: new Date()
            };
          }
        }
        return task;
      }));
    };

    // Check on component mount
    checkOverdueTasks();
    
    // Check daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeoutId = setTimeout(() => {
      checkOverdueTasks();
      // Set up daily interval
      const intervalId = setInterval(checkOverdueTasks, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, timeUntilMidnight);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Task methods
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      isOverdue: false,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);

    // log
    logActivity({
      action: 'task_created',
      entity: { type: 'task', id: newTask.id, label: newTask.title },
      meta: { date: newTask.date }
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const existing = prev.find(t => t.id === id);
      const next = prev.map(task => 
        task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
      );
      // log completion toggle
      if (existing && typeof updates.completed === 'boolean' && updates.completed !== existing.completed) {
        logActivity({
          action: updates.completed ? 'task_completed' : 'task_uncompleted',
          entity: { type: 'task', id: existing.id, label: existing.title },
          meta: { date: existing.date }
        });
      }
      return next;
    });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    // log
    logActivity({ action: 'task_deleted', entity: { type: 'task', id } });
  };

  // Note methods
  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes(prev => [...prev, newNote]);
    logActivity({ action: 'note_added', entity: { type: 'project', id: newNote.projectId || '', label: newNote.title }, meta: { noteId: newNote.id } });
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note));
    logActivity({ action: 'note_updated', entity: { type: 'project', id: updates.projectId || '', label: updates.title } , meta: { noteId: id } });
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    logActivity({ action: 'note_deleted', meta: { noteId: id } });
  };

  // TodoList methods
  const addTodoList = (todoList: Omit<TodoList, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTodoList: TodoList = {
      ...todoList,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTodoLists(prev => [...prev, newTodoList]);
  };

  const updateTodoList = (id: string, updates: Partial<TodoList>) => {
    setTodoLists(prev => prev.map(list => 
      list.id === id ? { ...list, ...updates, updatedAt: new Date() } : list
    ));
  };

  const deleteTodoList = (id: string) => {
    setTodoLists(prev => prev.filter(list => list.id !== id));
  };

  // Financial methods
  const addAccount = (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date(),
    };
    setTransactions(prev => [...prev, newTransaction]);

    // Update account balance
    setAccounts(prev => prev.map(account => {
      if (account.id === transaction.accountId) {
        const balanceChange = transaction.type === 'deposit' ? transaction.amount : -transaction.amount;
        return { ...account, balance: account.balance + balanceChange, updatedAt: new Date() };
      }
      return account;
    }));

    // log
    logActivity({
      action: 'transaction_added',
      entity: { type: 'transaction', id: newTransaction.id, label: newTransaction.description },
      meta: { amount: newTransaction.amount, type: newTransaction.type, accountId: newTransaction.accountId }
    });
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const existing = prev.find(t => t.id === id);
      if (!existing) return prev;

      const updated: Transaction = { ...existing, ...updates };

      // If anything that impacts balance changed, adjust accounts accordingly
      const accountChanged = updates.accountId && updates.accountId !== existing.accountId;
      const typeChanged = typeof updates.type !== 'undefined' && updates.type !== existing.type;
      const amountChanged = typeof updates.amount !== 'undefined' && updates.amount !== existing.amount;

      if (accountChanged || typeChanged || amountChanged) {
        // Revert old effect from old account
        setAccounts(prevAcc => prevAcc.map(acc => {
          if (acc.id === existing.accountId) {
            const revertChange = existing.type === 'deposit' ? -existing.amount : existing.amount;
            return { ...acc, balance: acc.balance + revertChange, updatedAt: new Date() };
          }
          return acc;
        }));

        // Apply new effect to new account
        setAccounts(prevAcc => prevAcc.map(acc => {
          if (acc.id === (updates.accountId || existing.accountId)) {
            const newType = updates.type || existing.type;
            const newAmount = typeof updates.amount === 'number' ? updates.amount : existing.amount;
            const applyChange = newType === 'deposit' ? newAmount : -newAmount;
            return { ...acc, balance: acc.balance + applyChange, updatedAt: new Date() };
          }
          return acc;
        }));
      }

      const result = prev.map(t => t.id === id ? updated : t);

      // log
      logActivity({
        action: 'transaction_updated',
        entity: { type: 'transaction', id, label: updated.description },
        meta: { amount: updated.amount, type: updated.type, accountId: updated.accountId }
      });
      return result;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => {
      const existing = prev.find(t => t.id === id);
      if (!existing) return prev;

      // Revert the transaction effect from the account
      setAccounts(prevAcc => prevAcc.map(acc => {
        if (acc.id === existing.accountId) {
          const revertChange = existing.type === 'deposit' ? -existing.amount : existing.amount;
          return { ...acc, balance: acc.balance + revertChange, updatedAt: new Date() };
        }
        return acc;
      }));

      const result = prev.filter(t => t.id !== id);
      // log
      logActivity({ action: 'transaction_deleted', entity: { type: 'transaction', id: existing.id, label: existing.description } });
      return result;
    });
  };

  // Activity methods
  const logActivity = (activity: Omit<Activity, 'id' | 'at' | 'actor'>) => {
    const entry: Activity = { id: generateId(), at: new Date(), actor: actorName, ...activity };
    setActivities(prev => [entry, ...prev].slice(0, 200)); // keep last 200
  };

  const clearActivities = () => setActivities([]);

  const addReceivable = (receivable: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'receivedAt'>) => {
    const newReceivable: Receivable = {
      ...receivable,
      id: generateId(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setReceivables(prev => [...prev, newReceivable]);
    logActivity({ action: 'receivable_added', entity: { type: 'project', id: newReceivable.projectId || '', label: newReceivable.name }, meta: { receivableId: newReceivable.id, amount: newReceivable.amount } });
  };

  const updateReceivable = (id: string, updates: Partial<Receivable>) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r));
    logActivity({ action: 'receivable_updated', meta: { receivableId: id, updates } });
  };

  const deleteReceivable = (id: string) => {
    setReceivables(prev => prev.filter(r => r.id !== id));
    logActivity({ action: 'receivable_deleted', meta: { receivableId: id } });
  };

  const receiveReceivable = (receivableId: string, accountId: string) => {
    const receivable = receivables.find(r => r.id === receivableId);
    if (!receivable || receivable.status === 'received') return;

    // Mark as received
    setReceivables(prev => prev.map(r => r.id === receivableId ? { ...r, status: 'received', receivedAt: new Date(), updatedAt: new Date() } : r));

    // Create deposit transaction
    addTransaction({
      accountId,
      type: 'deposit',
      amount: receivable.amount,
      description: `Recebimento: ${receivable.name}`,
      date: new Date(),
    });
    logActivity({ action: 'receivable_received', meta: { receivableId, accountId, amount: receivable.amount } });
  };

  const addDebt = (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDebt: Debt = {
      ...debt,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setDebts(prev => [...prev, newDebt]);
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...updates, updatedAt: new Date() } : account
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
    // Optionally: keep transactions; could also filter transactions by account if desired
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    setDebts(prev => prev.map(debt => 
      debt.id === id ? { ...debt, ...updates, updatedAt: new Date() } : debt
    ));
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updates, updatedAt: new Date() } : goal
    ));
  };

  const payDebt = (debtId: string, accountId: string, amount: number) => {
    // Create transaction
    addTransaction({
      accountId,
      type: 'withdrawal',
      amount,
      description: `Pagamento de dívida`,
      date: new Date(),
    });

    // Update debt
    setDebts(prev => prev.map(debt => {
      if (debt.id === debtId) {
        return {
          ...debt,
          remainingAmount: Math.max(0, debt.remainingAmount - amount),
          updatedAt: new Date(),
        };
      }
      return debt;
    }));
  };

  const allocateToGoal = (goalId: string, accountId: string, amount: number) => {
    // Create transaction
    addTransaction({
      accountId,
      type: 'withdrawal',
      amount,
      description: `Alocação para meta`,
      date: new Date(),
    });

    // Update goal
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          currentAmount: goal.currentAmount + amount,
          updatedAt: new Date(),
        };
      }
      return goal;
    }));
  };

  // Contact methods
  const addContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setContacts(prev => [...prev, newContact]);
    logActivity({ action: 'contact_added', entity: { type: 'contact', id: newContact.id, label: newContact.name } });
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...updates, updatedAt: new Date() } : contact
    ));
    logActivity({ action: 'contact_updated', entity: { type: 'contact', id, label: updates.name } });
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
    logActivity({ action: 'contact_deleted', entity: { type: 'contact', id } });
  };

  const addContactGroup = (group: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGroup: ContactGroup = {
      ...group,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setContactGroups(prev => [...prev, newGroup]);
  };

  const updateContactGroup = (id: string, updates: Partial<ContactGroup>) => {
    setContactGroups(prev => prev.map(group => 
      group.id === id ? { ...group, ...updates, updatedAt: new Date() } : group
    ));

    if (updates.memberIds) {
      const updatedMemberIds = new Set(updates.memberIds);
      // Sync contacts -> add/remove group id in contact.groupIds
      setContacts(prev => prev.map(contact => {
        const hasGroup = contact.groupIds.includes(id);
        const shouldHave = updatedMemberIds.has(contact.id);
        if (hasGroup === shouldHave) return contact;
        const nextGroupIds = shouldHave
          ? [...contact.groupIds, id]
          : contact.groupIds.filter(gid => gid !== id);
        return { ...contact, groupIds: nextGroupIds, updatedAt: new Date() };
      }));
    }
  };

  const deleteContactGroup = (id: string) => {
    setContactGroups(prev => prev.filter(group => group.id !== id));
    // Remove group reference from contacts
    setContacts(prev => prev.map(contact => ({
      ...contact,
      groupIds: contact.groupIds.filter(gid => gid !== id),
      updatedAt: new Date(),
    })));
  };

  // Project media
  const addProjectImage = (image: Omit<ProjectImage, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newImage: ProjectImage = {
      ...image,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjectImages(prev => [newImage, ...prev]);
  };

  const deleteProjectImage = (id: string) => {
    setProjectImages(prev => prev.filter(img => img.id !== id));
  };

  // Project wallet (simple balance per project)
  const addProjectWalletEntry = (entry: Omit<ProjectWalletEntry, 'id' | 'createdAt'>) => {
    const newEntry: ProjectWalletEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date(),
    };
    setProjectWalletEntries(prev => [newEntry, ...prev]);
  };

  const deleteProjectWalletEntry = (id: string) => {
    setProjectWalletEntries(prev => prev.filter(e => e.id !== id));
  };

  // Clockify methods
  const addClockifyTimeEntry = (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: ClockifyTimeEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setClockifyTimeEntries(prev => [newEntry, ...prev]);
    return newEntry.id;
  };

  const updateClockifyTimeEntry = (id: string, updates: Partial<ClockifyTimeEntry>) => {
    setClockifyTimeEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e));
  };

  const deleteClockifyTimeEntry = (id: string) => {
    setClockifyTimeEntries(prev => prev.filter(e => e.id !== id));
  };

  const startClockifyTimer = (entry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      ...entry,
      startTime: new Date(),
      endTime: undefined,
      duration: 0,
      status: 'active'
    };
    
    const entryId = addClockifyTimeEntry(newEntry);
    return entryId;
  };

  const stopClockifyTimer = (entryId: string) => {
    const entry = clockifyTimeEntries.find(e => e.id === entryId);
    if (!entry) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);

    updateClockifyTimeEntry(entryId, {
      endTime,
      duration,
      status: 'completed'
    });

    // Criar uma tarefa quando o timer for parado
    if (entry.projectId) {
        addTask({
          title: entry.description,
          description: `Tarefa criada a partir do Clockify - Duração: ${formatDuration(duration)}`,
          completed: true,
          projectId: entry.projectId,
          date: new Date(),
          startTime: entry.startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          isRoutine: false,
          isOverdue: false
        });
    }
  };

  const pauseClockifyTimer = (entryId: string) => {
    const entry = clockifyTimeEntries.find(e => e.id === entryId);
    if (!entry) return;

    const endTime = new Date();
    const currentDuration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);
    const totalDuration = (entry.duration || 0) + currentDuration;

    updateClockifyTimeEntry(entryId, {
      endTime,
      duration: totalDuration,
      status: 'paused'
    });
  };

  const resumeClockifyTimer = (entryId: string) => {
    updateClockifyTimeEntry(entryId, {
      startTime: new Date(),
      endTime: undefined,
      status: 'active'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Plaky methods
  const addPlakyBoard = (board: Omit<PlakyBoard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBoard: PlakyBoard = {
      ...board,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPlakyBoards(prev => [newBoard, ...prev]);
  };

  const updatePlakyBoard = (id: string, updates: Partial<PlakyBoard>) => {
    setPlakyBoards(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b));
  };

  const deletePlakyBoard = (id: string) => {
    setPlakyBoards(prev => prev.filter(b => b.id !== id));
  };

  const addPlakyItem = (item: Omit<PlakyItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: PlakyItem = {
      ...item,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPlakyItems(prev => [newItem, ...prev]);
  };

  const updatePlakyItem = (id: string, updates: Partial<PlakyItem>) => {
    setPlakyItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date() } : i));
  };

  const deletePlakyItem = (id: string) => {
    setPlakyItems(prev => prev.filter(i => i.id !== id));
  };

  // Pomodoro methods
  const addPomodoroSession = (session: Omit<PomodoroSession, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSession: PomodoroSession = {
      ...session,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPomodoroSessions(prev => [newSession, ...prev]);
  };

  const updatePomodoroSession = (id: string, updates: Partial<PomodoroSession>) => {
    setPomodoroSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s));
  };

  const deletePomodoroSession = (id: string) => {
    setPomodoroSessions(prev => prev.filter(s => s.id !== id));
  };

  const updatePomodoroSettings = (settings: Partial<PomodoroSettings>) => {
    setPomodoroSettings(prev => ({ ...prev, ...settings }));
  };

  const updateAISettings = (settings: Partial<AISettings>) => {
    setAISettings(prev => ({ ...prev, ...settings }));
  };

  const startPomodoro = (projectId?: string, taskId?: string) => {
    const sessionId = generateId();
    addPomodoroSession({
      projectId,
      taskId,
      type: 'work',
      duration: pomodoroSettings.workDuration * 60,
      remainingTime: pomodoroSettings.workDuration * 60,
      isActive: true,
      isPaused: false,
      startTime: new Date(),
    });
    return sessionId;
  };

  const pausePomodoro = (sessionId: string) => {
    setPomodoroSessions(prev => prev.map(s => s.id === sessionId ? { ...s, endTime: new Date(), updatedAt: new Date() } : s));
  };

  const resumePomodoro = (sessionId: string) => {
    setPomodoroSessions(prev => prev.map(s => s.id === sessionId ? { ...s, endTime: null, updatedAt: new Date() } : s));
  };

  const stopPomodoro = (sessionId: string) => {
    setPomodoroSessions(prev => prev.map(s => s.id === sessionId ? { ...s, endTime: new Date(), updatedAt: new Date() } : s));
  };

  const value: AppContextType = {
    projects,
    addProject,
    updateProject,
    deleteProject,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    notes,
    addNote,
    updateNote,
    deleteNote,
    todoLists,
    addTodoList,
    updateTodoList,
    deleteTodoList,
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

    // Routines
    routines,
    routineCompletions,
    addRoutine,
    updateRoutine,
    softDeleteRoutine,
    hardDeleteRoutine,
    completeRoutineOnce,
    skipRoutineDay,
    skipRoutineBetween,
    setRoutineException,
    pauseRoutineUntil,
    setRoutineActiveTo,
    getRoutineProgress,
    contacts,
    contactGroups,
    addContact,
    updateContact,
    deleteContact,
    addContactGroup,
    updateContactGroup,
    deleteContactGroup,
    projectImages,
    addProjectImage,
    deleteProjectImage,
    projectWalletEntries,
    addProjectWalletEntry,
    deleteProjectWalletEntry,
    clockifyTimeEntries,
    addClockifyTimeEntry,
    updateClockifyTimeEntry,
    deleteClockifyTimeEntry,
    startClockifyTimer,
    stopClockifyTimer,
    pauseClockifyTimer,
    resumeClockifyTimer,
    plakyBoards,
    plakyItems,
    addPlakyBoard,
    updatePlakyBoard,
    deletePlakyBoard,
    addPlakyItem,
    updatePlakyItem,
    deletePlakyItem,
    pomodoroSessions,
    pomodoroSettings,
    addPomodoroSession,
    updatePomodoroSession,
    deletePomodoroSession,
    updatePomodoroSettings,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,

    // AI
    aiSettings,
    updateAISettings,

    // Activity
    activities,
    logActivity,
    actorName,
    updateActorName: setActorName,
    clearActivities,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}