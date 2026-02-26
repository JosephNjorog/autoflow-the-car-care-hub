import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DetailerSchedule() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: apiSchedule } = useQuery({
    queryKey: ['schedule'],
    queryFn: () => api.get<any[]>('/detailer/schedule'),
  });

  useEffect(() => {
    if (apiSchedule && apiSchedule.length > 0) {
      setSchedule(apiSchedule.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime || '08:00',
        endTime: s.endTime || '17:00',
        isAvailable: s.isAvailable,
      })));
    } else {
      // Default schedule
      setSchedule(dayNames.map((_, i) => ({
        dayOfWeek: i,
        startTime: '08:00',
        endTime: '17:00',
        isAvailable: i >= 1 && i <= 5,
      })));
    }
  }, [apiSchedule]);

  const toggleDay = (idx: number) => {
    const updated = [...schedule];
    updated[idx] = { ...updated[idx], isAvailable: !updated[idx].isAvailable };
    setSchedule(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/detailer/schedule', { schedule });
      toast({ title: 'Schedule Saved', description: 'Your availability has been updated.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save schedule';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="My Schedule" subtitle="Set your weekly availability"
        action={<Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>} />
      <div className="max-w-lg space-y-3">
        {schedule.map((s, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="w-24">
              <p className="text-sm font-medium text-foreground">{dayNames[s.dayOfWeek]}</p>
            </div>
            <Switch checked={s.isAvailable} onCheckedChange={() => toggleDay(i)} />
            {s.isAvailable && (
              <div className="flex items-center gap-2 flex-1">
                <Input type="time" value={s.startTime} className="w-28" onChange={(e) => {
                  const updated = [...schedule]; updated[i] = { ...updated[i], startTime: e.target.value }; setSchedule(updated);
                }} />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="time" value={s.endTime} className="w-28" onChange={(e) => {
                  const updated = [...schedule]; updated[i] = { ...updated[i], endTime: e.target.value }; setSchedule(updated);
                }} />
              </div>
            )}
            {!s.isAvailable && <span className="text-sm text-muted-foreground">Off</span>}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
