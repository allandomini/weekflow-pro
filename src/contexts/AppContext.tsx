import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, Task, Note, TodoList, Account, Transaction, 
  Debt, Goal, Contact, ContactGroup 
} from '@/types';

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
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  payDebt: (debtId: string, accountId: string, amount: number) => void;
  allocateToGoal: (goalId: string, accountId: string, amount: number) => void;

  // Network
  contacts: Contact[];
  contactGroups: ContactGroup[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addContactGroup: (group: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContactGroup: (id: string, updates: Partial<ContactGroup>) => void;
  deleteContactGroup: (id: string) => void;
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    const savedTasks = localStorage.getItem('tasks');
    const savedNotes = localStorage.getItem('notes');
    const savedTodoLists = localStorage.getItem('todoLists');
    const savedAccounts = localStorage.getItem('accounts');
    const savedTransactions = localStorage.getItem('transactions');
    const savedDebts = localStorage.getItem('debts');
    const savedGoals = localStorage.getItem('goals');
    const savedContacts = localStorage.getItem('contacts');
    const savedContactGroups = localStorage.getItem('contactGroups');

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
    if (savedDebts) setDebts(JSON.parse(savedDebts, (key, value) => {
      if (key.includes('Date') || key.includes('At')) return new Date(value);
      return value;
    }));
    if (savedGoals) setGoals(JSON.parse(savedGoals, (key, value) => {
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
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
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
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('contactGroups', JSON.stringify(contactGroups));
  }, [contactGroups]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Project methods
  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...project,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    // Also delete related tasks and notes
    setTasks(prev => prev.filter(task => task.projectId !== id));
    setNotes(prev => prev.filter(note => note.projectId !== id));
    setTodoLists(prev => prev.filter(list => list.projectId !== id));
  };

  // Task methods
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
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
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
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
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...updates, updatedAt: new Date() } : contact
    ));
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
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
  };

  const deleteContactGroup = (id: string) => {
    setContactGroups(prev => prev.filter(group => group.id !== id));
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
    addAccount,
    addTransaction,
    addDebt,
    addGoal,
    updateAccount,
    updateDebt,
    updateGoal,
    payDebt,
    allocateToGoal,
    contacts,
    contactGroups,
    addContact,
    updateContact,
    deleteContact,
    addContactGroup,
    updateContactGroup,
    deleteContactGroup,
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