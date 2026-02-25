import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockTransactions } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Smartphone, Wallet, Banknote, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const methodLabels: Record<string, string> = { mpesa: 'M-Pesa', crypto: 'Crypto', cash: 'Cash', card: 'Card' };
const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-3.5 h-3.5" />,
  crypto: <Wallet className="w-3.5 h-3.5" />,
  cash: <Banknote className="w-3.5 h-3.5" />,
  card: <CreditCard className="w-3.5 h-3.5" />,
};

export default function OwnerPayments() {
  const { toast } = useToast();

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="Payments" subtitle="Track all transactions"
        action={
          <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Settings className="w-4 h-4 mr-1" /> Payment Settings</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">M-Pesa Settings</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Paybill Number</Label><Input placeholder="123456" /></div>
                <div className="space-y-2"><Label>Account Name</Label><Input placeholder="AutoFlow" /></div>
                <div className="space-y-2"><Label>Till Number (optional)</Label><Input placeholder="7890123" /></div>
                <Button className="w-full" onClick={() => toast({ title: 'Settings Saved', description: 'M-Pesa payment settings updated.' })}>Save Settings</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
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
              {mockTransactions.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{t.date}</td>
                  <td className="p-4 text-foreground">{t.customerName}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-primary/10 text-primary">{methodIcons[t.method]}</span>
                      <span className="text-xs font-medium">{methodLabels[t.method]}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-foreground">{t.mpesaCode || t.cryptoTxHash || '-'}</td>
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
