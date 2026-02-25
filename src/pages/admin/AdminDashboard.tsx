import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, PageHeader } from '@/components/shared/SharedComponents';
import { mockUsers, mockBookings, mockTransactions } from '@/data/mockData';
import { Users, Calendar, DollarSign, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const totalRevenue = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="Admin Dashboard" subtitle="System-wide overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={mockUsers.length} icon={<Users className="w-5 h-5" />} trend={{ value: '12 this month', positive: true }} />
        <StatCard title="Total Bookings" value={mockBookings.length} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Pending Approvals" value={2} icon={<CheckCircle className="w-5 h-5" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-foreground">Recent Users</h3>
            <Link to="/admin/users"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          <div className="space-y-3">
            {mockUsers.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{u.name.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                </div>
                <span className="text-xs font-medium capitalize text-muted-foreground">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-foreground">Recent Transactions</h3>
            <Link to="/admin/transactions"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          <div className="space-y-3">
            {mockTransactions.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div><p className="text-sm font-medium text-foreground">{t.customerName}</p><p className="text-xs text-muted-foreground">{t.date}</p></div>
                <span className="font-display text-foreground">KES {t.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
