import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Smartphone, Wallet, Banknote, CreditCard, ExternalLink,
  CheckCircle, Info, Save, Loader2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const methodIcons: Record<string, React.ReactNode> = {
  mpesa:  <Smartphone className="w-3.5 h-3.5" />,
  crypto: <Wallet     className="w-3.5 h-3.5" />,
  usdt:   <Wallet     className="w-3.5 h-3.5" />,
  usdc:   <Wallet     className="w-3.5 h-3.5" />,
  cash:   <Banknote   className="w-3.5 h-3.5" />,
  card:   <CreditCard className="w-3.5 h-3.5" />,
};

// ── Payment settings dialog ───────────────────────────────────────────────────
function PaymentSettingsDialog() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mpesaType,    setMpesaType]    = useState('phone');
  const [mpesaPhone,   setMpesaPhone]   = useState('');
  const [mpesaTill,    setMpesaTill]    = useState('');
  const [mpesaPaybill, setMpesaPaybill] = useState('');
  const [mpesaAccount, setMpesaAccount] = useState('');
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [saving, setSaving] = useState(false);

  // Load current settings when dialog opens
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => api.get<any>(`/users/${user!.id}`),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userProfile) {
      setMpesaType(userProfile.mpesaPayoutType    || 'phone');
      setMpesaPhone(userProfile.mpesaPayoutPhone  || '');
      setMpesaTill(userProfile.mpesaPayoutTill    || '');
      setMpesaPaybill(userProfile.mpesaPayoutPaybill || '');
      setMpesaAccount(userProfile.mpesaPayoutAccount || '');
      setCryptoWallet(userProfile.cryptoWallet    || userProfile.walletAddress || '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, {
        mpesaPayoutType:    mpesaType,
        mpesaPayoutPhone:   mpesaType === 'phone'   ? mpesaPhone   : undefined,
        mpesaPayoutTill:    mpesaType === 'till'    ? mpesaTill    : undefined,
        mpesaPayoutPaybill: mpesaType === 'paybill' ? mpesaPaybill : undefined,
        mpesaPayoutAccount: mpesaType === 'paybill' ? mpesaAccount : undefined,
        cryptoWallet:       cryptoWallet || undefined,
        walletAddress:      cryptoWallet || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      updateUser({ walletAddress: cryptoWallet });
      toast({ title: 'Payment Settings Saved', description: 'Your payout configuration has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isComplete = mpesaType === 'phone'
    ? !!mpesaPhone
    : mpesaType === 'till'
    ? !!mpesaTill
    : !!(mpesaPaybill && mpesaAccount);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Settings className="w-4 h-4 mr-1" /> Payment Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Payment Settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure where AutoPayKe sends your 90% earnings after each completed booking.
          </p>
        </DialogHeader>

        <Tabs value={mpesaType} onValueChange={setMpesaType} className="mt-2">
          {/* ── M-Pesa section ─────────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">M-Pesa Payout</span>
              {isComplete && <Badge variant="outline" className="text-[10px] border-success/40 text-success gap-1"><CheckCircle className="w-3 h-3" /> Configured</Badge>}
            </div>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="phone">Send Money</TabsTrigger>
              <TabsTrigger value="till">Buy Goods (Till)</TabsTrigger>
              <TabsTrigger value="paybill">Paybill</TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="space-y-3 mt-0">
              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                AutoPayKe will send your earnings directly to this M-Pesa number via B2C transfer.
              </div>
              <div className="space-y-1.5">
                <Label>M-Pesa Phone Number</Label>
                <Input
                  placeholder="0712 345 678 or 254712345678"
                  value={mpesaPhone}
                  onChange={e => setMpesaPhone(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="till" className="space-y-3 mt-0">
              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                For Buy Goods (Till) payouts. AutoFlow uses Daraja B2B to send earnings to your till.
                Contact Safaricom Business to confirm B2B support for your till.
              </div>
              <div className="space-y-1.5">
                <Label>Till Number</Label>
                <Input
                  placeholder="e.g. 5678901"
                  value={mpesaTill}
                  onChange={e => setMpesaTill(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="paybill" className="space-y-3 mt-0">
              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                For Paybill payouts. AutoFlow sends earnings to your Paybill business number.
                Contact Safaricom Business to confirm B2B support for your Paybill.
              </div>
              <div className="space-y-1.5">
                <Label>Paybill Business Number</Label>
                <Input
                  placeholder="e.g. 400200"
                  value={mpesaPaybill}
                  onChange={e => setMpesaPaybill(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Account Number</Label>
                <Input
                  placeholder="Your account name or number"
                  value={mpesaAccount}
                  onChange={e => setMpesaAccount(e.target.value)}
                />
              </div>
            </TabsContent>
          </div>

          {/* ── Crypto wallet section ─────────────────────────────────────── */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Crypto Wallet (Avalanche)</span>
              {cryptoWallet && <Badge variant="outline" className="text-[10px] border-success/40 text-success gap-1"><CheckCircle className="w-3 h-3" /> Connected</Badge>}
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Your Avalanche C-Chain wallet (Core, MetaMask, Trust Wallet). Crypto payments
              are split 90/10 via smart contract — 90% goes directly to this address.
            </div>
            <div className="space-y-1.5">
              <Label>Wallet Address (0x...)</Label>
              <Input
                placeholder="0xYourAvalancheWalletAddress"
                value={cryptoWallet}
                onChange={e => setCryptoWallet(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            {cryptoWallet && (
              <a
                href={`https://snowtrace.io/address/${cryptoWallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> View on SnowTrace
              </a>
            )}
          </div>

          {/* ── Save ─────────────────────────────────────────────────────── */}
          <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
          </Button>

          {/* ── Setup guide links ─────────────────────────────────────────── */}
          <div className="border-t border-border pt-3 mt-1">
            <p className="text-xs text-muted-foreground font-medium mb-2">Setup Guides</p>
            <div className="space-y-1">
              <a href="https://developer.safaricom.co.ke/APIs/BusinessToCustomer" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <ExternalLink className="w-3 h-3" /> Daraja B2C — enable on your shortcode
              </a>
              <a href="https://core.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <ExternalLink className="w-3 h-3" /> Core Wallet — recommended for Avalanche
              </a>
              <a href="https://snowtrace.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <ExternalLink className="w-3 h-3" /> SnowTrace — verify your transactions
              </a>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OwnerPayments() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<any[]>('/payments/transactions'),
  });

  const total90 = transactions
    .filter((t: any) => ['captured', 'completed', 'released'].includes(t.status))
    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount || '0') * 0.9), 0);

  return (
    <DashboardLayout>
      <PageHeader
        title="Payments"
        subtitle="Track transactions and configure your payout settings"
        action={<PaymentSettingsDialog />}
      />

      {/* Summary strip */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Collected</p>
            <p className="font-display text-foreground">KES {transactions.reduce((s: number, t: any) => s + parseFloat(t.amount || '0'), 0).toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Your Earnings (90%)</p>
            <p className="font-display text-success">KES {Math.floor(total90).toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="font-display text-foreground">{transactions.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Platform Fee (10%)</p>
            <p className="font-display text-muted-foreground">KES {Math.floor(transactions.reduce((s: number, t: any) => s + parseFloat(t.amount || '0'), 0) * 0.1).toLocaleString()}</p>
          </div>
        </div>
      )}

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
                  <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Your 90%</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-4 text-foreground whitespace-nowrap">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-foreground">{t.customerName || '—'}</td>
                    <td className="p-4 text-foreground text-xs">{t.serviceName || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-primary/10 text-primary">
                          {methodIcons[t.method] || <Wallet className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-xs font-medium uppercase">{t.method}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-foreground">
                      {t.cryptoTxHash ? (
                        <a
                          href={`https://snowtrace.io/tx/${t.cryptoTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {t.cryptoTxHash.slice(0, 10)}… <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : t.mpesaCode || '—'}
                    </td>
                    <td className="p-4 text-right font-display text-foreground">
                      KES {parseFloat(t.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-display text-success">
                      KES {Math.floor(parseFloat(t.amount || 0) * 0.9).toLocaleString()}
                    </td>
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
