import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { isSameDay, addDays, differenceInMinutes } from 'date-fns';

export function NotificationCenter() {
  const { tasks, debts } = useApp();

  useEffect(() => {
    // Tasks for today
    const today = new Date();
    const todaysTasks = tasks.filter(t => isSameDay(t.date, today) && !t.completed);

    // Near tasks: within next 60 minutes
    todaysTasks.forEach(task => {
      if (!task.startTime) return;
      const [h, m] = task.startTime.split(':').map(Number);
      const taskDate = new Date(task.date);
      taskDate.setHours(h || 0, m || 0, 0, 0);
      const minutes = differenceInMinutes(taskDate, new Date());
      if (minutes >= 0 && minutes <= 60) {
        toast({
          title: `Tarefa em breve: ${task.title}`,
          description: `Começa em ${minutes} min${minutes !== 1 ? 's' : ''}`,
          className: "modern-toast",
          duration: 5000,
        });
      }
    });

    // General tasks today
    if (todaysTasks.length > 0) {
      toast({
        title: `Tarefas de hoje: ${todaysTasks.length}`,
        description: 'Confira o calendário e marque as concluídas',
        className: "modern-toast",
        duration: 4000,
      });
    }

    // Debts due within 7 days
    const nextWeek = addDays(today, 7);
    debts.forEach(debt => {
      if (debt.remainingAmount <= 0) return;
      if (debt.dueDate >= today && debt.dueDate <= nextWeek) {
        toast({
          title: `Dívida próxima de vencer: ${debt.name}`,
          description: `Vence em ${debt.dueDate.toLocaleDateString('pt-BR')}`,
          className: "modern-toast",
          duration: 6000,
        });
      }
    });
  }, [tasks, debts]);

  return null;
}

