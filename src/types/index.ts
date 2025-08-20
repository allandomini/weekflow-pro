export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  projectId?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  isRoutine: boolean;
  isOverdue: boolean;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoList {
  id: string;
  title: string;
  items: TodoItem[];
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  category?: string;
  date: Date;
  createdAt: Date;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: Date;
  allocatedReceivableIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receivable {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'received';
  receivedAt?: Date;
  description?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  whatsapp?: string;
  skills: string[];
  notes?: string;
  projectIds: string[];
  groupIds: string[];
  attachments?: { name: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectImage {
  id: string;
  projectId: string;
  url: string; // data URL (base64) or object URL
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWalletEntry {
  id: string;
  projectId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description?: string;
  createdAt: Date;
}

// Clockify Types - Integrado com sistema existente
export interface ClockifyTimeEntry {
  id: string;
  description: string;
  projectId: string; // SEMPRE conectado a um projeto existente
  personIds: string[]; // IDs das pessoas do Network (pode ser múltiplas)
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  billable: boolean;
  hourlyRate?: number;
  tags: string[]; // tags para categorizar a atividade
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

// Plaky Types - Integrado com sistema existente
export interface PlakyBoard {
  id: string;
  name: string;
  description?: string;
  color: string;
  projectId?: string; // Conectado a um projeto existente (opcional)
  columns: PlakyColumn[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlakyColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'status' | 'person' | 'dropdown';
  options?: string[]; // for dropdown/status columns
  order: number;
}

export interface PlakyItem {
  id: string;
  boardId: string;
  taskId?: string; // Conectado a uma tarefa existente (opcional)
  personIds: string[]; // IDs das pessoas responsáveis
  values: Record<string, any>; // columnId -> value mapping
  tags: string[]; // tags para categorizar o item
  createdAt: Date;
  updatedAt: Date;
}

// Pomodoro Types
export interface PomodoroSession {
  id: string;
  projectId?: string;
  taskId?: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // in seconds
  remainingTime: number; // in seconds
  isActive: boolean;
  isPaused: boolean;
  startTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // every X work sessions
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

// AI / Assistant types
export interface AISettings {
  enabled: boolean;
  deepAnalysis: boolean;
  // Optional future-proofing for model selection and context sizing
  model?: string; // e.g., "gemini-1.5-pro"
  maxContextItems?: number; // caps how much data to pack into context
}

// Activity / Audit Log Types
export interface ActivityEntityRef {
  type: 'task' | 'transaction' | 'contact' | 'project' | 'routine' | 'debt' | 'goal';
  id: string;
  label?: string;
}

export interface Activity {
  id: string;
  at: Date;
  actor: string;
  action:
    | 'task_created'
    | 'task_completed'
    | 'task_uncompleted'
    | 'task_deleted'
    | 'transaction_added'
    | 'transaction_updated'
    | 'transaction_deleted'
    | 'contact_added'
    | 'contact_updated'
    | 'contact_deleted'
    | 'project_added'
    | 'project_updated'
    | 'project_deleted'
    | 'note_added'
    | 'note_updated'
    | 'note_deleted'
    | 'receivable_added'
    | 'receivable_updated'
    | 'receivable_deleted'
    | 'receivable_received'
    | 'routine_added'
    | 'routine_updated'
    | 'routine_deleted'
    | 'routine_completed'
    | 'routine_skipped'
    | 'routine_paused'
    | 'routine_resumed'
    | 'debt_added'
    | 'debt_updated'
    | 'debt_deleted'
    | 'debt_paid'
    | 'goal_added'
    | 'goal_updated'
    | 'goal_deleted';
  entity?: ActivityEntityRef;
  meta?: Record<string, any>;
}

// Routines
export interface RoutineException {
  skip?: boolean;
  overrideTimesPerDay?: number;
  overrideTimes?: string[];
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  color: string;
  timesPerDay: number; // e.g., 3 = beber água 3x
  specificTimes?: string[]; // e.g., ["08:00", "12:00", "18:00"]
  weekdays?: number[]; // 0-6 (Sunday-Saturday), empty = every day
  durationDays?: number; // null = forever, number = specific duration
  priority: 'low' | 'medium' | 'high';
  schedule: Record<string, any>; // JSONB field (legacy, kept for compatibility)
  activeFrom: string; // yyyy-MM-dd
  activeTo?: string;   // yyyy-MM-dd
  pausedUntil?: string; // yyyy-MM-dd
  exceptions?: Record<string, RoutineException>; // date (yyyy-MM-dd) -> exception
  deletedAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineCompletion {
  id: string;
  routineId: string;
  date: string; // yyyy-MM-dd
  count: number;
  goal: number;
  skipped: boolean;
  paused: boolean;
  specificTime?: string; // e.g., "08:00"
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineExceptionRecord {
  id: string;
  routineId: string;
  date: string; // yyyy-MM-dd
  action: 'skip' | 'override_times' | 'override_count';
  value?: any; // JSON value for overrides
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineBulkOperation {
  id: string;
  routineId: string;
  operationType: 'delete_occurrences' | 'skip_period';
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  affectedDates: string[]; // yyyy-MM-dd[]
  createdAt: Date;
}