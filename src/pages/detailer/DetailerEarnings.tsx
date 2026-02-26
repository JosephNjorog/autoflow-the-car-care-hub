import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard } from '@/components/shared/SharedComponents';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

export default function DetailerEarnings() {
  const { data, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => api.get<any>('/detailer/earnings'),
  });

  const earnings = data?.earnings || [];
  const summary = data?.summary || { total: 0, today: 0, thisWeek: 0, completedJobs: 0 };

  return (
    <DashboardLayout>
      <PageHeader title="Earnings" subtitle="Track your income (40% commission per job)" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Earnings" value={`KES ${summary.total.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="This Week" value={`KES ${summary.thisWeek.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard title="Total Jobs" value={summary.completedJobs} icon={<Calendar className="w-5 h-5" />} />
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading earnings...</div>
      ) : earnings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No completed jobs yet.</div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border"><h3 className="font-display text-foreground">Earnings History</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Your Earnings</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e: any) => (
                  <tr key={e.bookingId} className="border-b border-border last:border-0">
                    <td className="p-4 text-foreground">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                    <td className="p-4 text-foreground">{e.serviceName}</td>
                    <td className="p-4 text-muted-foreground">{e.customerName}</td>
                    <td className="p-4 text-right font-display text-foreground">KES {parseFloat(e.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
