import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockTransactions } from '@/data/mockData';

export default function AdminTransactions() {
  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="Transactions" subtitle="All payment transactions" />
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">M-Pesa Code</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{t.date}</td>
                  <td className="p-4 text-foreground">{t.customerName}</td>
                  <td className="p-4 font-mono text-xs text-foreground">{t.mpesaCode || '-'}</td>
                  <td className="p-4 text-muted-foreground uppercase text-xs">{t.method}</td>
                  <td className="p-4 text-right font-display text-foreground">KES {t.amount.toLocaleString()}</td>
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
