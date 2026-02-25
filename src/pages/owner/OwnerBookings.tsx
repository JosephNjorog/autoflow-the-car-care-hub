import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockBookings, mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function OwnerBookings() {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const bookings = mockBookings
    .filter(b => filter === 'all' || b.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const detailers = mockUsers.filter(u => u.role === 'detailer');

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="All Bookings" subtitle="Manage bookings across all locations" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'confirmed', 'in_progress', 'completed'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {bookings.map(b => (
          <div key={b.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-display text-foreground">{b.serviceName} — {b.customerName}</p>
                <p className="text-sm text-muted-foreground">{b.vehicleName} · {b.locationName}</p>
                <p className="text-sm text-muted-foreground">{b.date} at {b.time}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={b.status} />
                <span className="font-display text-foreground">KES {b.servicePrice.toLocaleString()}</span>
                {!b.detailerId && b.status !== 'cancelled' && b.status !== 'completed' && (
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="outline">Assign</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="font-display">Assign Detailer</DialogTitle></DialogHeader>
                      <div className="space-y-3 pt-2">
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Select detailer" /></SelectTrigger>
                          <SelectContent>
                            {detailers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button className="w-full" onClick={() => toast({ title: 'Detailer Assigned', description: `Detailer has been assigned to ${b.serviceName}.` })}>Assign Detailer</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {b.detailerName && <span className="text-xs text-muted-foreground">Detailer: {b.detailerName}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
