import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { ptBR } from 'date-fns/locale';
import { Account, Transaction, Debt, Goal, Receivable } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
    updateDebt,
    deleteDebt,
    deleteReceivable
  } = useAppContext();

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
    if (!transactionForm.accountId || !transactionForm.amount || !transactionForm.description) return;

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

  const handleSaveTransaction = () => {
    if (!editingTransaction) return;
    if (!transactionForm.accountId || !transactionForm.amount || !transactionForm.description) return;

    // TODO: Implement updateTransaction in context
    // updateTransaction(editingTransaction.id, {
    //   accountId: transactionForm.accountId,
    //   type: transactionForm.type,
    //   amount: parseFloat(transactionForm.amount),
    //   description: `${transactionForm.description}${transactionForm.category ? ` • ${transactionForm.category}` : ""}`,
    // });

    setEditingTransaction(null);
    setTransactionForm({ accountId: "", type: "deposit", amount: "", description: "", category: "general" });
    setIsTransactionDialogOpen(false);
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

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      // TODO: Implement deleteTransaction in context
      // Delete transaction: id
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
      alert('Saldo insuficiente na conta selecionada');
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
      alert('Saldo insuficiente na conta selecionada');
      return;
    }

    allocateToGoal(selectedGoal.id, allocationForm.accountId, amount);
    setAllocationForm({ accountId: "", amount: "" });
    setIsAllocateGoalDialogOpen(false);
    setSelectedGoal(null);
  };

  const handleAllocateAdvance = () => {
    if (!selectedDebt) return;
    updateDebt(selectedDebt.id, { ...selectedDebt, allocatedReceivableIds: selectedReceivableIds });
    setIsAllocateAdvanceDialogOpen(false);
    setSelectedReceivableIds([]);
    setSelectedDebt(null);
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
            <h1 className="text-3xl font-bold text-foreground">Finanças</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas, dívidas e metas
            </p>
          </div>
        <div className="flex gap-2">
          <FinancialCalculator />
          <Button variant="outline" onClick={() => setIsAccountDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
          <Button variant="gradient" onClick={() => setIsTransactionDialogOpen(true)} className="animate-glow">
            <Plus className="w-4 h-4 mr-2" />
            Transação
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dívidas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalActiveDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeDebts.length} ativa{activeDebts.length !== 1 ? 's' : ''}
              {overdueDebts.length > 0 && (
                <span className="text-red-600 ml-1">• {overdueDebts.length} atrasada{overdueDebts.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Líquido</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netWorth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {netWorth >= 0 ? 'Situação positiva' : 'Necessita atenção'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {totalGoals.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {goals.length} meta{goals.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {totalReceivablesPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {receivables.filter(r => r.status === 'pending').length} pendente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="debts">Dívidas</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="receivables">A Receber</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
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
                      {account.type === 'checking' ? 'Corrente' : 
                       account.type === 'savings' ? 'Poupança' : 'Investimento'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-primary">
                      {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingAccount(account);
                        setAccountForm({ name: account.name, balance: String(account.balance), type: account.type });
                        setIsAccountDialogOpen(true);
                      }}>Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm('Excluir conta?')) {
                          // @ts-ignore added in context
                          typeof deleteAccount === 'function' && deleteAccount(account.id);
                        }
                      }}>Excluir</Button>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Últimas Transações
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
                          {format(transaction.date, "d 'de' MMM", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`font-medium ${
                        transaction.type === 'deposit' ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Ações">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditTransaction(transaction)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteTransaction(transaction.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                        {getAccountTransactions(account.id).length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">
                            Nenhuma transação encontrada
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
              <CardTitle>Histórico de Transações</CardTitle>
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
                              {account?.name} • {format(transaction.date, "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`font-medium ${
                            transaction.type === 'deposit' ? 'text-success' : 'text-destructive'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Ações">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditTransaction(transaction)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteTransaction(transaction.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                {transactions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada
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
                  {activeDebts.length} Ativa{activeDebts.length !== 1 ? 's' : ''}
                </Badge>
                {overdueDebts.length > 0 && (
                  <Badge variant="destructive">
                    {overdueDebts.length} Atrasada{overdueDebts.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {paidDebts.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {paidDebts.length} Paga{paidDebts.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <Button onClick={() => setIsDebtDialogOpen(true)} className="gap-2">
                <Receipt className="w-4 h-4" />
                Nova Dívida
              </Button>
            </div>
            
            {/* Active and Overdue Debts */}
            {(activeDebts.length > 0 || overdueDebts.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  Dívidas Pendentes
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
                              {Math.abs(daysUntilDue)} dias atrasado
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
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedDebt(debt);
                                setIsDeleteDebtDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Valor Restante</span>
                            <span className="font-medium">{progress.toFixed(0)}% pago</span>
                          </div>
                          <div className="text-xl font-bold text-destructive mb-2">
                            {debt.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            de {debt.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                            <span>Valor Projetado Restante</span>
                          </div>
                          <div className="text-xl font-bold text-destructive mb-2">
                            {projectedRemaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Vence em {format(debt.dueDate, "d 'de' MMM yyyy", { locale: ptBR })}
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setIsPayDebtDialogOpen(true);
                          }}
                        >
                          Fazer Pagamento
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
                          Alocar Adiantamento
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
                  Dívidas Quitadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paidDebts.map((debt) => {
                    const paidDate = debt.paidAt || debt.updatedAt;
                    return (
                      <Card key={debt.id} className="shadow-elegant border-green-200 bg-green-50">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="text-green-800">{debt.name}</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                QUITADA
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-xl font-bold text-green-700">
                              {debt.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className="text-sm text-green-600">
                              Valor total quitado
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Calendar className="w-4 h-4" />
                              Paga em {format(paidDate, "d 'de' MMM yyyy", { locale: ptBR })}
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
                Nova Meta
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
                            <span>Progresso</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="text-xl font-bold text-warning mb-2">
                            {goal.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            de {goal.targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                            Meta para {format(goal.targetDate, "d 'de' MMM yyyy", { locale: ptBR })}
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
                          Alocar Dinheiro
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
                Novo A Receber
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
                          {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Vencimento: {format(r.dueDate, "d 'de' MMM yyyy", { locale: ptBR })}
                        </div>
                        {r.description && (
                          <div className="text-sm text-muted-foreground mt-1">{r.description}</div>
                        )}
                        {r.status === 'received' && r.receivedAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Recebido em {format(r.receivedAt, "d 'de' MMM yyyy", { locale: ptBR })}
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
                            Marcar como Recebido
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          onClick={() => deleteReceivable(r.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {receivables.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum registro</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab (quick insights) */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Fluxo Líquido (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {(
                    transactions.filter(t=>Date.now()-t.date.getTime()<=30*24*60*60*1000)
                      .reduce((sum,t)=>sum + (t.type==='deposit'? t.amount : -t.amount),0)
                  ).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                </p>
                <p className="text-sm text-muted-foreground">Entradas - Saídas</p>
              </CardContent>
            </Card>
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Maior Despesa Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {(() => {
                    const w = transactions.filter(t=>t.type==='withdrawal').sort((a,b)=>b.amount-a.amount)[0]
                    return w ? w.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'
                  })()}
                </p>
                <p className="text-sm text-muted-foreground">Ponto de atenção para reduzir custos</p>
              </CardContent>
            </Card>
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Recebíveis Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalReceivablesPending.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
                <p className="text-sm text-muted-foreground">Planeje o caixa com base no que entra</p>
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
            <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Edite as informações da conta selecionada.' : 'Crie uma nova conta bancária para gerenciar seus recursos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountName">Nome da Conta</Label>
              <Input
                id="accountName"
                value={accountForm.name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Conta Corrente Banco X"
              />
            </div>
            <div>
              <Label htmlFor="accountBalance">Saldo Inicial</Label>
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
              <Label htmlFor="accountType">Tipo de Conta</Label>
              <Select value={accountForm.type} onValueChange={(value: Account['type']) => setAccountForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={editingAccount ? handleSaveAccount : handleCreateAccount} className="flex-1">
                {editingAccount ? 'Salvar' : 'Criar Conta'}
              </Button>
              <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? 'Atualize os dados da transação selecionada.'
                : 'Registre uma nova transação financeira (depósito ou retirada) em uma de suas contas.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionAccount">Conta</Label>
              <Select value={transactionForm.accountId} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
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
              <Label htmlFor="transactionType">Tipo</Label>
              <Select value={transactionForm.type} onValueChange={(value: "deposit" | "withdrawal") => setTransactionForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Depósito</SelectItem>
                  <SelectItem value="withdrawal">Retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionCategory">Categoria</Label>
              <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="salario">Salário</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="moradia">Moradia</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="lazer">Lazer</SelectItem>
                  <SelectItem value="impostos">Impostos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionAmount">Valor</Label>
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
              <Label htmlFor="transactionDescription">Descrição</Label>
              <Input
                id="transactionDescription"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da transação"
              />
            </div>
            <div>
              <Label>Categorias rápidas</Label>
              <div className="flex flex-wrap gap-2 text-xs">
                {['salario','venda','alimentacao','moradia','transporte','saude','lazer','impostos','outros'].map(cat => (
                  <button key={cat} type="button" className={`px-2 py-1 rounded border ${transactionForm.category===cat? 'bg-accent' : ''}`} onClick={() => setTransactionForm(prev => ({...prev, category: cat}))}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              {editingTransaction ? (
                <Button onClick={handleSaveTransaction} className="flex-1">
                  Salvar Alterações
                </Button>
              ) : (
                <Button onClick={handleCreateTransaction} className="flex-1">
                  Criar Transação
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
                Cancelar
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
              Nova Dívida
            </DialogTitle>
            <DialogDescription>
              Registre uma nova dívida ou compromisso financeiro. O sistema automaticamente detectará se está em atraso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="debtName">Nome da Dívida</Label>
              <Input
                id="debtName"
                value={debtForm.name}
                onChange={(e) => setDebtForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Cartão de Crédito"
              />
            </div>
            <div>
              <Label htmlFor="debtAmount">Valor Total</Label>
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
              <Label htmlFor="debtDueDate">Data de Vencimento</Label>
              <Input
                id="debtDueDate"
                type="date"
                value={debtForm.dueDate}
                onChange={(e) => setDebtForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
              💡 <strong>Dica:</strong> Dívidas com vencimento anterior a hoje serão marcadas como "em atraso" automaticamente.
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateDebt} className="flex-1 gap-2">
                <Receipt className="w-4 h-4" />
                Criar Dívida
              </Button>
              <Button variant="outline" onClick={() => setIsDebtDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
            <DialogDescription>
              Defina uma meta financeira com valor alvo e data opcional para acompanhar seu progresso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goalName">Nome da Meta</Label>
              <Input
                id="goalName"
                value={goalForm.name}
                onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Viagem de Férias"
              />
            </div>
            <div>
              <Label htmlFor="goalAmount">Valor Alvo</Label>
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
              <Label htmlFor="goalDate">Data Alvo (Opcional)</Label>
              <Input
                id="goalDate"
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateGoal} className="flex-1">
                Criar Meta
              </Button>
              <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receivable Dialog */}
      <Dialog open={isReceivableDialogOpen} onOpenChange={setIsReceivableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo A Receber</DialogTitle>
            <DialogDescription>
              Registre um valor que você deve receber, incluindo parcelas e projeto associado se aplicável.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="receivableName">Nome</Label>
              <Input
                id="receivableName"
                value={receivableForm.name}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Fatura Cliente X"
              />
            </div>
            <div>
              <Label htmlFor="receivableAmount">Valor</Label>
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
              <Label htmlFor="receivableInstallments">Parcelas</Label>
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
              <Label htmlFor="receivableDueDate">Data de Vencimento</Label>
              <Input
                id="receivableDueDate"
                type="date"
                value={receivableForm.dueDate}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="receivableProject">Projeto (opcional)</Label>
              <Select value={receivableForm.projectId} onValueChange={(value) => setReceivableForm(prev => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="receivableDescription">Descrição (opcional)</Label>
              <Input
                id="receivableDescription"
                value={receivableForm.description}
                onChange={(e) => setReceivableForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateReceivable} className="flex-1">
                Criar
              </Button>
              <Button variant="outline" onClick={() => setIsReceivableDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Receivable Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Recebido: {selectedReceivable?.name}</DialogTitle>
            <DialogDescription>
              Confirme o recebimento deste valor e selecione a conta para depósito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="receiveAccount">Conta para Depósito</Label>
              <Select value={receiveForm.accountId} onValueChange={(value) => setReceiveForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedReceivable && (
              <p className="text-sm text-muted-foreground">
                Valor: {selectedReceivable.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleReceiveReceivable} className="flex-1">
                Confirmar Recebimento
              </Button>
              <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Debt Dialog */}
      <Dialog open={isPayDebtDialogOpen} onOpenChange={setIsPayDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Dívida: {selectedDebt?.name}</DialogTitle>
            <DialogDescription>
              Registre o pagamento de uma dívida selecionando a conta de débito e o valor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAccount">Conta para Débito</Label>
              <Select value={paymentForm.accountId} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentAmount">Valor do Pagamento</Label>
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
                  Valor restante: {selectedDebt.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handlePayDebt} className="flex-1">
                Confirmar Pagamento
              </Button>
              <Button variant="outline" onClick={() => setIsPayDebtDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocate to Goal Dialog */}
      <Dialog open={isAllocateGoalDialogOpen} onOpenChange={setIsAllocateGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alocar para Meta: {selectedGoal?.name}</DialogTitle>
            <DialogDescription>
              Aloque dinheiro de uma conta para contribuir com sua meta financeira.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="allocationAccount">Conta para Débito</Label>
              <Select value={allocationForm.accountId} onValueChange={(value) => setAllocationForm(prev => ({ ...prev, accountId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allocationAmount">Valor a Alocar</Label>
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
                  Faltam: {(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAllocateToGoal} className="flex-1">
                Confirmar Alocação
              </Button>
              <Button variant="outline" onClick={() => setIsAllocateGoalDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocate Advance Dialog */}
      <Dialog open={isAllocateAdvanceDialogOpen} onOpenChange={setIsAllocateAdvanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alocar Adiantamento para: {selectedDebt?.name}</DialogTitle>
            <DialogDescription>
              Selecione os valores a receber para alocar como adiantamento no pagamento desta dívida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione os valores a receber para alocar como adiantamento.
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
                    {r.name} - {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Vence: {format(r.dueDate, "d 'de' MMM yyyy", { locale: ptBR })})
                  </Label>
                </div>
              ))}
            </div>
            {selectedDebt && (
              <>
                <div>
                  <Label>Valor Alocado:</Label>
                  <p className="font-medium">
                    {selectedReceivableIds.reduce((sum, id) => sum + (receivables.find(r => r.id === id)?.amount || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <Label>Dívida Após Alocação:</Label>
                  <p className="font-medium text-destructive">
                    {(selectedDebt.remainingAmount - selectedReceivableIds.reduce((sum, id) => sum + (receivables.find(r => r.id === id)?.amount || 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </>
            )}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAllocateAdvance} className="flex-1">
                Confirmar Alocação
              </Button>
              <Button variant="outline" onClick={() => setIsAllocateAdvanceDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Debt Dialog */}
      <Dialog open={isEditDebtDialogOpen} onOpenChange={setIsEditDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dívida</DialogTitle>
            <DialogDescription>
              Edite os detalhes da dívida selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-debt-name">Nome da Dívida</Label>
              <Input
                id="edit-debt-name"
                value={editDebtForm.name}
                onChange={(e) => setEditDebtForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da dívida"
              />
            </div>
            <div>
              <Label htmlFor="edit-debt-total">Valor Total</Label>
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
              <Label htmlFor="edit-debt-remaining">Valor Restante</Label>
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
              <Label htmlFor="edit-debt-due-date">Data de Vencimento</Label>
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
                Salvar Alterações
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDebtDialogOpen(false);
                  setSelectedDebt(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Debt Confirmation Dialog */}
      <AlertDialog open={isDeleteDebtDialogOpen} onOpenChange={setIsDeleteDebtDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Dívida</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a dívida "{selectedDebt?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDebtDialogOpen(false);
              setSelectedDebt(null);
            }}>
              Cancelar
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
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
}