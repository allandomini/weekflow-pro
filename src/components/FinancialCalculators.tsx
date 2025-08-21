import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign, CreditCard } from "lucide-react";
import { LoanCalculation, CompoundInterestCalculation, AmortizationEntry } from "@/types";

const FinancialCalculators = () => {
  // Calculadora Básica
  const [basicCalc, setBasicCalc] = useState({
    display: '0',
    previousValue: null as number | null,
    operation: null as string | null,
    waitingForNewValue: false
  });

  // Calculadora de Juros Compostos
  const [compoundCalc, setCompoundCalc] = useState({
    principal: 1000,
    monthlyContribution: 100,
    annualRate: 12,
    years: 5,
    compoundingFrequency: 12
  });

  // Simulador de Empréstimo
  const [loanCalc, setLoanCalc] = useState({
    principal: 100000,
    annualRate: 12,
    termYears: 5
  });

  // Simulador de Parcelas
  const [installmentCalc, setInstallmentCalc] = useState({
    totalAmount: 5000,
    installments: 12,
    interestRate: 2.5
  });

  const [results, setResults] = useState({
    compound: null as CompoundInterestCalculation | null,
    loan: null as LoanCalculation | null,
    installment: null as any
  });

  // Funções da Calculadora Básica
  const handleBasicInput = (value: string) => {
    if (basicCalc.waitingForNewValue) {
      setBasicCalc(prev => ({
        ...prev,
        display: value,
        waitingForNewValue: false
      }));
    } else {
      setBasicCalc(prev => ({
        ...prev,
        display: prev.display === '0' ? value : prev.display + value
      }));
    }
  };

  const handleBasicOperation = (nextOperation: string) => {
    const inputValue = parseFloat(basicCalc.display);

    if (basicCalc.previousValue === null) {
      setBasicCalc(prev => ({
        ...prev,
        previousValue: inputValue,
        operation: nextOperation,
        waitingForNewValue: true
      }));
    } else if (basicCalc.operation) {
      const currentValue = basicCalc.previousValue || 0;
      const newValue = calculate(currentValue, inputValue, basicCalc.operation);

      setBasicCalc({
        display: String(newValue),
        previousValue: newValue,
        operation: nextOperation,
        waitingForNewValue: true
      });
    }
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '*': return firstValue * secondValue;
      case '/': return firstValue / secondValue;
      case '%': return firstValue % secondValue;
      default: return secondValue;
    }
  };

  const handleBasicEquals = () => {
    const inputValue = parseFloat(basicCalc.display);

    if (basicCalc.previousValue !== null && basicCalc.operation) {
      const newValue = calculate(basicCalc.previousValue, inputValue, basicCalc.operation);
      setBasicCalc({
        display: String(newValue),
        previousValue: null,
        operation: null,
        waitingForNewValue: true
      });
    }
  };

  const handleBasicClear = () => {
    setBasicCalc({
      display: '0',
      previousValue: null,
      operation: null,
      waitingForNewValue: false
    });
  };

  // Cálculo de Juros Compostos
  const calculateCompoundInterest = () => {
    const { principal, monthlyContribution, annualRate, years, compoundingFrequency } = compoundCalc;
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;
    
    // Valor futuro com contribuições mensais
    let futureValue = principal;
    let totalContributions = principal;
    
    for (let month = 1; month <= totalMonths; month++) {
      futureValue = futureValue * (1 + monthlyRate) + monthlyContribution;
      totalContributions += monthlyContribution;
    }
    
    const totalInterest = futureValue - totalContributions;

    const result: CompoundInterestCalculation = {
      principal,
      monthlyContribution,
      annualRate,
      years,
      compoundingFrequency,
      futureValue: Math.round(futureValue * 100) / 100,
      totalContributions,
      totalInterest: Math.round(totalInterest * 100) / 100
    };

    setResults(prev => ({ ...prev, compound: result }));
  };

  // Cálculo de Empréstimo
  const calculateLoan = () => {
    const { principal, annualRate, termYears } = loanCalc;
    const monthlyRate = annualRate / 100 / 12;
    const termMonths = termYears * 12;
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    const totalAmount = monthlyPayment * termMonths;
    const totalInterest = totalAmount - principal;

    // Tabela de amortização
    const amortizationSchedule: AmortizationEntry[] = [];
    let balance = principal;

    for (let month = 1; month <= termMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      amortizationSchedule.push({
        month,
        payment: Math.round(monthlyPayment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(Math.max(0, balance) * 100) / 100
      });
    }

    const result: LoanCalculation = {
      principal,
      interestRate: annualRate,
      termMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      amortizationSchedule
    };

    setResults(prev => ({ ...prev, loan: result }));
  };

  // Cálculo de Parcelas
  const calculateInstallments = () => {
    const { totalAmount, installments, interestRate } = installmentCalc;
    const monthlyRate = interestRate / 100;
    
    // Valor da parcela com juros compostos
    const installmentValue = totalAmount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                            (Math.pow(1 + monthlyRate, installments) - 1);
    
    const totalWithInterest = installmentValue * installments;
    const totalInterest = totalWithInterest - totalAmount;

    const result = {
      totalAmount,
      installments,
      interestRate,
      installmentValue: Math.round(installmentValue * 100) / 100,
      totalWithInterest: Math.round(totalWithInterest * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100
    };

    setResults(prev => ({ ...prev, installment: result }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Calculadoras Financeiras</h2>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básica</TabsTrigger>
          <TabsTrigger value="compound">Juros Compostos</TabsTrigger>
          <TabsTrigger value="loan">Empréstimo</TabsTrigger>
          <TabsTrigger value="installment">Parcelas</TabsTrigger>
        </TabsList>

        {/* Calculadora Básica */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora Básica
              </CardTitle>
              <CardDescription>
                Calculadora para operações matemáticas básicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs mx-auto">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="text-right text-2xl font-mono">
                    {basicCalc.display}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" onClick={handleBasicClear}>C</Button>
                  <Button variant="outline" onClick={() => handleBasicOperation('%')}>%</Button>
                  <Button variant="outline" onClick={() => handleBasicOperation('/')}>/</Button>
                  <Button variant="outline" onClick={() => handleBasicOperation('*')}>×</Button>
                  
                  <Button variant="outline" onClick={() => handleBasicInput('7')}>7</Button>
                  <Button variant="outline" onClick={() => handleBasicInput('8')}>8</Button>
                  <Button variant="outline" onClick={() => handleBasicInput('9')}>9</Button>
                  <Button variant="outline" onClick={() => handleBasicOperation('-')}>-</Button>
                  
                  <Button variant="outline" onClick={() => handleBasicInput('4')}>4</Button>
                  <Button variant="outline" onClick={() => handleBasicInput('5')}>5</Button>
                  <Button variant="outline" onClick={() => handleBasicInput('6')}>6</Button>
                  <Button variant="outline" onClick={() => handleBasicOperation('+')}>+</Button>
                  
                  <Button variant="outline" onClick={() => handleBasicInput('1')}>1</Button>
                  <Button variant="outline" onClick={() => handleBasicInput('2')}>2</Button>
                  <Button variant="outline" onClick={() => handleBasicInput('3')}>3</Button>
                  <Button variant="default" className="row-span-2" onClick={handleBasicEquals}>=</Button>
                  
                  <Button variant="outline" className="col-span-2" onClick={() => handleBasicInput('0')}>0</Button>
                  <Button variant="outline" onClick={() => handleBasicInput('.')}>.</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculadora de Juros Compostos */}
        <TabsContent value="compound">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Calculadora de Juros Compostos
              </CardTitle>
              <CardDescription>
                Calcule o crescimento do seu investimento com juros compostos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="principal">Valor Inicial (R$)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={compoundCalc.principal}
                    onChange={(e) => setCompoundCalc(prev => ({ ...prev, principal: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="monthly">Aporte Mensal (R$)</Label>
                  <Input
                    id="monthly"
                    type="number"
                    value={compoundCalc.monthlyContribution}
                    onChange={(e) => setCompoundCalc(prev => ({ ...prev, monthlyContribution: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Taxa Anual (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.1"
                    value={compoundCalc.annualRate}
                    onChange={(e) => setCompoundCalc(prev => ({ ...prev, annualRate: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="years">Período (anos)</Label>
                  <Input
                    id="years"
                    type="number"
                    value={compoundCalc.years}
                    onChange={(e) => setCompoundCalc(prev => ({ ...prev, years: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <Button onClick={calculateCompoundInterest} className="w-full">
                Calcular Juros Compostos
              </Button>

              {results.compound && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">Resultado:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Valor Final</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        R$ {results.compound.futureValue.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total de Juros</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        R$ {results.compound.totalInterest.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Investido</p>
                      <p className="text-lg text-gray-900 dark:text-gray-100">
                        R$ {results.compound.totalContributions.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rendimento</p>
                      <p className="text-lg text-gray-900 dark:text-gray-100">
                        {((results.compound.totalInterest / results.compound.totalContributions) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulador de Empréstimo */}
        <TabsContent value="loan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Simulador de Empréstimo
              </CardTitle>
              <CardDescription>
                Calcule as parcelas e juros do seu empréstimo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loanAmount">Valor do Empréstimo (R$)</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={loanCalc.principal}
                    onChange={(e) => setLoanCalc(prev => ({ ...prev, principal: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="loanRate">Taxa Anual (%)</Label>
                  <Input
                    id="loanRate"
                    type="number"
                    step="0.1"
                    value={loanCalc.annualRate}
                    onChange={(e) => setLoanCalc(prev => ({ ...prev, annualRate: Number(e.target.value) }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="loanTerm">Prazo (anos)</Label>
                  <Input
                    id="loanTerm"
                    type="number"
                    value={loanCalc.termYears}
                    onChange={(e) => setLoanCalc(prev => ({ ...prev, termYears: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <Button onClick={calculateLoan} className="w-full">
                Simular Empréstimo
              </Button>

              {results.loan && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Resumo do Empréstimo:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Parcela Mensal</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          R$ {results.loan.monthlyPayment.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total de Juros</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          R$ {results.loan.totalInterest.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          R$ {results.loan.totalAmount.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Prazo</p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {results.loan.termMonths} meses
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="font-semibold mb-2 p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      Tabela de Amortização (primeiras 12 parcelas):
                    </h4>
                    <div className="space-y-1 p-2">
                      {results.loan.amortizationSchedule?.slice(0, 12).map((entry) => (
                        <div key={entry.month} className="grid grid-cols-4 gap-2 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Mês {entry.month}</span>
                          <span className="text-blue-600 dark:text-blue-400">R$ {entry.payment.toLocaleString('pt-BR')}</span>
                          <span className="text-green-600 dark:text-green-400">Principal: R$ {entry.principal.toLocaleString('pt-BR')}</span>
                          <span className="text-gray-600 dark:text-gray-400">Saldo: R$ {entry.balance.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulador de Parcelas */}
        <TabsContent value="installment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Simulador de Parcelas
              </CardTitle>
              <CardDescription>
                Calcule o valor das parcelas com juros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Valor Total (R$)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={installmentCalc.totalAmount}
                    onChange={(e) => setInstallmentCalc(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="installments">Número de Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    value={installmentCalc.installments}
                    onChange={(e) => setInstallmentCalc(prev => ({ ...prev, installments: Number(e.target.value) }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="installmentRate">Taxa Mensal (%)</Label>
                  <Input
                    id="installmentRate"
                    type="number"
                    step="0.1"
                    value={installmentCalc.interestRate}
                    onChange={(e) => setInstallmentCalc(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <Button onClick={calculateInstallments} className="w-full">
                Calcular Parcelas
              </Button>

              {results.installment && (
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold mb-3 text-purple-800 dark:text-purple-200">Resultado:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Valor da Parcela</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        R$ {results.installment.installmentValue.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total com Juros</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        R$ {results.installment.totalWithInterest.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total de Juros</p>
                      <p className="text-lg text-red-600 dark:text-red-400">
                        R$ {results.installment.totalInterest.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Acréscimo</p>
                      <p className="text-lg text-gray-900 dark:text-gray-100">
                        {((results.installment.totalInterest / results.installment.totalAmount) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialCalculators;
