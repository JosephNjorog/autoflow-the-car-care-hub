import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockUsers, mockBookings, mockTransactions } from '@/data/mockData';
import { Users, Calendar, DollarSign, CheckCircle, Wallet, Smartphone, Banknote, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const totalRevenue = mockTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const mpesaRevenue = mockTransactions.filter(t => t.method === 'mpesa' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const cryptoRevenue = mockTransactions.filter(t => t.method === 'crypto' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const cashRevenue = mockTransactions.filter(t => (t.method === 'cash' || t.method === 'card') && t.status === 'completed').reduce((s, t) => s + t.amount, 0);

  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="Admin Dashboard" subtitle="System-wide overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={mockUsers.length} icon={<Users className="w-5 h-5" />} trend={{ value: '12 this month', positive: true }} />
        <StatCard title="Total Bookings" value={mockBookings.length} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Pending Approvals" value={2} icon={<CheckCircle className="w-5 h-5" />} />
      </div>

      {/* Revenue by payment method */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/10"><Smartphone className="w-5 h-5 text-success" /></div>
          <div>
            <p className="text-xs text-muted-foreground">M-Pesa Revenue</p>
            <p className="font-display text-lg text-foreground">KES {mpesaRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Crypto Revenue</p>
            <p className="font-display text-lg text-foreground">KES {cryptoRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/10"><Banknote className="w-5 h-5 text-accent" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Cash & Card</p>
            <p className="font-display text-lg text-foreground">KES {cashRevenue.toLocaleString()}</p>
          </div>
        </div>
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
            {mockTransactions.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    {t.method === 'mpesa' ? <Smartphone className="w-3.5 h-3.5" /> : t.method === 'crypto' ? <Wallet className="w-3.5 h-3.5" /> : t.method === 'cash' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                  </span>
                  <div><p className="text-sm font-medium text-foreground">{t.customerName}</p><p className="text-xs text-muted-foreground">{t.date} · {t.method.toUpperCase()}</p></div>
                </div>
                <div className="text-right">
                  <span className="font-display text-foreground">KES {t.amount.toLocaleString()}</span>
                  <p className="text-[10px]"><StatusBadge status={t.status} /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
