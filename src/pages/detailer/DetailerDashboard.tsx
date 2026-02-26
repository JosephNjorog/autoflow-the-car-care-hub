import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, StatusBadge, PageHeader } from '@/components/shared/SharedComponents';
import { Briefcase, DollarSign, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function DetailerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  const { data: earnings } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => api.get<any>('/detailer/earnings'),
  });

  const activeJobs = bookings.filter((b: any) => b.status === 'in_progress');
  const upcomingJobs = bookings.filter((b: any) => b.status === 'confirmed');

  const handleComplete = async (bookingId: string, serviceName: string) => {
    setCompleting(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}`, { status: 'completed' });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      toast({ title: 'Job Completed', description: `${serviceName} marked as complete.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setCompleting(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title={`Welcome, ${firstName}`} subtitle="Your detailing dashboard" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Jobs" value={activeJobs.length} icon={<Briefcase className="w-5 h-5" />} />
        <StatCard title="Today's Earnings" value={`KES ${(earnings?.summary?.today || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Total Earnings" value={`KES ${(earnings?.summary?.total || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Completed Jobs" value={earnings?.summary?.completedJobs || 0} icon={<CheckCircle className="w-5 h-5" />} />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">Active Jobs</h3>
          <Link to="/detailer/jobs"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No active jobs right now.</p>
          ) : activeJobs.map((b: any) => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
              <div>
                <p className="font-medium text-foreground text-sm">{b.serviceName}</p>
                <p className="text-xs text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
                <p className="text-xs text-muted-foreground">{b.locationName} · {b.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                <Button size="sm" variant="outline" disabled={completing === b.id}
                  onClick={() => handleComplete(b.id, b.serviceName)}>
                  {completing === b.id ? 'Completing...' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg text-foreground mb-4">Upcoming Jobs</h3>
        <div className="space-y-3">
          {upcomingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming jobs.</p>
          ) : upcomingJobs.map((b: any) => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
              <div>
                <p className="font-medium text-foreground text-sm">{b.serviceName}</p>
                <p className="text-xs text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
                <p className="text-xs text-muted-foreground">{b.date} at {b.time} · {b.locationName}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
