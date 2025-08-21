import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  context?: string;
  retryAction?: () => void;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((
    error: any, 
    operation: string, 
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, context, retryAction } = options;

    console.error(`Error in ${operation}:`, error, context ? `Context: ${context}` : '');
    
    if (!showToast) return;

    // Extract meaningful error message
    let errorMessage = 'Ocorreu um erro inesperado';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error_description) {
      errorMessage = error.error_description;
    } else if (error?.details) {
      errorMessage = error.details;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Map common errors to user-friendly messages
    if (errorMessage.includes('duplicate key')) {
      errorMessage = 'Este item já existe. Tente usar um nome diferente.';
    } else if (errorMessage.includes('foreign key')) {
      errorMessage = 'Não é possível realizar esta operação devido a dependências.';
    } else if (errorMessage.includes('not found')) {
      errorMessage = 'Item não encontrado. Ele pode ter sido removido.';
    } else if (errorMessage.includes('permission denied')) {
      errorMessage = 'Você não tem permissão para realizar esta operação.';
    } else if (errorMessage.includes('network')) {
      errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
    } else if (errorMessage.includes('timeout')) {
      errorMessage = 'Operação demorou muito. Tente novamente.';
    }

    // Operation-specific titles
    const operationTitles: Record<string, string> = {
      'adding_task': 'Erro ao Adicionar Tarefa',
      'updating_task': 'Erro ao Atualizar Tarefa',
      'deleting_task': 'Erro ao Excluir Tarefa',
      'completing_task': 'Erro ao Completar Tarefa',
      'adding_routine': 'Erro ao Adicionar Rotina',
      'updating_routine': 'Erro ao Atualizar Rotina',
      'deleting_routine': 'Erro ao Excluir Rotina',
      'completing_routine': 'Erro ao Completar Rotina',
      'skipping_routine': 'Erro ao Pular Rotina',
      'adding_transaction': 'Erro ao Adicionar Transação',
      'updating_transaction': 'Erro ao Atualizar Transação',
      'deleting_transaction': 'Erro ao Excluir Transação',
      'adding_account': 'Erro ao Adicionar Conta',
      'updating_account': 'Erro ao Atualizar Conta',
      'deleting_account': 'Erro ao Excluir Conta',
      'adding_debt': 'Erro ao Adicionar Dívida',
      'updating_debt': 'Erro ao Atualizar Dívida',
      'deleting_debt': 'Erro ao Excluir Dívida',
      'paying_debt': 'Erro ao Pagar Dívida',
      'adding_goal': 'Erro ao Adicionar Meta',
      'updating_goal': 'Erro ao Atualizar Meta',
      'allocating_goal': 'Erro ao Alocar para Meta',
      'adding_investment': 'Erro ao Adicionar Investimento',
      'updating_investment': 'Erro ao Atualizar Investimento',
      'deleting_investment': 'Erro ao Excluir Investimento',
      'adding_investment_transaction': 'Erro ao Adicionar Transação de Investimento',
      'loading_data': 'Erro ao Carregar Dados',
      'saving_data': 'Erro ao Salvar Dados',
      'calendar_operation': 'Erro na Operação do Calendário',
      'financial_calculation': 'Erro no Cálculo Financeiro',
    };

    const title = operationTitles[operation] || `Erro: ${operation}`;
    const description = context ? `${errorMessage}\n\nContexto: ${context}` : errorMessage;

    toast({
      title,
      description,
      variant: 'destructive',
      duration: 6000,
    });
  }, [toast]);

  const handleAsyncError = useCallback(async (
    asyncOperation: () => Promise<any>,
    operation: string,
    options: ErrorHandlerOptions = {}
  ) => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error, operation, options);
      throw error; // Re-throw for component-level handling if needed
    }
  }, [handleError]);

  return { handleError, handleAsyncError };
};
