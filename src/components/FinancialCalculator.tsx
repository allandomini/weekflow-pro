import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Calendar,
  Target,
  Wallet,
  PieChart,
  Lightbulb,
  CreditCard,
  ArrowRight,
  Percent
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SpendingCalculation {
  availableToday: number;
  availableAfterDebts: number;
  recommendedSpending: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface PartialReceivableAllocation {
  receivableId: string;
  receivableName: string;
  totalAmount: number;
  allocatedAmount: number;
  allocatedPercentage: number;
}

interface DebtPaymentRecommendation {
  debtId: string;
  debtName: string;
  currentAmount: number;
  recommendedPayment: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export default function FinancialCalculator() {
  const { t } = useTranslation();
  const { accounts, debts, receivables } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [calculation, setCalculation] = useState<SpendingCalculation | null>(null);
  const [partialAllocations, setPartialAllocations] = useState<PartialReceivableAllocation[]>([]);
  const [debtRecommendations, setDebtRecommendations] = useState<DebtPaymentRecommendation[]>([]);
  
  // Form states
  const [plannedExpense, setPlannedExpense] = useState('');
  const [debtToPay, setDebtToPay] = useState('');
  const [timeframe, setTimeframe] = useState('7'); // days
  const [includeReceivables, setIncludeReceivables] = useState(true);
  
  // Partial receivables form
  const [selectedReceivable, setSelectedReceivable] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('50');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryAllocationPercentage, setSalaryAllocationPercentage] = useState('30');

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const activeDebts = debts.filter(debt => debt.status === 'active');
  const totalActiveDebts = activeDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const pendingReceivables = receivables.filter(r => r.status === 'pending');
  const totalPendingReceivables = pendingReceivables.reduce((sum, r) => sum + r.amount, 0);

  const calculateSpending = () => {
    const plannedExpenseAmount = parseFloat(plannedExpense) || 0;
    const debtToPayAmount = parseFloat(debtToPay) || 0;
    const days = parseInt(timeframe);
    
    // Calculate available money
    let availableNow = totalBalance;
    let projectedIncome = includeReceivables ? totalPendingReceivables : 0;
    
    // Filter receivables by timeframe
    if (includeReceivables) {
      const futureDate = addDays(new Date(), days);
      projectedIncome = pendingReceivables
        .filter(r => r.dueDate <= futureDate)
        .reduce((sum, r) => sum + r.amount, 0);
    }
    
    const totalAvailable = availableNow + projectedIncome;
    const availableAfterDebts = totalAvailable - debtToPayAmount;
    const availableAfterExpense = availableAfterDebts - plannedExpenseAmount;
    
    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const debtRatio = totalActiveDebts / totalBalance;
    const expenseRatio = plannedExpenseAmount / totalAvailable;
    
    if (debtRatio > 0.7 || expenseRatio > 0.5 || availableAfterExpense < 0) {
      riskLevel = 'high';
    } else if (debtRatio > 0.4 || expenseRatio > 0.3 || availableAfterExpense < totalBalance * 0.2) {
      riskLevel = 'medium';
    }
    
    // Generate suggestions
    const suggestions: string[] = [];
    
    if (availableAfterExpense < 0) {
      suggestions.push(t('financial_calculator.suggestions.exceeds_resources'));
    }
    
    if (debtRatio > 0.5) {
      suggestions.push(t('financial_calculator.suggestions.prioritize_debts'));
    }
    
    if (expenseRatio > 0.4) {
      suggestions.push(t('financial_calculator.suggestions.evaluate_necessity'));
    }
    
    if (projectedIncome > plannedExpenseAmount * 2) {
      suggestions.push(t('financial_calculator.suggestions.future_income_covers'));
    }
    
    if (availableAfterExpense > totalBalance * 0.3) {
      suggestions.push(t('financial_calculator.suggestions.healthy_situation'));
    }
    
    const recommendedSpending = Math.max(0, totalAvailable * 0.3); // 30% of available money
    
    setCalculation({
      availableToday: totalBalance,
      availableAfterDebts: availableAfterDebts,
      recommendedSpending,
      riskLevel,
      suggestions
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <Calculator className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="w-4 h-4" />
          {t('financial_calculator.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {t('financial_calculator.intelligent_title')}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="spending" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="spending">{t('financial_calculator.tabs.planning')}</TabsTrigger>
            <TabsTrigger value="partial">{t('financial_calculator.tabs.partial_receivables')}</TabsTrigger>
            <TabsTrigger value="debt">{t('financial_calculator.tabs.debt_simulator')}</TabsTrigger>
            <TabsTrigger value="recommendations">{t('financial_calculator.tabs.recommendations')}</TabsTrigger>
            <TabsTrigger value="overview">{t('financial_calculator.tabs.overview')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="spending" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('financial_calculator.fields.calculation_parameters')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="plannedExpense">{t('financial_calculator.fields.planned_expense')}</Label>
                    <Input
                      id="plannedExpense"
                      type="number"
                      step="0.01"
                      value={plannedExpense}
                      onChange={(e) => setPlannedExpense(e.target.value)}
                      placeholder={t('financial_calculator.placeholders.planned_expense')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="debtToPay">{t('financial_calculator.fields.debt_to_pay')}</Label>
                    <Input
                      id="debtToPay"
                      type="number"
                      step="0.01"
                      value={debtToPay}
                      onChange={(e) => setDebtToPay(e.target.value)}
                      placeholder={t('financial_calculator.placeholders.debt_to_pay')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeframe">{t('financial_calculator.fields.timeframe')}</Label>
                    <Input
                      id="timeframe"
                      type="number"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      placeholder={t('financial_calculator.placeholders.timeframe')}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeReceivables"
                      checked={includeReceivables}
                      onChange={(e) => setIncludeReceivables(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="includeReceivables">
                      {t('financial_calculator.fields.include_receivables')}
                    </Label>
                  </div>
                  
                  <Button onClick={calculateSpending} className="w-full">
                    <Calculator className="w-4 h-4 mr-2" />
                    {t('financial_calculator.fields.calculate_viability')}
                  </Button>
                </CardContent>
              </Card>
              
              {calculation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {t('financial_calculator.fields.analysis_result')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium">{t('financial_calculator.fields.available_today')}</span>
                        <span className="font-bold text-blue-600">
                          {calculation.availableToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium">{t('financial_calculator.fields.after_debts')}</span>
                        <span className="font-bold text-purple-600">
                          {calculation.availableAfterDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">{t('financial_calculator.fields.recommended_spending')}</span>
                        <span className="font-bold text-green-600">
                          {calculation.recommendedSpending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${getRiskColor(calculation.riskLevel)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getRiskIcon(calculation.riskLevel)}
                        <span className="font-medium">
                          {t('financial_calculator.fields.risk_level')} {t(`financial_calculator.risk_levels.${calculation.riskLevel}`)}
                        </span>
                      </div>
                    </div>
                    
                    {calculation.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('financial_calculator.fields.recommendations_label')}</Label>
                        {calculation.suggestions.map((suggestion, index) => (
                          <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="partial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    {t('settings.partial_receivables.allocate_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="receivableSelect">{t('settings.partial_receivables.select_receivable')}</Label>
                    <Select value={selectedReceivable} onValueChange={setSelectedReceivable}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settings.partial_receivables.choose_receivable')} />
                      </SelectTrigger>
                      <SelectContent>
                        {pendingReceivables.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} - {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="allocationPercentage">{t('settings.partial_receivables.percentage_for_debts')}</Label>
                    <Input
                      id="allocationPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={allocationPercentage}
                      onChange={(e) => setAllocationPercentage(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const receivable = pendingReceivables.find(r => r.id === selectedReceivable);
                      if (receivable) {
                        const percentage = parseFloat(allocationPercentage) || 0;
                        const allocatedAmount = (receivable.amount * percentage) / 100;
                        
                        const newAllocation: PartialReceivableAllocation = {
                          receivableId: receivable.id,
                          receivableName: receivable.name,
                          totalAmount: receivable.amount,
                          allocatedAmount,
                          allocatedPercentage: percentage
                        };
                        
                        setPartialAllocations(prev => {
                          const filtered = prev.filter(a => a.receivableId !== receivable.id);
                          return [...filtered, newAllocation];
                        });
                      }
                    }}
                    className="w-full"
                    disabled={!selectedReceivable}
                  >
                    <PieChart className="w-4 h-4 mr-2" />
                    {t('settings.partial_receivables.add_allocation')}
                  </Button>
                  
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">{t('settings.partial_receivables.salary_fixed_income')}</Label>
                    <div className="space-y-2 mt-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={salaryAmount}
                        onChange={(e) => setSalaryAmount(e.target.value)}
                        placeholder="Ex: 3000.00"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={salaryAllocationPercentage}
                          onChange={(e) => setSalaryAllocationPercentage(e.target.value)}
                          placeholder="30"
                          className="w-20"
                        />
                        <span className="text-sm text-gray-600">{t('settings.partial_receivables.percentage_for_debts_short')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.partial_receivables.configured_allocations')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {partialAllocations.map((allocation) => (
                      <div key={allocation.receivableId} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{allocation.receivableName}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPartialAllocations(prev => 
                                prev.filter(a => a.receivableId !== allocation.receivableId)
                              );
                            }}
                          >
                            ×
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>{t('settings.partial_receivables.total')}</span>
                            <span>{allocation.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('settings.partial_receivables.allocated')} ({allocation.allocatedPercentage}%):</span>
                            <span className="font-medium text-blue-600">
                              {allocation.allocatedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('settings.partial_receivables.remaining')}</span>
                            <span className="text-green-600">
                              {(allocation.totalAmount - allocation.allocatedAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {salaryAmount && (
                      <div className="p-3 border rounded-lg bg-blue-50">
                        <h4 className="font-medium text-sm mb-2">{t('settings.partial_receivables.salary_fixed_income')}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>{t('settings.partial_receivables.value')}</span>
                            <span>{parseFloat(salaryAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('settings.partial_receivables.for_debts')} ({salaryAllocationPercentage}%):</span>
                            <span className="font-medium text-blue-600">
                              {((parseFloat(salaryAmount) || 0) * (parseFloat(salaryAllocationPercentage) || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {partialAllocations.length === 0 && !salaryAmount && (
                      <p className="text-center text-gray-500 py-4 text-sm">
                        {t('settings.partial_receivables.configure_partial_allocations')}
                      </p>
                    )}
                  </div>
                  
                  {(partialAllocations.length > 0 || salaryAmount) && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium mb-1">{t('settings.partial_receivables.total_available_for_debts')}</div>
                      <div className="text-lg font-bold text-green-600">
                        {(
                          partialAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) +
                          ((parseFloat(salaryAmount) || 0) * (parseFloat(salaryAllocationPercentage) || 0) / 100)
                        ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="debt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.debt_simulator.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeDebts.map((debt) => {
                    const daysUntilDue = Math.ceil((debt.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysUntilDue < 0;
                    
                    return (
                      <div key={debt.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{debt.name}</h4>
                          <Badge variant={isOverdue ? "destructive" : "secondary"}>
                            {isOverdue ? `${Math.abs(daysUntilDue)} ${t('settings.debt_simulator.days_overdue')}` : `${daysUntilDue} ${t('settings.debt_simulator.days_remaining')}`}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="text-lg font-bold text-red-600">
                            {debt.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {t('settings.debt_simulator.due_date')} {format(debt.dueDate, "d 'de' MMM yyyy", { locale: ptBR })}
                          </div>
                          {totalBalance >= debt.remainingAmount ? (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              {t('settings.debt_simulator.can_be_paid_today')}
                            </div>
                          ) : (
                            <div className="text-sm text-yellow-600 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              {t('settings.debt_simulator.insufficient_balance')} {(debt.remainingAmount - totalBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  {t('settings.recommendations.intelligent_payment_title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    const totalAllocated = partialAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) +
                      ((parseFloat(salaryAmount) || 0) * (parseFloat(salaryAllocationPercentage) || 0) / 100);
                    
                    const recommendations: DebtPaymentRecommendation[] = activeDebts.map(debt => {
                      const daysUntilDue = Math.ceil((debt.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntilDue < 0;
                      
                      let priority: 'high' | 'medium' | 'low' = 'medium';
                      let reason = t('settings.debt_reasons.default_payment');
                      
                      if (isOverdue) {
                        priority = 'high';
                        reason = t('settings.debt_reasons.overdue_days', { days: Math.abs(daysUntilDue) });
                      } else if (daysUntilDue <= 7) {
                        priority = 'high';
                        reason = t('settings.debt_reasons.due_in_days', { days: daysUntilDue });
                      } else if (daysUntilDue <= 30) {
                        priority = 'medium';
                        reason = t('settings.debt_reasons.due_in_days', { days: daysUntilDue });
                      } else {
                        priority = 'low';
                        reason = t('settings.debt_reasons.due_in_days', { days: daysUntilDue });
                      }
                      
                      // Calculate recommended payment based on available funds and priority
                      let recommendedPayment = 0;
                      if (priority === 'high') {
                        recommendedPayment = Math.min(debt.remainingAmount, totalAllocated * 0.6);
                      } else if (priority === 'medium') {
                        recommendedPayment = Math.min(debt.remainingAmount, totalAllocated * 0.3);
                      } else {
                        recommendedPayment = Math.min(debt.remainingAmount, totalAllocated * 0.1);
                      }
                      
                      return {
                        debtId: debt.id,
                        debtName: debt.name,
                        currentAmount: debt.remainingAmount,
                        recommendedPayment,
                        priority,
                        reason
                      };
                    }).sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 };
                      return priorityOrder[b.priority] - priorityOrder[a.priority];
                    });
                    
                    setDebtRecommendations(recommendations);
                  }}
                  className="mb-4"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {t('settings.recommendations.generate_recommendations')}
                </Button>
                
                {debtRecommendations.length > 0 && (
                  <div className="space-y-3">
                    {debtRecommendations.map((rec) => (
                      <div key={rec.debtId} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{rec.debtName}</h4>
                            <p className="text-sm text-gray-600">{rec.reason}</p>
                          </div>
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : 
                                   rec.priority === 'medium' ? 'default' : 'secondary'}
                          >
                            {t(`settings.recommendations.${rec.priority}_priority`)} {t('settings.recommendations.priority')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">{t('settings.recommendations.current_value')}</div>
                            <div className="font-medium text-red-600">
                              {rec.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">{t('settings.recommendations.recommended_payment')}</div>
                            <div className="font-medium text-blue-600">
                              {rec.recommendedPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">{t('settings.recommendations.would_remain')}</div>
                            <div className="font-medium text-green-600">
                              {(rec.currentAmount - rec.recommendedPayment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                        </div>
                        
                        {rec.recommendedPayment > 0 && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4" />
                              <span>
                                {t('settings.recommendations.reduction')} {((rec.recommendedPayment / rec.currentAmount) * 100).toFixed(1)}% {t('settings.recommendations.of_debt')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium mb-2">{t('settings.recommendations.recommendations_summary')}</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>{t('settings.recommendations.total_recommended')}</span>
                          <span className="font-medium">
                            {debtRecommendations.reduce((sum, r) => sum + r.recommendedPayment, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('settings.recommendations.available_resources')}</span>
                          <span className="font-medium">
                            {(
                              partialAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) +
                              ((parseFloat(salaryAmount) || 0) * (parseFloat(salaryAllocationPercentage) || 0) / 100)
                            ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>{t('settings.recommendations.estimated_surplus')}</span>
                          <span className="font-medium">
                            {Math.max(0, 
                              (partialAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) +
                               ((parseFloat(salaryAmount) || 0) * (parseFloat(salaryAllocationPercentage) || 0) / 100)) -
                              debtRecommendations.reduce((sum, r) => sum + r.recommendedPayment, 0)
                            ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {t('settings.overview.current_situation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-gray-600">{t('settings.overview.total_balance_accounts')}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t('settings.overview.active_debts')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {totalActiveDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-gray-600">{activeDebts.length} {t('settings.overview.pending_debts')}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {t('settings.overview.receivables')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {totalPendingReceivables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-gray-600">{pendingReceivables.length} {t('settings.overview.pending_receivables')}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('settings.overview.financial_summary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span>{t('settings.overview.net_worth')}</span>
                    <span className="font-bold text-green-600">
                      {(totalBalance - totalActiveDebts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span>{t('settings.overview.projected_worth')}</span>
                    <span className="font-bold text-blue-600">
                      {(totalBalance + totalPendingReceivables - totalActiveDebts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span>{t('settings.overview.debt_ratio')}</span>
                    <span className="font-bold text-yellow-600">
                      {totalBalance > 0 ? ((totalActiveDebts / totalBalance) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
