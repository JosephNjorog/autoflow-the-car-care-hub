import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockDetailerSchedule, dayNames } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export default function DetailerSchedule() {
  const [schedule, setSchedule] = useState(mockDetailerSchedule);

  const toggleDay = (idx: number) => {
    const updated = [...schedule];
    updated[idx] = { ...updated[idx], isAvailable: !updated[idx].isAvailable };
    setSchedule(updated);
  };

  return (
    <DashboardLayout role="detailer" userName="Peter Ochieng">
      <PageHeader title="My Schedule" subtitle="Set your weekly availability" action={<Button size="sm">Save Changes</Button>} />
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
