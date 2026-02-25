import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockBookings } from '@/data/mockData';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CustomerBookings() {
  const [filter, setFilter] = useState<string>('all');
  const bookings = mockBookings
    .filter(b => b.customerId === 'u1')
    .filter(b => filter === 'all' || b.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const filters = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="My Bookings" subtitle="Track all your car wash bookings" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {bookings.map(b => (
          <div key={b.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-display text-foreground">{b.serviceName}</p>
                <p className="text-sm text-muted-foreground">{b.vehicleName}</p>
                <p className="text-sm text-muted-foreground">{b.locationName} · {b.date} at {b.time}</p>
                {b.detailerName && <p className="text-xs text-muted-foreground mt-1">Detailer: {b.detailerName}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={b.status} />
                <span className="font-display text-foreground">KES {b.servicePrice.toLocaleString()}</span>
                {b.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xs ${i < b.rating! ? 'text-accent' : 'text-border'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
