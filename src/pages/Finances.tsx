import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Account, Debt, Goal } from "@/types";

export default function Finances() {
  const { 
    accounts, 
    transactions, 
    debts, 
    goals, 
    addAccount, 
    addTransaction, 
    addDebt, 
    addGoal,
    updateDebt,
    updateGoal,
    payDebt,
    allocateToGoal
  } = useApp();

  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isPayDebtDialogOpen, setIsPayDebtDialogOpen] = useState(false);
  const [isAllocateGoalDialogOpen, setIsAllocateGoalDialogOpen] = useState(false);

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const [accountForm, setAccountForm] = useState({
    name: "",
    balance: "",
    type: "checking" as Account['type']
  });

  const [transactionForm, setTransactionForm] = useState({
    accountId: "",
    type: "deposit" as "deposit" | "withdrawal",
    amount: "",
    description: ""
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

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalDebts = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalGoals = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

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

  const handleCreateTransaction = () => {
    if (!transactionForm.accountId || !transactionForm.amount || !transactionForm.description) return;

    addTransaction({
      accountId: transactionForm.accountId,
      type: transactionForm.type,
      amount: parseFloat(transactionForm.amount),
      description: transactionForm.description,
      date: new Date()
    });

    setTransactionForm({ accountId: "", type: "deposit", amount: "", description: "" });
    setIsTransactionDialogOpen(false);
  };

  const handleCreateDebt = () => {
    if (!debtForm.name.trim() || !debtForm.totalAmount || !debtForm.dueDate) return;

    const amount = parseFloat(debtForm.totalAmount);
    addDebt({
      name: debtForm.name,
      totalAmount: amount,
      remainingAmount: amount,
      dueDate: new Date(debtForm.dueDate)
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

  const getAccountById = (accountId: string) => {
    return accounts.find(a => a.id === accountId);
  };

  const getAccountTransactions = (accountId: string) => {
    return transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  return (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle className="text-sm font-medium">Dívidas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {debts.length} dívida{debts.length !== 1 ? 's' : ''}
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
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="debts">Dívidas</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
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
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Últimas Transações
                      </h4>
                      <div className="space-y-2">
                        {getAccountTransactions(account.id).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border">
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
                            <div className={`font-medium ${
                              transaction.type === 'deposit' ? 'text-success' : 'text-destructive'
                            }`}>
                              {transaction.type === 'deposit' ? '+' : '-'}
                              {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
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
                        <div className={`font-medium ${
                          transaction.type === 'deposit' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'}
                          {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsDebtDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Dívida
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {debts.map((debt) => {
                const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
                return (
                  <Card key={debt.id} className="shadow-elegant">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-destructive" />
                        {debt.name}
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
      </Tabs>

      {/* Dialogs */}
      {/* Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
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
              <Button onClick={handleCreateAccount} className="flex-1">
                Criar Conta
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
            <DialogTitle>Nova Transação</DialogTitle>
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
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateTransaction} className="flex-1">
                Criar Transação
              </Button>
              <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
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
            <DialogTitle>Nova Dívida</DialogTitle>
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
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateDebt} className="flex-1">
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

      {/* Pay Debt Dialog */}
      <Dialog open={isPayDebtDialogOpen} onOpenChange={setIsPayDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Dívida: {selectedDebt?.name}</DialogTitle>
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
    </div>
  );
}