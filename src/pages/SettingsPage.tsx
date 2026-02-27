import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const nameParts = (user?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [mpesaPayoutPhone, setMpesaPayoutPhone] = useState('');
  const [savingMpesa, setSavingMpesa] = useState(false);

  // Fetch full profile to get mpesaPayoutPhone (not always in auth context)
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.get<{ mpesaPayoutPhone?: string | null }>(`/users/${user?.id}`),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile?.mpesaPayoutPhone) setMpesaPayoutPhone(profile.mpesaPayoutPhone);
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, { firstName, lastName, phone });
      await refreshUser();
      toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: 'Required', description: 'Please fill both password fields.', variant: 'destructive' });
      return;
    }
    setSavingPw(true);
    try {
      await api.patch(`/users/${user?.id}`, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast({ title: 'Password Updated', description: 'Your password has been changed.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSavingPw(false); }
  };

  const handleSaveMpesa = async () => {
    if (!user) return;
    if (!mpesaPayoutPhone) {
      toast({ title: 'Required', description: 'Enter your M-Pesa payout phone number.', variant: 'destructive' });
      return;
    }
    setSavingMpesa(true);
    try {
      await api.patch(`/users/${user.id}`, { mpesaPayoutPhone });
      toast({ title: 'M-Pesa Phone Saved', description: 'Payouts will be sent to this number when customers confirm service.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSavingMpesa(false); }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Settings" subtitle="Manage your account settings" />
      <div className="max-w-lg space-y-6">
        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <h3 className="font-display text-foreground">Profile</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={user?.email || ''} disabled className="opacity-60" /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254712345678" /></div>
          <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>

        {/* M-Pesa Payout Settings — owners only */}
        {user?.role === 'owner' && (
          <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
            <div>
              <h3 className="font-display text-foreground">M-Pesa Payout</h3>
              <p className="text-xs text-muted-foreground mt-1">
                When a customer confirms service completion, AutoFlow automatically sends <strong>90%</strong> of the payment to this M-Pesa number via Safaricom B2C. AutoFlow retains 10% as platform fee.
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How it works</p>
              <p>1. Customer books and pays via M-Pesa → funds held in AutoFlow escrow</p>
              <p>2. Your detailer marks job "Ready" → customer notified to confirm</p>
              <p>3. Customer confirms pickup → 90% auto-sent to your M-Pesa below</p>
              <p>4. If customer doesn't confirm in 2 hours → payment auto-released</p>
            </div>
            <div className="space-y-2">
              <Label>M-Pesa Payout Phone Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={mpesaPayoutPhone}
                  onChange={e => setMpesaPayoutPhone(e.target.value)}
                  placeholder="0712345678 or +254712345678"
                />
              </div>
              <p className="text-xs text-muted-foreground">Must be a registered M-Pesa number. Safaricom B2C is used — no extra setup needed on your end.</p>
            </div>
            <Button onClick={handleSaveMpesa} disabled={savingMpesa}>
              {savingMpesa ? 'Saving...' : 'Save Payout Phone'}
            </Button>
          </div>
        )}

        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <h3 className="font-display text-foreground">Wallet</h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Wallet className="w-5 h-5 text-primary" />
            <code className="text-sm text-foreground flex-1">{user?.walletAddress || 'No wallet connected'}</code>
          </div>
          <Button variant="outline" onClick={() => toast({ title: 'Connecting Wallet', description: 'Opening wallet connection dialog via Tether WDK.' })}>
            <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
          </Button>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <h3 className="font-display text-foreground">Change Password</h3>
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
          <Button variant="outline" onClick={handleChangePassword} disabled={savingPw}>{savingPw ? 'Updating...' : 'Update Password'}</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
