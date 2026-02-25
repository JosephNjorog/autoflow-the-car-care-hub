import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge, StatCard } from '@/components/shared/SharedComponents';
import { mockTransactions } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { DollarSign, Wallet, Smartphone, Banknote, CreditCard, ExternalLink, Filter } from 'lucide-react';

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-4 h-4" />,
  crypto: <Wallet className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
};

const methodLabels: Record<string, string> = {
  mpesa: 'M-Pesa',
  crypto: 'Crypto',
  cash: 'Cash',
  card: 'Card',
};

export default function AdminTransactions() {
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = mockTransactions
    .filter(t => methodFilter === 'all' || t.method === methodFilter)
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalRevenue = mockTransactions.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const mpesaTotal = mockTransactions.filter(t => t.method === 'mpesa' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const cryptoTotal = mockTransactions.filter(t => t.method === 'crypto' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const cashTotal = mockTransactions.filter(t => t.method === 'cash' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const cardTotal = mockTransactions.filter(t => t.method === 'card' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);

  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="All Transactions" subtitle="Track every payment — M-Pesa, crypto, cash, and card" />

      {/* Revenue by method */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="M-Pesa" value={`KES ${mpesaTotal.toLocaleString()}`} icon={<Smartphone className="w-5 h-5" />} subtitle={`${mockTransactions.filter(t => t.method === 'mpesa').length} txns`} />
        <StatCard title="Crypto" value={`KES ${cryptoTotal.toLocaleString()}`} icon={<Wallet className="w-5 h-5" />} subtitle={`${mockTransactions.filter(t => t.method === 'crypto').length} txns`} />
        <StatCard title="Cash" value={`KES ${cashTotal.toLocaleString()}`} icon={<Banknote className="w-5 h-5" />} subtitle={`${mockTransactions.filter(t => t.method === 'cash').length} txns`} />
        <StatCard title="Card" value={`KES ${cardTotal.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} subtitle={`${mockTransactions.filter(t => t.method === 'card').length} txns`} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Method:</span>
          {['all', 'mpesa', 'crypto', 'cash', 'card'].map(m => (
            <Button key={m} variant={methodFilter === m ? 'default' : 'outline'} size="sm" onClick={() => setMethodFilter(m)} className="text-xs capitalize">
              {m === 'all' ? 'All' : methodLabels[m]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {['all', 'completed', 'pending', 'failed'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="text-xs capitalize">
              {s === 'all' ? 'All' : s}
            </Button>
          ))}
        </div>
      </div>

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
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{t.date}</td>
                  <td className="p-4 text-foreground">{t.customerName}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-primary/10 text-primary">{methodIcons[t.method]}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{methodLabels[t.method]}</p>
                        {t.cryptoToken && <p className="text-[10px] text-muted-foreground">{t.cryptoToken} · {t.cryptoNetwork}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-foreground">
                    {t.mpesaCode || t.cryptoTxHash || '-'}
                    {t.cryptoTxHash && (
                      <button className="ml-1 text-primary hover:underline inline-flex items-center">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right font-display text-foreground">KES {t.amount.toLocaleString()}</td>
                  <td className="p-4"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No transactions match the selected filters.</div>
        )}
      </div>
    </DashboardLayout>
  );
}
