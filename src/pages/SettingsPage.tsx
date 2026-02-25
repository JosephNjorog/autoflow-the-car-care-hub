import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsPageProps {
  role: 'customer' | 'detailer' | 'owner' | 'admin';
  userName: string;
}

export default function SettingsPage({ role, userName }: SettingsPageProps) {
  const { toast } = useToast();

  return (
    <DashboardLayout role={role} userName={userName}>
      <PageHeader title="Settings" subtitle="Manage your account settings" />
      <div className="max-w-lg space-y-6">
        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <h3 className="font-display text-foreground">Profile</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>First Name</Label><Input defaultValue={userName.split(' ')[0]} /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input defaultValue={userName.split(' ')[1]} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="user@email.com" /></div>
          <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+254 712 345 678" /></div>
          <Button onClick={() => toast({ title: 'Profile Updated', description: 'Your profile has been saved.' })}>Save Changes</Button>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <h3 className="font-display text-foreground">Wallet</h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Wallet className="w-5 h-5 text-primary" />
            <code className="text-sm text-foreground flex-1">0x1234...5678</code>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Wallet Disconnected', description: 'Your wallet has been disconnected.' })}>Disconnect</Button>
          </div>
          <Button variant="outline" onClick={() => toast({ title: 'Connecting Wallet', description: 'Opening wallet connection dialog.' })}><Wallet className="w-4 h-4 mr-2" /> Connect New Wallet</Button>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <h3 className="font-display text-foreground">Change Password</h3>
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
          <Button variant="outline" onClick={() => toast({ title: 'Password Updated', description: 'Your password has been changed.' })}>Update Password</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
