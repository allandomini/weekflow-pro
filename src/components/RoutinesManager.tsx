import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import { useAnimations } from '@/contexts/AnimationContext';
import { Routine } from '@/types';
import { CalendarDays, Clock, Target, Zap, Calendar as CalendarIcon, Trash2, SkipForward, Pause } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from '@/hooks/useTranslation';

interface RoutinesManagerProps {
  routine: Routine;
  onClose: () => void;
}

export default function RoutinesManager({ routine, onClose }: RoutinesManagerProps) {
  const { bulkDeleteRoutineOccurrences, bulkSkipRoutinePeriod, getRoutineOccurrences } = useAppContext();
  const { animationsEnabled } = useAnimations();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [operationType, setOperationType] = useState<'delete' | 'skip'>('delete');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'skip';
    count: number;
  }>({ open: false, type: 'delete', count: 0 });

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => {
      const dateStr = date.toISOString().split('T')[0];
      const exists = prev.some(d => d.toISOString().split('T')[0] === dateStr);
      
      if (exists) {
        return prev.filter(d => d.toISOString().split('T')[0] !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleBulkOperationClick = () => {
    if (selectedDates.length === 0) return;
    
    setConfirmDialog({
      open: true,
      type: operationType,
      count: selectedDates.length
    });
  };

  const handleConfirmBulkOperation = async () => {
    setConfirmDialog({ open: false, type: 'delete', count: 0 });
    setIsLoading(true);
    
    try {
      const dateStrings = selectedDates.map(d => d.toISOString().split('T')[0]);
      
      if (operationType === 'delete') {
        await bulkDeleteRoutineOccurrences(routine.id, dateStrings);
      } else {
        const minDate = new Date(Math.min(...selectedDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...selectedDates.map(d => d.getTime())));
        await bulkSkipRoutinePeriod(routine.id, minDate.toISOString().split('T')[0], maxDate.toISOString().split('T')[0]);
      }
      
      setSelectedDates([]);
      handleClose();
    } catch (error) {
      console.error('Error performing bulk operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateModifiers = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const isSelected = selectedDates.some(d => d.toISOString().split('T')[0] === dateStr);
    
    return {
      selected: isSelected,
      className: isSelected ? 'bg-primary text-primary-foreground' : ''
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {t('routines.manage_routine')}: {routine.name}
          </DialogTitle>
          <DialogDescription>
            {t('routines.select_dates_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('routines.select_dates')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  className="rounded-md border"
                  locale={ptBR}
                />
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDates([])}
                      disabled={selectedDates.length === 0}
                    >
                      {t('routines.clear_selection')}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t('routines.dates_selected', { count: selectedDates.length })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operations Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('routines.bulk_operations')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground block mb-2">{t('routines.operation_type')}</Label>
                  <Select
                    value={operationType}
                    onValueChange={(value) => setOperationType(value as 'delete' | 'skip')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delete">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          {t('routines.delete_occurrences')}
                        </div>
                      </SelectItem>
                      <SelectItem value="skip">
                        <div className="flex items-center gap-2">
                          <SkipForward className="w-4 h-4" />
                          {t('routines.pause_period')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {operationType === 'delete' && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <Trash2 className="w-5 h-5" />
                      <strong>{t('routines.attention')}:</strong>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {t('routines.delete_warning_text')}
                    </p>
                  </div>
                )}

                {operationType === 'skip' && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <Pause className="w-5 h-5" />
                      <strong>{t('routines.pause_period')}:</strong>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {t('routines.pause_warning_text')}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground block">{t('routines.reference_period')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('routines.start_date')}</Label>
                      <Input
                        type="date"
                        value={startDate.toISOString().split('T')[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('routines.end_date')}</Label>
                      <Input
                        type="date"
                        value={endDate.toISOString().split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleBulkOperationClick}
                  disabled={selectedDates.length === 0 || isLoading}
                  className={`w-full ${
                    operationType === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {isLoading ? (
                    t('routines.processing')
                  ) : operationType === 'delete' ? (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('routines.delete_occurrences_count', { count: selectedDates.length })}
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      {t('routines.pause_days_count', { count: selectedDates.length })}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Routine Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('routines.routine_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: routine.color }}
                  />
                  <span className="font-medium">{routine.name}</span>
                  <Badge variant="outline">{routine.priority}</Badge>
                </div>
                
                {routine.description && (
                  <p className="text-sm text-muted-foreground">{routine.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('routines.times_per_day')}:</span>
                    <span className="ml-2 font-medium">{routine.timesPerDay}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('routines.duration')}:</span>
                    <span className="ml-2 font-medium">
                      {routine.durationDays ? `${routine.durationDays} ${t('routines.days')}` : t('routines.always')}
                    </span>
                  </div>
                </div>

                {routine.specificTimes && routine.specificTimes.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t('routines.times')}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {routine.specificTimes.map((time, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {routine.weekdays && routine.weekdays.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t('dashboard.weekdays.title')}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {routine.weekdays.map(day => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {[t('dashboard.week_days.sun'), t('dashboard.week_days.mon'), t('dashboard.week_days.tue'), t('dashboard.week_days.wed'), t('dashboard.week_days.thu'), t('dashboard.week_days.fri'), t('dashboard.week_days.sat')][day]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
      
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'delete' ? t('routines.confirm_deletion') : t('routines.confirm_pause')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'delete' ? (
                <>
                  {t('routines.confirm_delete_message', { count: confirmDialog.count, name: routine.name })}
                  <br /><br />
                  {t('routines.action_cannot_be_undone')}
                </>
              ) : (
                <>
                  {t('routines.confirm_pause_message', { count: confirmDialog.count, name: routine.name })}
                  <br /><br />
                  {t('routines.routine_will_not_execute')}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkOperation}
              className={confirmDialog.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
            >
              {confirmDialog.type === 'delete' ? t('common.delete') : t('routines.pause')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
