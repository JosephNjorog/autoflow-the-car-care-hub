import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Camera, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function DetailerJobs() {
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  const jobs = bookings
    .filter((b: any) => filter === 'all' || b.status === filter)
    .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));

  const updateStatus = async (id: string, status: string, label: string) => {
    setUpdating(id);
    try {
      await api.patch(`/bookings/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      toast({ title: `Job ${label}`, description: `Status updated to ${label.toLowerCase()}.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="My Jobs" subtitle="Manage your assigned jobs" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'in_progress', 'confirmed', 'completed'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No jobs match this filter.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((b: any) => (
            <div key={b.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-display text-foreground">{b.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
                  <p className="text-sm text-muted-foreground">{b.locationName} · {b.date} at {b.time}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={b.status} />
                  {b.status === 'in_progress' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toast({ title: 'Photos', description: 'Photo upload coming soon.' })}><Camera className="w-3 h-3 mr-1" /> Photos</Button>
                      <Button size="sm" variant="outline" onClick={() => toast({ title: 'Live Stream', description: 'Live stream feature powered by Agora.' })}><Video className="w-3 h-3 mr-1" /> Go Live</Button>
                      <Button size="sm" disabled={updating === b.id}
                        onClick={() => updateStatus(b.id, 'completed', 'Completed')}>
                        {updating === b.id ? 'Updating...' : 'Complete'}
                      </Button>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <Button size="sm" disabled={updating === b.id}
                      onClick={() => updateStatus(b.id, 'in_progress', 'Started')}>
                      {updating === b.id ? 'Updating...' : 'Start Job'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
