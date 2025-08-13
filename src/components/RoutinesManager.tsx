import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface RoutinesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoutinesManager({ open, onOpenChange }: RoutinesManagerProps) {
  const { routines, skipRoutineBetween } = useApp();
  const activeRoutines = useMemo(() => routines.filter(r => !r.deletedAt), [routines]);

  const [routineId, setRoutineId] = useState<string>('');
  const [range, setRange] = useState<DateRange | undefined>();
  const canApply = !!routineId && !!range?.from && !!range?.to;

  const handleApply = () => {
    if (!canApply) return;
    const startDate = format(range!.from!, 'yyyy-MM-dd');
    const endDate = format(range!.to!, 'yyyy-MM-dd');
    skipRoutineBetween(routineId, startDate, endDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pular rotina em intervalo</DialogTitle>
          <DialogDescription>
            Selecione a rotina e o intervalo de datas que deseja pular.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Rotina</Label>
            <Select value={routineId} onValueChange={setRoutineId}>
              <SelectTrigger className="modern-input">
                <SelectValue placeholder="Selecione a rotina" />
              </SelectTrigger>
              <SelectContent>
                {activeRoutines.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhuma rotina</SelectItem>
                ) : (
                  activeRoutines.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Intervalo de datas</Label>
            <div className="rounded-md border p-2">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={range}
                onSelect={setRange}
                showOutsideDays
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" disabled={!canApply} onClick={handleApply}>
              Aplicar
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
