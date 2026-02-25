import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, StatusBadge, PageHeader } from '@/components/shared/SharedComponents';
import { mockBookings, mockEarnings } from '@/data/mockData';
import { Briefcase, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DetailerDashboard() {
  const { toast } = useToast();
  const myJobs = mockBookings.filter(b => b.detailerId === 'u3');
  const activeJobs = myJobs.filter(b => b.status === 'in_progress');
  const todayEarnings = mockEarnings.filter(e => e.date === '2026-02-25').reduce((sum, e) => sum + e.amount, 0);
  const totalEarnings = mockEarnings.reduce((sum, e) => sum + e.amount, 0);

  return (
    <DashboardLayout role="detailer" userName="Peter Ochieng">
      <PageHeader title="Welcome, Peter" subtitle="Your detailing dashboard" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Jobs" value={activeJobs.length} icon={<Briefcase className="w-5 h-5" />} />
        <StatCard title="Today's Earnings" value={`KES ${todayEarnings.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Total Earnings" value={`KES ${totalEarnings.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend={{ value: '8% this week', positive: true }} />
        <StatCard title="Completed Jobs" value={myJobs.filter(b => b.status === 'completed').length} icon={<CheckCircle className="w-5 h-5" />} />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">Active Jobs</h3>
          <Link to="/detailer/jobs"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No active jobs right now.</p>
          ) : activeJobs.map(b => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
              <div>
                <p className="font-medium text-foreground text-sm">{b.serviceName}</p>
                <p className="text-xs text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
                <p className="text-xs text-muted-foreground">{b.locationName} · {b.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                <Button size="sm" variant="outline" onClick={() => toast({ title: 'Job Completed', description: `${b.serviceName} marked as complete.` })}>Mark Complete</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg text-foreground mb-4">Upcoming Jobs</h3>
        <div className="space-y-3">
          {myJobs.filter(b => b.status === 'confirmed').map(b => (
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
