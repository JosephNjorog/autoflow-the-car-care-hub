import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { Users, Calendar, DollarSign, CheckCircle, Wallet, Smartphone, Banknote, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => api.get<any>('/analytics') });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get<any[]>('/users') });
  const { data: bookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: () => api.get<any[]>('/bookings') });
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: () => api.get<any[]>('/payments/transactions') });
  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: () => api.get<any[]>('/admin/approvals') });

  const totalRevenue = transactions.filter((t: any) => t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const mpesaRevenue = transactions.filter((t: any) => t.method === 'mpesa' && t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const cryptoRevenue = transactions.filter((t: any) => ['crypto','usdt','usdc'].includes(t.method) && t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const cashRevenue = transactions.filter((t: any) => ['cash','card'].includes(t.method) && t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);

  const recentUsers = users.slice(0, 5);
  const recentTransactions = transactions.slice(0, 6);

  return (
    <DashboardLayout>
      <PageHeader title="Admin Dashboard" subtitle="System-wide overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={users.length} icon={<Users className="w-5 h-5" />} />
        <StatCard title="Total Bookings" value={bookings.length} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Pending Approvals" value={approvals.length} icon={<CheckCircle className="w-5 h-5" />} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/10"><Smartphone className="w-5 h-5 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">M-Pesa Revenue</p><p className="font-display text-lg text-foreground">KES {mpesaRevenue.toLocaleString()}</p></div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Crypto Revenue</p><p className="font-display text-lg text-foreground">KES {cryptoRevenue.toLocaleString()}</p></div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/10"><Banknote className="w-5 h-5 text-accent" /></div>
          <div><p className="text-xs text-muted-foreground">Cash & Card</p><p className="font-display text-lg text-foreground">KES {cashRevenue.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-foreground">Recent Users</h3>
            <Link to="/admin/users"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {(u.name || u.firstName || '?').charAt(0)}
                    </div>
                    <div><p className="text-sm font-medium text-foreground">{u.name || `${u.firstName} ${u.lastName}`}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                  </div>
                  <span className="text-xs font-medium capitalize text-muted-foreground">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-foreground">Recent Transactions</h3>
            <Link to="/admin/transactions"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      {t.method === 'mpesa' ? <Smartphone className="w-3.5 h-3.5" /> : ['crypto','usdt','usdc'].includes(t.method) ? <Wallet className="w-3.5 h-3.5" /> : t.method === 'cash' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                    </span>
                    <div><p className="text-sm font-medium text-foreground">{t.customerName || '—'}</p><p className="text-xs text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'} · {(t.method || '').toUpperCase()}</p></div>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-foreground">KES {parseFloat(t.amount || 0).toLocaleString()}</span>
                    <div><StatusBadge status={t.status} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
