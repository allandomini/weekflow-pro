import { useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/SupabaseAppContext';
import { toast } from '../hooks/use-toast';
import { isSameDay, addDays, differenceInMinutes } from 'date-fns';

const NOTIFICATION_COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds
const STORAGE_KEY = 'weekflow_last_notifications';

export function NotificationCenter() {
  const { tasks, debts } = useAppContext();
  const hasShownInitialNotifications = useRef(false);

  useEffect(() => {
    // Only show notifications once per session and respect cooldown
    if (hasShownInitialNotifications.current) return;
    
    const lastNotificationTime = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    
    // Check if we're still in cooldown period
    if (lastNotificationTime && (now - parseInt(lastNotificationTime)) < NOTIFICATION_COOLDOWN) {
      hasShownInitialNotifications.current = true;
      return;
    }
    
    // Mark as shown to prevent multiple calls in same session
    hasShownInitialNotifications.current = true;
    
    // Update last notification time
    localStorage.setItem(STORAGE_KEY, now.toString());
    
    // Delay notifications slightly to avoid overwhelming on startup
    setTimeout(() => {
      const today = new Date();
      const todaysTasks = tasks.filter(t => isSameDay(t.date, today) && !t.completed);

      // Show general tasks notification only if there are tasks
      if (todaysTasks.length > 0) {
        toast({
          title: `📅 Tarefas de hoje: ${todaysTasks.length}`,
          description: 'Confira o calendário e marque as concluídas',
          className: "modern-toast",
          duration: 4000,
        });
      }

      // Show upcoming task notifications (within next 60 minutes)
      const upcomingTasks = todaysTasks.filter(task => {
        if (!task.startTime) return false;
        const [h, m] = task.startTime.split(':').map(Number);
        const taskDate = new Date(task.date);
        taskDate.setHours(h || 0, m || 0, 0, 0);
        const minutes = differenceInMinutes(taskDate, new Date());
        return minutes >= 0 && minutes <= 60;
      });

      if (upcomingTasks.length > 0) {
        upcomingTasks.slice(0, 2).forEach((task, index) => { // Limit to 2 upcoming tasks
          setTimeout(() => {
            const [h, m] = task.startTime!.split(':').map(Number);
            const taskDate = new Date(task.date);
            taskDate.setHours(h || 0, m || 0, 0, 0);
            const minutes = differenceInMinutes(taskDate, new Date());
            
            toast({
              title: `⏰ Tarefa em breve: ${task.title}`,
              description: `Começa em ${minutes} min${minutes !== 1 ? 's' : ''}`,
              className: "modern-toast",
              duration: 5000,
            });
          }, index * 1000); // Stagger notifications
        });
      }

      // Show debt notifications (due within 7 days)
      const nextWeek = addDays(today, 7);
      const upcomingDebts = debts.filter(debt => 
        debt.remainingAmount > 0 && debt.dueDate >= today && debt.dueDate <= nextWeek
      );
      
      if (upcomingDebts.length > 0) {
        setTimeout(() => {
          upcomingDebts.slice(0, 2).forEach((debt, index) => { // Limit to 2 debt notifications
            setTimeout(() => {
              toast({
                title: `💳 Dívida próxima de vencer: ${debt.name}`,
                description: `Vence em ${debt.dueDate.toLocaleDateString('pt-BR')}`,
                className: "modern-toast",
                duration: 6000,
              });
            }, index * 1000);
          });
        }, 2000); // Show after task notifications
      }
    }, 1500); // Initial delay after app startup
  }, [tasks, debts]);

  return null;
}

