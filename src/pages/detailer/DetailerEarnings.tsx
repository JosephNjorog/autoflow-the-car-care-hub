import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard } from '@/components/shared/SharedComponents';
import { mockEarnings } from '@/data/mockData';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function DetailerEarnings() {
  const total = mockEarnings.reduce((sum, e) => sum + e.amount, 0);
  const thisWeek = mockEarnings.filter(e => e.date >= '2026-02-19').reduce((sum, e) => sum + e.amount, 0);

  return (
    <DashboardLayout role="detailer" userName="Peter Ochieng">
      <PageHeader title="Earnings" subtitle="Track your income" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Earnings" value={`KES ${total.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="This Week" value={`KES ${thisWeek.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} trend={{ value: '15%', positive: true }} />
        <StatCard title="Total Jobs" value={mockEarnings.length} icon={<Calendar className="w-5 h-5" />} />
      </div>
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-display text-foreground">Earnings History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockEarnings.map(e => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{e.date}</td>
                  <td className="p-4 text-foreground">{e.serviceName}</td>
                  <td className="p-4 text-muted-foreground">{e.customerName}</td>
                  <td className="p-4 text-right font-display text-foreground">KES {e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
