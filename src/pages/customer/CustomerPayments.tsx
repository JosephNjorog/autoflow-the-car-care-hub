import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockTransactions } from '@/data/mockData';
import { ExternalLink } from 'lucide-react';

export default function CustomerPayments() {
  const payments = mockTransactions.filter(t => t.customerName === 'James Mwangi');

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Payments" subtitle="Your payment history — M-Pesa, USDT (Tether), USDC, and more" />
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{t.date}</td>
                  <td className="p-4">
                    {t.mpesaCode && <span className="font-mono text-xs text-foreground">{t.mpesaCode}</span>}
                    {t.cryptoTxHash && (
                      <button onClick={() => window.open('https://snowtrace.io', '_blank')} className="flex items-center gap-1 font-mono text-xs text-primary hover:underline">
                        {t.cryptoTxHash} <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    {!t.mpesaCode && !t.cryptoTxHash && <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="p-4 font-display text-foreground">KES {t.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="uppercase text-xs font-medium text-muted-foreground">
                      {t.method}
                      {t.cryptoToken && <span className="ml-1 text-primary">({t.cryptoToken})</span>}
                    </span>
                  </td>
                  <td className="p-4"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
