import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import FinancialCalculator from '@/components/FinancialCalculator';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  Edit,
  Trash,
  Pencil,
  CheckCircle2,
  Clock,
  Archive,
  AlertTriangle,
  Receipt,
  Calculator,
  Shield,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Account, Transaction, Debt, Goal, Receivable } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Finances() {
  const { 
    accounts, 
    transactions, 
    debts, 
    goals, 
    receivables,
    projects,
    addAccount, 
    addTransaction, 
    addDebt, 
    addGoal,
    updateAccount,
    payDebt,
    allocateToGoal,
    addReceivable,
    updateReceivable,
    receiveReceivable,
    deleteAccount,
    updateTransaction,
    deleteTransaction,
    updateDebt,
    deleteDebt,
    deleteReceivable
  } = useAppContext();
  
  const { t, getCurrentLanguage } = useTranslation();
  const { formatAmount } = useCurrency();
  
  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    const lang = getCurrentLanguage();
    switch (lang) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isReceivableDialogOpen, setIsReceivableDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isPayDebtDialogOpen, setIsPayDebtDialogOpen] = useState(false);
  const [isAllocateAdvanceDialogOpen, setIsAllocateAdvanceDialogOpen] = useState(false);
  const [isEditDebtDialogOpen, setIsEditDebtDialogOpen] = useState(false);
  const [isDeleteDebtDialogOpen, setIsDeleteDebtDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [selectedReceivableIds, setSelectedReceivableIds] = useState<string[]>([]);
  const [editDebtForm, setEditDebtForm] = useState({ name: '', totalAmount: 0, remainingAmount: 0, dueDate: '' });
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isAllocateGoalDialogOpen, setIsAllocateGoalDialogOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState<{
    isOpen: boolean;
    account: Account | null;
    hasTransactions: boolean;
    transactionCount: number;
  }>({
    isOpen: false,
    account: null,
    hasTransactions: false,
    transactionCount: 0
  });

  const handleDeleteAccountClick = (account: Account) => {
    const accountTransactions = transactions.filter(t => t.accountId === account.id);
    setDeleteAccountDialog({
      isOpen: true,
      account,
      hasTransactions: accountTransactions.length > 0,
      transactionCount: accountTransactions.length
    });
  };

  const handleConfirmDeleteAccount = () => {
    if (deleteAccountDialog.account) {
      // Type assertion to handle the deleteAccount function safely
      const deleteFn = deleteAccount as ((id: string, forceDelete?: boolean) => void) | undefined;
      if (typeof deleteFn === 'function') {
        deleteFn(deleteAccountDialog.account.id, deleteAccountDialog.hasTransactions);
      }
      setDeleteAccountDialog({
        isOpen: false,
        account: null,
        hasTransactions: false,
        transactionCount: 0
      });
    }
  };

  const [accountForm, setAccountForm] = useState({
    name: "",
    balance: "",
    type: "checking" as Account['type']
  });

  const [transactionForm, setTransactionForm] = useState({
    accountId: "",
    type: "deposit" as "deposit" | "withdrawal",
    amount: "",
    description: "",
    category: "general" as string
  });

  const [debtForm, setDebtForm] = useState({
    name: "",
    totalAmount: "",
    dueDate: ""
  });

  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    targetDate: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    accountId: "",
    amount: ""
  });

  const [allocationForm, setAllocationForm] = useState({
    accountId: "",
    amount: ""
  });

  const [receivableForm, setReceivableForm] = useState({
    name: "",
    amount: "",
    dueDate: "",
    description: "",
    projectId: "none",
    installments: "1"
  });

  const [receiveForm, setReceiveForm] = useState({
    accountId: ""
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const activeDebts = debts.filter(debt => debt.status === 'active');
  const paidDebts = debts.filter(debt => debt.status === 'paid');
  const overdueDebts = debts.filter(debt => debt.status === 'overdue');
  const totalActiveDebts = activeDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalGoals = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalReceivablesPending = receivables
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);
  
  // Calculate financial health metrics
  const netWorth = totalBalance - totalActiveDebts;
  const debtToIncomeRatio = totalBalance > 0 ? (totalActiveDebts / totalBalance) * 100 : 0;

  const handleCreateAccount = () => {
    if (!accountForm.name.trim() || !accountForm.balance) return;

    addAccount({
      name: accountForm.name,
      balance: parseFloat(accountForm.balance),
      type: accountForm.type
    });

    setAccountForm({ name: "", balance: "", type: "checking" });
    setIsAccountDialogOpen(false);
  };

  const handleSaveAccount = () => {
    if (!accountForm.name.trim() || !accountForm.balance) return;
    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: accountForm.name,
        balance: parseFloat(accountForm.balance),
        type: accountForm.type,
      });
      setEditingAccount(null);
      setIsAccountDialogOpen(false);
      setAccountForm({ name: "", balance: "", type: "checking" });
    } else {
      handleCreateAccount();
    }
  };

  const handleCreateTransaction = () => {
    console.log('handleCreateTransaction called');
    console.log('transactionForm:', transactionForm);
    
    if (!transactionForm.accountId || !transactionForm.amount || !transactionForm.description) {
      console.log('Validation failed:', {
        accountId: transactionForm.accountId,
        amount: transactionForm.amount,
        description: transactionForm.description
      });
      return;
    }

    console.log('Validation passed, calling addTransaction');
    
    addTransaction({
      accountId: transactionForm.accountId,
      type: transactionForm.type,
      amount: parseFloat(transactionForm.amount),
      description: `${transactionForm.description}${transactionForm.category ? ` • ${transactionForm.category}` : ""}`,
      date: new Date()
    });

    setTransactionForm({ accountId: "", type: "deposit", amount: "", description: "", category: "general" });
    setIsTransactionDialogOpen(false);
  };

  const handleSaveTransaction = async () => {
    if (!editingTransaction) return;
    if (!transactionForm.accountId || !transactionForm.amount || !transactionForm.description) return;

    try {
      await updateTransaction(editingTransaction.id, {
        accountId: transactionForm.accountId,
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        description: `${transactionForm.description}${transactionForm.category ? ` • ${transactionForm.category}` : ""}`,
      });

      setEditingTransaction(null);
      setTransactionForm({ accountId: "", type: "deposit", amount: "", description: "", category: "general" });
      setIsTransactionDialogOpen(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const openEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    // Try to parse category from description suffix " • <cat>"
    let baseDesc = t.description;
    let cat = "general";
    const marker = " • ";
    const idx = t.description.lastIndexOf(marker);
    if (idx !== -1) {
      baseDesc = t.description.substring(0, idx);
      cat = t.description.substring(idx + marker.length) || "general";
    }
    setTransactionForm({
      accountId: t.accountId,
      type: t.type as "deposit" | "withdrawal",
      amount: String(t.amount),
      description: baseDesc,
      category: cat,
    });
    setIsTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm(t('finances.confirm_delete_transaction'))) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleCreateDebt = () => {
    if (!debtForm.name.trim() || !debtForm.totalAmount || !debtForm.dueDate) return;

    const amount = parseFloat(debtForm.totalAmount);
    const dueDate = new Date(debtForm.dueDate);
    const today = new Date();
    const status = dueDate < today ? 'overdue' : 'active';
    
    addDebt({
      name: debtForm.name,
      totalAmount: amount,
      remainingAmount: amount,
      dueDate,
      status
    });

    setDebtForm({ name: "", totalAmount: "", dueDate: "" });
    setIsDebtDialogOpen(false);
  };

  const handleCreateGoal = () => {
    if (!goalForm.name.trim() || !goalForm.targetAmount) return;

    addGoal({
      name: goalForm.name,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: 0,
      targetDate: goalForm.targetDate ? new Date(goalForm.targetDate) : undefined
    });

    setGoalForm({ name: "", targetAmount: "", targetDate: "" });
    setIsGoalDialogOpen(false);
  };

  const handleCreateReceivable = () => {
    if (!receivableForm.name.trim() || !receivableForm.amount || !receivableForm.dueDate) return;

    const installments = Math.max(1, parseInt(receivableForm.installments || '1', 10));
    for (let i = 1; i <= installments; i++) {
      addReceivable({
        name: installments > 1 ? `${receivableForm.name} (${i}/${installments})` : receivableForm.name,
        amount: parseFloat(receivableForm.amount),
        dueDate: new Date(receivableForm.dueDate),
        description: receivableForm.description || undefined,
        projectId: receivableForm.projectId === "none" ? undefined : receivableForm.projectId,
      });
    }

    setReceivableForm({ name: "", amount: "", dueDate: "", description: "", projectId: "none", installments: "1" });
    setIsReceivableDialogOpen(false);
  };

  const handleReceiveReceivable = () => {
    if (!selectedReceivable || !receiveForm.accountId) return;
    receiveReceivable(selectedReceivable.id, receiveForm.accountId);
    setReceiveForm({ accountId: "" });
    setIsReceiveDialogOpen(false);
    setSelectedReceivable(null);
  };

  const handlePayDebt = () => {
    if (!selectedDebt || !paymentForm.accountId || !paymentForm.amount) return;

    const amount = parseFloat(paymentForm.amount);
    const account = accounts.find(a => a.id === paymentForm.accountId);
    
    if (!account || account.balance < amount) {
      alert(t('finances.insufficient_balance'));
      return;
    }

    payDebt(selectedDebt.id, paymentForm.accountId, amount);
    setPaymentForm({ accountId: "", amount: "" });
    setIsPayDebtDialogOpen(false);
    setSelectedDebt(null);
  };

  const handleAllocateToGoal = () => {
    if (!selectedGoal || !allocationForm.accountId || !allocationForm.amount) return;

    const amount = parseFloat(allocationForm.amount);
    const account = accounts.find(a => a.id === allocationForm.accountId);
    
    if (!account || account.balance < amount) {
      alert(t('finances.insufficient_balance'));
      return;
    }

    allocateToGoal(selectedGoal.id, allocationForm.accountId, amount);
    setAllocationForm({ accountId: "", amount: "" });
    setIsAllocateGoalDialogOpen(false);
    setSelectedGoal(null);
  };

  const handleAllocateAdvance = async () => {
    if (!selectedDebt) return;
    
    try {
      await updateDebt(selectedDebt.id, { ...selectedDebt, allocatedReceivableIds: selectedReceivableIds });
      setIsAllocateAdvanceDialogOpen(false);
      setSelectedReceivableIds([]);
      setSelectedDebt(null);
    } catch (error) {
      console.error('Error allocating advance:', error);
    }
  };

  const getAccountById = (accountId: string) => {
    return accounts.find(a => a.id === accountId);
  };

  const getAccountTransactions = (accountId: string) => {
    return transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  const getAllocatedSum = (debt: Debt) => {
    const ids = (debt as any).allocatedReceivableIds || [];
    return ids.reduce((sum: number, id: string) => {
      const r = receivables.find(r => r.id === id && r.status === 'pending');
      return sum + (r ? r.amount : 0);
    }, 0);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('finances.title')}</h1>
            <p className="text-muted-foreground">
              {t('finances.manage_description')}
            </p>
          </div>
        <div className="flex gap-2">
          <FinancialCalculator />
          <Button variant="outline" onClick={() => setIsAccountDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
{t('finances.create_account')}
          </Button>
          <Button variant="gradient" onClick={() => setIsTransactionDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
{t('finances.create_transaction')}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.balance')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatAmount(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} {accounts.length === 1 ? t('finances.labels.account') : t('finances.labels.accounts')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.active_debts')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatAmount(totalActiveDebts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeDebts.length} {activeDebts.length === 1 ? t('finances.labels.active') : t('finances.labels.actives')}
              {overdueDebts.length > 0 && (
                <span className="text-red-600 ml-1">• {overdueDebts.length} {overdueDebts.length === 1 ? t('finances.labels.overdue') : t('finances.labels.overdues')}</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.net_worth')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatAmount(netWorth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netWorth >= 0 ? t('finances.positive_situation') : t('finances.needs_attention')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.goals')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatAmount(totalGoals)}
            </div>
            <p className="text-xs text-muted-foreground">
              {goals.length} {goals.length === 1 ? t('finances.labels.goal') : t('finances.labels.goals')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.receivables')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {formatAmount(totalReceivablesPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {receivables.filter(r => r.status === 'pending').length} {t('finances.labels.pendings')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="accounts">{t('financial.tabs.accounts')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('financial.tabs.transactions')}</TabsTrigger>
          <TabsTrigger value="debts">{t('financial.tabs.debts')}</TabsTrigger>
          <TabsTrigger value="goals">{t('financial.tabs.goals')}</TabsTrigger>
          <TabsTrigger value="receivables">{t('financial.tabs.receivables')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('financial.tabs.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((account) => (
              <Card key={account.id} className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      {account.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {account.type === 'checking' ? t('finances.account_types.checking') : 
                       account.type === 'savings' ? t('finances.account_types.savings') : t('finances.account_types.investment')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(account.balance)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingAccount(account);
                        setAccountForm({ name: account.name, balance: String(account.balance), type: account.type });
                        setIsAccountDialogOpen(true);
                      }}>{t('common.edit')}</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAccountClick(account)}>
                        {t('common.delete')}
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        {t('finances.latest_transactions')}
                      </h4>
                      <div className="space-y-2">
                        {getAccountTransactions(account.id).map((transaction) => (
                  <div key={transaction.id} className="group flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      {transaction.type === 'deposit' ? (
                        <ArrowUpCircle className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4 text-destructive" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(transaction.date, "d MMM", { locale: getDateLocale() })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`font-medium ${
                        transaction.type === 'deposit' ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Ações">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditTransaction(transaction)}>
                            <Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteTransaction(transaction.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                        {getAccountTransactions(account.id).length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">
                            {t('finances.no_transactions_found')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>{t('finances.transaction_history')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 20)
                  .map((transaction) => {
                    const account = getAccountById(transaction.accountId);
                    return (
                      <div key={transaction.id} className="group flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {transaction.type === 'deposit' ? (
                            <ArrowUpCircle className="w-5 h-5 text-success" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-destructive" />
                          )}
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {account?.name} • {format(transaction.date, "d MMM 'at' HH:mm", { locale: getDateLocale() })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`font-medium ${
                            transaction.type === 'deposit' ? 'text-success' : 'text-destructive'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {formatAmount(transaction.amount)}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Ações">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditTransaction(transaction)}>
                                <Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteTransaction(transaction.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                {transactions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t('finances.no_transactions_found')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant={overdueDebts.length > 0 ? "destructive" : "secondary"}>
                  {activeDebts.length} {activeDebts.length === 1 ? t('finances.labels.active') : t('finances.labels.actives')}
                </Badge>
                {overdueDebts.length > 0 && (
                  <Badge variant="destructive">
                    {overdueDebts.length} {overdueDebts.length === 1 ? t('finances.labels.overdue') : t('finances.labels.overdues')}
                  </Badge>
                )}
                {paidDebts.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {paidDebts.length} {paidDebts.length === 1 ? t('finances.labels.paid') : t('finances.labels.paids')}
                  </Badge>
                )}
              </div>
              <Button onClick={() => setIsDebtDialogOpen(true)} className="gap-2">
                <Receipt className="w-4 h-4" />
                {t('finances.debt_dialog.title')}
              </Button>
            </div>
            
            {/* Active and Overdue Debts */}
            {(activeDebts.length > 0 || overdueDebts.length > 0) && (
              <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  {t('finances.labels.pending_debts')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeDebts.concat(overdueDebts).map((debt) => {
                const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
                const allocatedSum = getAllocatedSum(debt);
                const projectedRemaining = debt.remainingAmount - allocatedSum;
                const isOverdue = debt.status === 'overdue';
                const daysUntilDue = Math.ceil((debt.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={debt.id} className={`shadow-elegant ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isOverdue ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-destructive" />
                          )}
                          <span className={isOverdue ? 'text-red-800' : ''}>{debt.name}</span>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              {Math.abs(daysUntilDue)} {t('finances.labels.days_overdue')}
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedDebt(debt);
                              setEditDebtForm({
                                name: debt.name,
                                totalAmount: debt.totalAmount,
                                remainingAmount: debt.remainingAmount,
                                dueDate: format(debt.dueDate, 'yyyy-MM-dd')
                              });
                              setIsEditDebtDialogOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedDebt(debt);
                                setIsDeleteDebtDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{t('finances.labels.remaining_value')}</span>
                            <span className="font-medium">{progress.toFixed(0)}% {t('finances.labels.paid_percentage')}</span>
                          </div>
                          <div className="text-xl font-bold text-destructive mb-2">
                            {formatAmount(debt.remainingAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('finances.labels.of')} {formatAmount(debt.totalAmount)}
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div 
                              className="bg-destructive h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{t('finances.labels.projected_remaining')}</span>
                          </div>
                          <div className="text-xl font-bold text-destructive mb-2">
                            {formatAmount(projectedRemaining)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {t('finances.labels.due_date')} {format(debt.dueDate, "d MMM yyyy", { locale: getDateLocale() })}
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setIsPayDebtDialogOpen(true);
                          }}
                        >
                          {t('finances.labels.make_payment')}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setSelectedReceivableIds((debt as any).allocatedReceivableIds || []);
                            setIsAllocateAdvanceDialogOpen(true);
                          }}
                        >
                          {t('finances.labels.allocate_advance')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
                </div>
              </div>
            )}
            
            {/* Paid Debts Section */}
            {paidDebts.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Archive className="w-5 h-5 text-green-600" />
                  {t('finances.labels.paid_debts')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paidDebts.map((debt) => {
                    const paidDate = debt.paidAt || debt.updatedAt;
                    return (
                      <Card key={debt.id} className="shadow-elegant border-green-200 bg-transparent">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="text-green-800">{debt.name}</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                {t('finances.labels.paid_status')}
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-xl font-bold text-green-700">
                              {formatAmount(debt.totalAmount)}
                            </div>
                            <div className="text-sm text-green-600">
                              {t('finances.labels.total_paid')}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Calendar className="w-4 h-4" />
                              {t('finances.labels.paid_on')} {format(paidDate, "d MMM yyyy", { locale: getDateLocale() })}
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                              <div className="bg-green-600 h-2 rounded-full w-full" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsGoalDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('finances.labels.new_goal')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <Card key={goal.id} className="shadow-elegant">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-warning" />
                        {goal.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{t('finances.labels.progress')}</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="text-xl font-bold text-warning mb-2">
                            {formatAmount(goal.currentAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('finances.labels.of')} {formatAmount(goal.targetAmount)}
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div 
                              className="bg-warning h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        {goal.targetDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {t('finances.labels.goal_target')} {format(goal.targetDate, "d MMM yyyy", { locale: getDateLocale() })}
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setIsAllocateGoalDialogOpen(true);
                          }}
                        >
                          {t('finances.labels.allocate_money')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="receivables">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsReceivableDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('finances.labels.new_receivable')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {receivables.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()).map((r) => (
                <Card key={r.id} className="shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {r.status === 'received' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                      {r.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-xl font-bold ${r.status === 'received' ? 'text-success' : 'text-accent'}`}>
                          {formatAmount(r.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('finances.labels.due_date_short')}: {format(r.dueDate, "d MMM yyyy", { locale: getDateLocale() })}
                        </div>
                        {r.description && (
                          <div className="text-sm text-muted-foreground mt-1">{r.description}</div>
                        )}
                        {r.status === 'received' && r.receivedAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {t('finances.labels.received_on')} {format(r.receivedAt, "d MMM yyyy", { locale: getDateLocale() })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {r.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedReceivable(r);
                              setIsReceiveDialogOpen(true);
                            }}
                          >
                            {t('finances.labels.mark_received')}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          onClick={() => deleteReceivable(r.id)}
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {receivables.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{t('finances.labels.no_records')}</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab (quick insights) */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>{t('finances.labels.net_flow_30_days')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatAmount(
                    transactions.filter(t=>Date.now()-t.date.getTime()<=30*24*60*60*1000)
                      .reduce((sum,t)=>sum + (t.type==='deposit'? t.amount : -t.amount),0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{t('finances.labels.income_minus_expenses')}</p>
              </CardContent>
            </Card>
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>{t('finances.labels.largest_recent_expense')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {(() => {
                    const w = transactions.filter(t=>t.type==='withdrawal').sort((a,b)=>b.amount-a.amount)[0]
                    return w ? formatAmount(w.amount) : '—'
                  })()}
                </p>
                <p className="text-sm text-muted-foreground">{t('finances.labels.cost_reduction_focus')}</p>
              </CardContent>
            </Card>
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>{t('finances.labels.pending_receivables')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatAmount(totalReceivablesPending)}</p>
                <p className="text-sm text-muted-foreground">{t('finances.labels.cash_flow_planning')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {/* Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={(open)=>{ if(!open) setEditingAccount(null); setIsAccountDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? t('finances.account_dialog.edit_title') : t('finances.account_dialog.create_title')}</DialogTitle>
            <DialogDescription>
              {editingAccount ? t('finances.account_dialog.edit_description') : t('finances.account_dialog.create_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountName">{t('finances.account_dialog.name_label')}</Label>
              <Input
                id="accountName"
                value={accountForm.name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('finances.account_dialog.name_placeholder')}
              />
            </div>
            <div>
              <Label htmlFor="accountBalance">{t('finances.account_dialog.balance_label')}</Label>
              <Input
                id="accountBalance"
                type="number"
                step="0.01"
                value={accountForm.balance}
                onChange={(e) => setAccountForm(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="accountType">{t('finances.account_dialog.type_label')}</Label>
              <Select value={accountForm.type} onValueChange={(value: Account['type']) => setAccountForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">{t('finances.account_types.checking')}</SelectItem>
                  <SelectItem value="savings">{t('finances.account_types.savings')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={editingAccount ? handleSaveAccount : handleCreateAccount} className="flex-1">
                {editingAccount ? t('finances.account_dialog.save_button') : t('finances.account_dialog.create_button')}
              </Button>
              <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? t('finances.dialogs.edit_transaction') : t('finances.dialogs.new_transaction')}</DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? t('finances.dialogs.edit_transaction_desc')
                : t('finances.dialogs.new_transaction_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionAccount">{t('finances.dialogs.account_label')}</Label>
              <Select value={transactionForm.accountId} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.dialogs.select_account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionType">{t('finances.dialogs.type_label')}</Label>
              <Select value={transactionForm.type} onValueChange={(value: "deposit" | "withdrawal") => setTransactionForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">{t('finances.dialogs.deposit')}</SelectItem>
                  <SelectItem value="withdrawal">{t('finances.dialogs.withdrawal')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionCategory">{t('finances.dialogs.category_label')}</Label>
              <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.dialogs.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('finances.categories.general')}</SelectItem>
                  <SelectItem value="salario">{t('finances.categories.salario')}</SelectItem>
                  <SelectItem value="venda">{t('finances.categories.venda')}</SelectItem>
                  <SelectItem value="alimentacao">{t('finances.categories.alimentacao')}</SelectItem>
                  <SelectItem value="moradia">{t('finances.categories.moradia')}</SelectItem>
                  <SelectItem value="transporte">{t('finances.categories.transporte')}</SelectItem>
                  <SelectItem value="saude">{t('finances.categories.saude')}</SelectItem>
                  <SelectItem value="lazer">{t('finances.categories.lazer')}</SelectItem>
                  <SelectItem value="impostos">{t('finances.categories.impostos')}</SelectItem>
                  <SelectItem value="outros">{t('finances.categories.outros')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionAmount">{t('finances.dialogs.amount_label')}</Label>
              <Input
                id="transactionAmount"
                type="number"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="transactionDescription">{t('finances.dialogs.description_label')}</Label>
              <Input
                id="transactionDescription"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('finances.dialogs.description_placeholder')}
                className={!transactionForm.description ? "border-red-500" : ""}
              />
              {!transactionForm.description && (
                <p className="text-sm text-red-500 mt-1">{t('finances.dialogs.required_field')}</p>
              )}
            </div>
            <div>
              <Label>{t('finances.dialogs.quick_categories')}</Label>
              <div className="flex flex-wrap gap-2 text-xs">
                {['salario','venda','alimentacao','moradia','transporte','saude','lazer','impostos','outros'].map(cat => (
                  <button key={cat} type="button" className={`px-2 py-1 rounded border ${transactionForm.category===cat? 'bg-accent' : ''}`} onClick={() => setTransactionForm(prev => ({...prev, category: cat}))}>{t(`finances.categories.${cat}`)}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              {editingTransaction ? (
                <Button onClick={handleSaveTransaction} className="flex-1">
                  {t('finances.dialogs.save_changes')}
                </Button>
              ) : (
                <Button onClick={handleCreateTransaction} className="flex-1">
                  {t('finances.dialogs.create_transaction')}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsTransactionDialogOpen(false);
                  setEditingTransaction(null);
                  setTransactionForm({ accountId: "", type: "deposit", amount: "", description: "", category: "general" });
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debt Dialog */}
      <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {t('finances.debt_dialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('finances.debt_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="debtName">{t('finances.debt_dialog.name_label')}</Label>
              <Input
                id="debtName"
                value={debtForm.name}
                onChange={(e) => setDebtForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('finances.debt_dialog.name_placeholder')}
              />
            </div>
            <div>
              <Label htmlFor="debtAmount">{t('finances.debt_dialog.amount_label')}</Label>
              <Input
                id="debtAmount"
                type="number"
                step="0.01"
                value={debtForm.totalAmount}
                onChange={(e) => setDebtForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="debtDueDate">{t('finances.debt_dialog.due_date_label')}</Label>
              <Input
                id="debtDueDate"
                type="date"
                value={debtForm.dueDate}
                onChange={(e) => setDebtForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
              {t('finances.tips.debt_overdue_tip')}
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateDebt} className="flex-1 gap-2">
                <Receipt className="w-4 h-4" />
                {t('finances.debt_dialog.create_button')}
              </Button>
              <Button variant="outline" onClick={() => setIsDebtDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finances.dialogs.new_goal_title')}</DialogTitle>
            <DialogDescription>
              {t('finances.dialogs.new_goal_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goalName">{t('finances.dialogs.goal_name')}</Label>
              <Input
                id="goalName"
                value={goalForm.name}
                onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('finances.dialogs.goal_name_placeholder')}
              />
            </div>
            <div>
              <Label htmlFor="goalAmount">{t('finances.dialogs.target_amount')}</Label>
              <Input
                id="goalAmount"
                type="number"
                step="0.01"
                value={goalForm.targetAmount}
                onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="goalDate">{t('finances.dialogs.target_date')}</Label>
              <Input
                id="goalDate"
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateGoal} className="flex-1">
                {t('finances.dialogs.create_goal')}
              </Button>
              <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receivable Dialog */}
      <Dialog open={isReceivableDialogOpen} onOpenChange={setIsReceivableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finances.dialogs.new_receivable_title')}</DialogTitle>
            <DialogDescription>
              {t('finances.dialogs.new_receivable_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="receivableName">{t('finances.dialogs.receivable_name')}</Label>
              <Input
                id="receivableName"
                value={receivableForm.name}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('finances.dialogs.receivable_name_placeholder')}
              />
            </div>
            <div>
              <Label htmlFor="receivableAmount">{t('finances.dialogs.receivable_amount')}</Label>
              <Input
                id="receivableAmount"
                type="number"
                step="0.01"
                value={receivableForm.amount}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="receivableInstallments">{t('finances.dialogs.installments')}</Label>
              <Input
                id="receivableInstallments"
                type="number"
                min="1"
                value={receivableForm.installments}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, installments: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="receivableDueDate">{t('finances.dialogs.receivable_due_date')}</Label>
              <Input
                id="receivableDueDate"
                type="date"
                value={receivableForm.dueDate}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="receivableProject">{t('finances.dialogs.receivable_project')}</Label>
              <Select value={receivableForm.projectId} onValueChange={(value) => setReceivableForm(prev => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.dialogs.select_project')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('finances.dialogs.none')}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="receivableDescription">{t('finances.dialogs.receivable_description')}</Label>
              <Input
                id="receivableDescription"
                value={receivableForm.description}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('finances.dialogs.receivable_description_placeholder')}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateReceivable} className="flex-1">
                {t('finances.dialogs.create')}
              </Button>
              <Button variant="outline" onClick={() => setIsReceivableDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Receivable Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finances.dialogs.mark_received_title')}: {selectedReceivable?.name}</DialogTitle>
            <DialogDescription>
              {t('finances.dialogs.confirm_received_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="receiveAccount">{t('finances.dialogs.deposit_account')}</Label>
              <Select value={receiveForm.accountId} onValueChange={(value) => setReceiveForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.dialogs.select_account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {formatAmount(account.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedReceivable && (
              <p className="text-sm text-muted-foreground">
                {t('finances.dialogs.receivable_amount')}: {formatAmount(selectedReceivable.amount)}
              </p>
            )}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleReceiveReceivable} className="flex-1">
                {t('finances.dialogs.confirm_receipt')}
              </Button>
              <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Debt Dialog */}
      <Dialog open={isPayDebtDialogOpen} onOpenChange={setIsPayDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finances.dialogs.pay_debt_title')}: {selectedDebt?.name}</DialogTitle>
            <DialogDescription>
              {t('finances.dialogs.pay_debt_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAccount">{t('finances.dialogs.debit_account')}</Label>
              <Select value={paymentForm.accountId} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.dialogs.select_account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {formatAmount(account.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentAmount">{t('finances.dialogs.payment_amount')}</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                max={selectedDebt?.remainingAmount}
              />
              {selectedDebt && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('finances.dialogs.remaining_amount')}: {formatAmount(selectedDebt.remainingAmount)}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handlePayDebt} className="flex-1">
                {t('finances.dialogs.confirm_payment')}
              </Button>
              <Button variant="outline" onClick={() => setIsPayDebtDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocate to Goal Dialog */}
      <Dialog open={isAllocateGoalDialogOpen} onOpenChange={setIsAllocateGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finances.dialogs.allocate_goal_title')}: {selectedGoal?.name}</DialogTitle>
            <DialogDescription>
              {t('finances.dialogs.allocate_goal_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="allocationAccount">{t('finances.dialogs.debit_account')}</Label>
              <Select value={allocationForm.accountId} onValueChange={(value) => setAllocationForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.dialogs.select_account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {formatAmount(account.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allocationAmount">{t('finances.dialogs.allocation_amount')}</Label>
              <Input
                id="allocationAmount"
                type="number"
                step="0.01"
                value={allocationForm.amount}
                onChange={(e) => setAllocationForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
              {selectedGoal && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('finances.dialogs.missing_amount')}: {formatAmount(selectedGoal.targetAmount - selectedGoal.currentAmount)}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAllocateToGoal} className="flex-1">
                {t('finances.dialogs.confirm_allocation')}
              </Button>
              <Button variant="outline" onClick={() => setIsAllocateGoalDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocate Advance Dialog */}
      <Dialog open={isAllocateAdvanceDialogOpen} onOpenChange={setIsAllocateAdvanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finances.dialogs.allocate_advance_title')}: {selectedDebt?.name}</DialogTitle>
            <DialogDescription>
              {t('finances.dialogs.allocate_advance_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('finances.dialogs.select_receivables')}
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {receivables.filter(r => r.status === 'pending').map((r) => (
                <div key={r.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`receivable-${r.id}`}
                    checked={selectedReceivableIds.includes(r.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedReceivableIds([...selectedReceivableIds, r.id]);
                      } else {
                        setSelectedReceivableIds(selectedReceivableIds.filter((id) => id !== r.id));
                      }
                    }}
                  />
                  <Label htmlFor={`receivable-${r.id}`} className="text-sm">
                    {r.name} - {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({t('finances.labels.due_date_short')}: {format(r.dueDate, "d MMM yyyy", { locale: getDateLocale() })})
                  </Label>
                </div>
              ))}
            </div>
            {selectedDebt && (
              <>
                <div>
                  <Label>{t('finances.dialogs.allocated_amount')}:</Label>
                  <p className="font-medium">
                    {selectedReceivableIds.reduce((sum, id) => sum + (receivables.find(r => r.id === id)?.amount || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <Label>{t('finances.dialogs.debt_after_allocation')}:</Label>
                  <p className="font-medium text-destructive">
                    {(selectedDebt.remainingAmount - selectedReceivableIds.reduce((sum, id) => sum + (receivables.find(r => r.id === id)?.amount || 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </>
            )}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAllocateAdvance} className="flex-1">
                {t('finances.dialogs.confirm_allocation')}
              </Button>
              <Button variant="outline" onClick={() => setIsAllocateAdvanceDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Debt Dialog */}
      <Dialog open={isEditDebtDialogOpen} onOpenChange={setIsEditDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finances.dialogs.edit_debt_title')}</DialogTitle>
            <DialogDescription>
              {t('finances.dialogs.edit_debt_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-debt-name">{t('finances.dialogs.debt_name')}</Label>
              <Input
                id="edit-debt-name"
                value={editDebtForm.name}
                onChange={(e) => setEditDebtForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('finances.dialogs.debt_name_placeholder')}
              />
            </div>
            <div>
              <Label htmlFor="edit-debt-total">{t('finances.dialogs.total_amount')}</Label>
              <Input
                id="edit-debt-total"
                type="number"
                step="0.01"
                value={editDebtForm.totalAmount}
                onChange={(e) => setEditDebtForm(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-debt-remaining">{t('finances.dialogs.remaining_amount_label')}</Label>
              <Input
                id="edit-debt-remaining"
                type="number"
                step="0.01"
                value={editDebtForm.remainingAmount}
                onChange={(e) => setEditDebtForm(prev => ({ ...prev, remainingAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-debt-due-date">{t('finances.dialogs.due_date_label')}</Label>
              <Input
                id="edit-debt-due-date"
                type="date"
                value={editDebtForm.dueDate}
                onChange={(e) => setEditDebtForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={async () => {
                  if (selectedDebt) {
                    await updateDebt(selectedDebt.id, {
                      name: editDebtForm.name,
                      totalAmount: editDebtForm.totalAmount,
                      remainingAmount: editDebtForm.remainingAmount,
                      dueDate: new Date(editDebtForm.dueDate)
                    });
                    setIsEditDebtDialogOpen(false);
                    setSelectedDebt(null);
                  }
                }}
                className="flex-1"
              >
                {t('finances.dialogs.save_changes')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDebtDialogOpen(false);
                  setSelectedDebt(null);
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Debt Confirmation Dialog */}
      <AlertDialog open={isDeleteDebtDialogOpen} onOpenChange={setIsDeleteDebtDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('finances.dialogs.delete_debt_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('finances.confirm_delete_debt', { name: selectedDebt?.name })} 
              {t('finances.dialogs.delete_debt_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDebtDialogOpen(false);
              setSelectedDebt(null);
            }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (selectedDebt) {
                  await deleteDebt(selectedDebt.id);
                  setIsDeleteDebtDialogOpen(false);
                  setSelectedDebt(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account Deletion Confirmation Dialog */}
      <AlertDialog 
        open={deleteAccountDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteAccountDialog({
              isOpen: false,
              account: null,
              hasTransactions: false,
              transactionCount: 0
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('finances.dialogs.delete_account_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAccountDialog.hasTransactions ? (
                <>
                  {t('finances.dialogs.delete_account_with_transactions', { count: deleteAccountDialog.transactionCount })}
                  <br /><br />
                  {t('finances.dialogs.delete_account_confirm')} "<strong>{deleteAccountDialog.account?.name}</strong>"?
                  <br /><br />
                  {t('finances.dialogs.delete_account_warning')}
                </>
              ) : (
                <>
                  {t('finances.confirm_delete_account', { name: deleteAccountDialog.account?.name })}
                  <br /><br />
                  {t('finances.dialogs.delete_account_simple')}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccountDialog.hasTransactions ? t('finances.dialogs.delete_account_and_transactions') : t('finances.dialogs.delete_account_only')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
}