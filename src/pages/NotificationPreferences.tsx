import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Calendar, CreditCard, MessageSquare, Star, Shield, Smartphone, Mail } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface NotifPref {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

const defaultPrefs: NotifPref[] = [
  { id: 'new_booking', label: 'New Booking', description: 'When a new booking is created', icon: <Calendar className="w-4 h-4" />, inApp: true, email: true, push: true },
  { id: 'booking_confirmed', label: 'Booking Confirmed', description: 'When a booking is confirmed', icon: <Calendar className="w-4 h-4" />, inApp: true, email: true, push: true },
  { id: 'service_started', label: 'Service Started', description: 'When a detailer starts your service', icon: <Bell className="w-4 h-4" />, inApp: true, email: false, push: true },
  { id: 'service_completed', label: 'Service Completed', description: 'When your service is done', icon: <Bell className="w-4 h-4" />, inApp: true, email: true, push: true },
  { id: 'payment_received', label: 'Payment Received', description: 'When a payment is processed', icon: <CreditCard className="w-4 h-4" />, inApp: true, email: true, push: false },
  { id: 'review_received', label: 'Review Received', description: 'When someone leaves a review', icon: <Star className="w-4 h-4" />, inApp: true, email: false, push: false },
  { id: 'photos_uploaded', label: 'Job Photos', description: 'Before/after photos uploaded', icon: <MessageSquare className="w-4 h-4" />, inApp: true, email: false, push: true },
  { id: 'system_updates', label: 'System Updates', description: 'Platform updates and announcements', icon: <Shield className="w-4 h-4" />, inApp: true, email: true, push: false },
];

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const togglePref = (id: string, channel: 'inApp' | 'email' | 'push') => {
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, [channel]: !p[channel] } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const preferences = prefs.reduce((acc, p) => {
        acc[p.id] = { inApp: p.inApp, email: p.email, push: p.push };
        return acc;
      }, {} as Record<string, { inApp: boolean; email: boolean; push: boolean }>);
      await api.post('/notifications/preferences', { preferences });
      toast({ title: 'Preferences Saved', description: 'Your notification preferences have been updated.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save preferences', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Notification Preferences" subtitle="Choose how and when you receive notifications" />

      <div className="max-w-3xl space-y-6">
        {/* Channel legend */}
        <div className="hidden sm:flex items-center gap-6 p-4 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="w-4 h-4" /> <span>In-App</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" /> <span>Email</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="w-4 h-4" /> <span>Push</span>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {prefs.map((pref, i) => (
            <div key={pref.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 ${i < prefs.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">{pref.icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground sm:w-10"><Bell className="w-3 h-3 sm:hidden" /><span className="hidden sm:inline">In-App</span></Label>
                  <Switch checked={pref.inApp} onCheckedChange={() => togglePref(pref.id, 'inApp')} />
                </div>
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground sm:w-10"><Mail className="w-3 h-3 sm:hidden" /><span className="hidden sm:inline">Email</span></Label>
                  <Switch checked={pref.email} onCheckedChange={() => togglePref(pref.id, 'email')} />
                </div>
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground sm:w-10"><Smartphone className="w-3 h-3 sm:hidden" /><span className="hidden sm:inline">Push</span></Label>
                  <Switch checked={pref.push} onCheckedChange={() => togglePref(pref.id, 'push')} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Push notification permission */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent"><Smartphone className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Browser Push Notifications</p>
                <p className="text-xs text-muted-foreground">Allow AutoPayKe to send you push notifications</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              Notification.requestPermission().then(perm => {
                toast({ title: perm === 'granted' ? 'Push Enabled' : 'Push Denied', description: perm === 'granted' ? 'You will now receive push notifications.' : 'Push notifications were not enabled.' });
              });
            }}>
              Enable Push
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</Button>
      </div>
    </DashboardLayout>
  );
}