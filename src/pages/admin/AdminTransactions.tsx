import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge, StatCard } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { DollarSign, Wallet, Smartphone, Banknote, CreditCard, ExternalLink, Filter } from 'lucide-react';
import { api } from '@/lib/api';

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-4 h-4" />,
  crypto: <Wallet className="w-4 h-4" />,
  usdt: <Wallet className="w-4 h-4" />,
  usdc: <Wallet className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
};

export default function AdminTransactions() {
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<any[]>('/payments/transactions'),
  });

  const filtered = transactions
    .filter((t: any) => methodFilter === 'all' || t.method === methodFilter)
    .filter((t: any) => statusFilter === 'all' || t.status === statusFilter)
    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const totalRevenue = transactions.filter((t: any) => t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const mpesaTotal = transactions.filter((t: any) => t.method === 'mpesa' && t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const cryptoTotal = transactions.filter((t: any) => ['crypto','usdt','usdc'].includes(t.method) && t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const cashTotal = transactions.filter((t: any) => t.method === 'cash' && t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
  const cardTotal = transactions.filter((t: any) => t.method === 'card' && t.status === 'completed').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);

  return (
    <DashboardLayout>
      <PageHeader title="All Transactions" subtitle="Track every payment — M-Pesa, crypto, cash, and card" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="M-Pesa" value={`KES ${mpesaTotal.toLocaleString()}`} icon={<Smartphone className="w-5 h-5" />} />
        <StatCard title="Crypto" value={`KES ${cryptoTotal.toLocaleString()}`} icon={<Wallet className="w-5 h-5" />} />
        <StatCard title="Cash" value={`KES ${cashTotal.toLocaleString()}`} icon={<Banknote className="w-5 h-5" />} />
        <StatCard title="Card" value={`KES ${cardTotal.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Method:</span>
          {['all', 'mpesa', 'usdt', 'usdc', 'cash', 'card'].map(m => (
            <Button key={m} variant={methodFilter === m ? 'default' : 'outline'} size="sm" onClick={() => setMethodFilter(m)} className="text-xs capitalize">
              {m === 'all' ? 'All' : m.toUpperCase()}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {['all', 'completed', 'pending', 'failed'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="text-xs capitalize">{s === 'all' ? 'All' : s}</Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="p-4 text-foreground">{t.customerName || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary">{methodIcons[t.method] || <Wallet className="w-4 h-4" />}</span>
                        <p className="text-xs font-medium text-foreground uppercase">{t.method}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-foreground">
                      {t.mpesaCode || (t.cryptoTxHash ? (
                        <button className="text-primary hover:underline inline-flex items-center gap-1" onClick={() => window.open('https://snowtrace.io', '_blank')}>
                          {t.cryptoTxHash.slice(0, 12)}... <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : '-')}
                    </td>
                    <td className="p-4 text-right font-display text-foreground">KES {parseFloat(t.amount || 0).toLocaleString()}</td>
                    <td className="p-4"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No transactions match the selected filters.</div>}
        </div>
      )}
    </DashboardLayout>
  );
}
