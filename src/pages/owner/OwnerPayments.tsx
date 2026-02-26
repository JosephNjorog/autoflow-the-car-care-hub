import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Smartphone, Wallet, Banknote, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-3.5 h-3.5" />,
  crypto: <Wallet className="w-3.5 h-3.5" />,
  usdt: <Wallet className="w-3.5 h-3.5" />,
  usdc: <Wallet className="w-3.5 h-3.5" />,
  cash: <Banknote className="w-3.5 h-3.5" />,
  card: <CreditCard className="w-3.5 h-3.5" />,
};

export default function OwnerPayments() {
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<any[]>('/payments/transactions'),
  });

  return (
    <DashboardLayout>
      <PageHeader title="Payments" subtitle="Track all transactions"
        action={
          <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Settings className="w-4 h-4 mr-1" /> Payment Settings</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">M-Pesa Settings</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Paybill Number</Label><Input placeholder="123456" /></div>
                <div className="space-y-2"><Label>Account Name</Label><Input placeholder="AutoFlow" /></div>
                <Button className="w-full" onClick={() => toast({ title: 'Settings Saved', description: 'M-Pesa payment settings updated.' })}>Save Settings</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No transactions yet.</div>
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
                {transactions.map((t: any) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="p-4 text-foreground">{t.customerName || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-primary/10 text-primary">{methodIcons[t.method] || <Wallet className="w-3.5 h-3.5" />}</span>
                        <span className="text-xs font-medium uppercase">{t.method}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-foreground">{t.mpesaCode || t.cryptoTxHash || '-'}</td>
                    <td className="p-4 text-right font-display text-foreground">KES {parseFloat(t.amount || 0).toLocaleString()}</td>
                    <td className="p-4"><StatusBadge status={t.status} /></td>
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
