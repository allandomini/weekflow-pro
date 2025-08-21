import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Calculator,
  Plus,
  Minus,
  BarChart3,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { Investment, InvestmentTransaction } from "@/types";
import FinancialCalculators from "@/components/FinancialCalculators";

const Investments = () => {
  const { toast } = useToast();
  const { 
    investments, 
    createSimpleInvestment,
    addInvestment, 
    deleteInvestment, 
    updateStockPrice,
    investmentGoals,
    addInvestmentGoal,
    addInvestmentTransaction,
    investmentTransactions,
    loading
  } = useAppContext();

  const [newInvestment, setNewInvestment] = useState({
    type: 'stock' as const,
    name: '',
    symbol: '',
    quantity: 0,
    avgPrice: 0,
    currentPrice: 0,
    sector: ''
  });

  const [calculatorValues, setCalculatorValues] = useState({
    initialAmount: 1000,
    monthlyAmount: 500,
    interestRate: 12,
    timeInYears: 5
  });

  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    category: 'investment' as const
  });

  const [newTransaction, setNewTransaction] = useState({
    investmentId: '',
    type: 'buy' as 'buy' | 'sell',
    quantity: 0,
    price: 0,
    fees: 0,
    notes: ''
  });

  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercent = (totalProfitLoss / totalInvested) * 100;

  const calculateCompoundInterest = () => {
    const { initialAmount, monthlyAmount, interestRate, timeInYears } = calculatorValues;
    const monthlyRate = interestRate / 100 / 12;
    const months = timeInYears * 12;
    
    // Valor futuro do investimento inicial
    const futureValueInitial = initialAmount * Math.pow(1 + monthlyRate, months);
    
    // Valor futuro dos aportes mensais
    const futureValueMonthly = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    
    const totalFutureValue = futureValueInitial + futureValueMonthly;
    const totalInvested = initialAmount + (monthlyAmount * months);
    const totalReturn = totalFutureValue - totalInvested;
    
    return {
      totalFutureValue: totalFutureValue.toFixed(2),
      totalInvested: totalInvested.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      returnPercent: ((totalReturn / totalInvested) * 100).toFixed(2)
    };
  };

  const handleAddInvestment = async () => {
    if (!newInvestment.name || !newInvestment.symbol || newInvestment.quantity <= 0 || newInvestment.avgPrice <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente",
        variant: "destructive"
      });
      return;
    }

    try {
      await createSimpleInvestment({
        ...newInvestment,
        currentPrice: newInvestment.currentPrice || newInvestment.avgPrice,
        purchaseDate: new Date()
      });
      
      setNewInvestment({
        type: 'stock',
        name: '',
        symbol: '',
        quantity: 0,
        avgPrice: 0,
        currentPrice: 0,
        sector: ''
      });
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente",
        variant: "destructive"
      });
      return;
    }

    try {
      await addInvestmentGoal({
        ...newGoal,
        targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined,
        isCompleted: false
      });
      
      setNewGoal({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: '',
        category: 'investment'
      });
      
      toast({
        title: "Sucesso",
        description: "Meta adicionada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar meta",
        variant: "destructive"
      });
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.investmentId || newTransaction.quantity <= 0 || newTransaction.price <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente",
        variant: "destructive"
      });
      return;
    }

    try {
      await addInvestmentTransaction({
        investmentId: newTransaction.investmentId,
        type: newTransaction.type,
        quantity: newTransaction.quantity,
        price: newTransaction.price,
        fees: newTransaction.fees,
        transactionDate: new Date(),
        notes: newTransaction.notes
      });
      
      setNewTransaction({
        investmentId: '',
        type: 'buy',
        quantity: 0,
        price: 0,
        fees: 0,
        notes: ''
      });
      
      setShowTransactionForm(false);
      
      toast({
        title: "Sucesso",
        description: `Transação de ${newTransaction.type === 'buy' ? 'compra' : 'venda'} registrada com sucesso!`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar transação",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      await deleteInvestment(id);
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const compoundResult = calculateCompoundInterest();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-muted-foreground">
            Gerencie sua carteira de investimentos e calcule rendimentos
          </p>
        </div>
      </div>

      {/* Dashboard Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Investido</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro/Prejuízo</CardTitle>
            {totalProfitLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {Math.abs(totalProfitLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfitLoss >= 0 ? '+' : '-'}{Math.abs(totalProfitLossPercent).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {investments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              ativos em carteira
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="portfolio">Carteira</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="calculator">Calculadora</TabsTrigger>
          <TabsTrigger value="calculators">Calculadoras</TabsTrigger>
          <TabsTrigger value="homebroker">Homebroker</TabsTrigger>
        </TabsList>

        {/* Tab Carteira */}
        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Minha Carteira</CardTitle>
              <CardDescription>
                Acompanhe o desempenho dos seus investimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando investimentos...</p>
                  </div>
                ) : investments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum investimento encontrado.</p>
                    <p className="text-sm text-muted-foreground mt-2">Adicione seu primeiro investimento na aba "Homebroker".</p>
                  </div>
                ) : (
                  investments.map((investment) => (
                    <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{investment.name}</h3>
                          <Badge variant="secondary">{investment.symbol}</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Quantidade</p>
                            <p className="font-medium">{investment.quantity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Preço Médio</p>
                            <p className="font-medium">R$ {investment.avgPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Preço Atual</p>
                            <p className="font-medium">R$ {investment.currentPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Lucro/Prejuízo</p>
                            <p className={`font-medium ${investment.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {investment.profitLoss >= 0 ? '+' : ''}R$ {investment.profitLoss.toFixed(2)} ({investment.profitLossPercent.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvestment(investment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Transações */}
        <TabsContent value="transactions">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nova Transação</CardTitle>
                <CardDescription>
                  Registre compras e vendas para cálculo automático do preço médio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transactionSymbol">Símbolo/Ativo</Label>
                    <Input
                      id="transactionSymbol"
                      placeholder="Ex: PETR4, VALE3"
                      value={newTransaction.investmentId}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, investmentId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transactionType">Tipo</Label>
                    <select
                      id="transactionType"
                      className="w-full p-2 border rounded-md"
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as 'buy' | 'sell' }))}
                    >
                      <option value="buy">Compra</option>
                      <option value="sell">Venda</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="transactionQuantity">Quantidade</Label>
                    <Input
                      id="transactionQuantity"
                      type="number"
                      value={newTransaction.quantity}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transactionPrice">Preço (R$)</Label>
                    <Input
                      id="transactionPrice"
                      type="number"
                      step="0.01"
                      value={newTransaction.price}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transactionFees">Taxas (R$)</Label>
                    <Input
                      id="transactionFees"
                      type="number"
                      step="0.01"
                      value={newTransaction.fees}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, fees: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transactionNotes">Observações</Label>
                    <Input
                      id="transactionNotes"
                      placeholder="Observações opcionais"
                      value={newTransaction.notes}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddTransaction} className="w-full mt-4">
                  Registrar Transação
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Todas as operações de compra e venda registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investmentTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhuma transação registrada.</p>
                    </div>
                  ) : (
                    investmentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={transaction.type === 'buy' ? 'default' : 'destructive'}>
                              {transaction.type === 'buy' ? 'Compra' : 'Venda'}
                            </Badge>
                            <span className="font-semibold">{transaction.investmentId}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Quantidade</p>
                              <p className="font-medium">{transaction.quantity}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Preço</p>
                              <p className="font-medium">R$ {transaction.price.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium">R$ {transaction.totalAmount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Data</p>
                              <p className="font-medium">{transaction.createdAt.toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          {transaction.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{transaction.notes}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Calculadoras */}
        <TabsContent value="calculators">
          <FinancialCalculators />
        </TabsContent>

        {/* Tab Calculadora Original */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Juros Compostos</CardTitle>
              <CardDescription>
                Simule o crescimento dos seus investimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="initialAmount">Valor Inicial (R$)</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    value={calculatorValues.initialAmount}
                    onChange={(e) => setCalculatorValues(prev => ({ 
                      ...prev, 
                      initialAmount: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyAmount">Aporte Mensal (R$)</Label>
                  <Input
                    id="monthlyAmount"
                    type="number"
                    value={calculatorValues.monthlyAmount}
                    onChange={(e) => setCalculatorValues(prev => ({ 
                      ...prev, 
                      monthlyAmount: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="interestRate">Taxa de Juros Anual (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={calculatorValues.interestRate}
                    onChange={(e) => setCalculatorValues(prev => ({ 
                      ...prev, 
                      interestRate: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="timeInYears">Tempo (anos)</Label>
                  <Input
                    id="timeInYears"
                    type="number"
                    value={calculatorValues.timeInYears}
                    onChange={(e) => setCalculatorValues(prev => ({ 
                      ...prev, 
                      timeInYears: Number(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-2">Resultado da Simulação:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Valor Final</p>
                    <p className="text-xl font-bold text-green-600">
                      {compoundResult.totalFutureValue}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Investido</p>
                    <p className="text-xl font-bold">
                      {compoundResult.totalInvested}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Juros Ganhos</p>
                    <p className="text-xl font-bold text-blue-600">
                      {compoundResult.totalReturn}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rendimento</p>
                    <p className="text-xl font-bold">
                      {compoundResult.returnPercent}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Homebroker */}
        <TabsContent value="homebroker">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Investimento</CardTitle>
              <CardDescription>
                Registre um novo ativo em sua carteira
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investmentName">Nome do Investimento</Label>
                  <Input
                    id="investmentName"
                    placeholder="Ex: Petrobras"
                    value={newInvestment.name}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="investmentSymbol">Símbolo</Label>
                  <Input
                    id="investmentSymbol"
                    placeholder="Ex: PETR4"
                    value={newInvestment.symbol}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      symbol: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="investmentQuantity">Quantidade</Label>
                  <Input
                    id="investmentQuantity"
                    type="number"
                    value={newInvestment.quantity}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      quantity: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="investmentPrice">Preço de Compra (R$)</Label>
                  <Input
                    id="investmentPrice"
                    type="number"
                    step="0.01"
                    value={newInvestment.avgPrice}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      avgPrice: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="investmentCurrentPrice">Preço Atual (R$)</Label>
                  <Input
                    id="investmentCurrentPrice"
                    type="number"
                    step="0.01"
                    value={newInvestment.currentPrice}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      currentPrice: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="investmentSector">Setor</Label>
                  <Input
                    id="investmentSector"
                    placeholder="Ex: Petróleo e Gás"
                    value={newInvestment.sector}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      sector: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddInvestment} 
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : 'Adicionar Investimento'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Investments;
