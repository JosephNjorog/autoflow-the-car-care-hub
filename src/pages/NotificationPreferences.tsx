import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Calendar, CreditCard, MessageSquare, Star, Shield, Smartphone, Mail } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

interface NotificationPreferencesProps {
  role: 'customer' | 'detailer' | 'owner' | 'admin';
  userName: string;
}

export default function NotificationPreferences({ role, userName }: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const { toast } = useToast();

  const togglePref = (id: string, channel: 'inApp' | 'email' | 'push') => {
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, [channel]: !p[channel] } : p));
  };

  return (
    <DashboardLayout role={role} userName={userName}>
      <PageHeader title="Notification Preferences" subtitle="Choose how and when you receive notifications" />

      <div className="max-w-3xl space-y-6">
        {/* Channel legend */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-card border border-border shadow-card">
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
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-10">In-App</Label>
                  <Switch checked={pref.inApp} onCheckedChange={() => togglePref(pref.id, 'inApp')} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-10">Email</Label>
                  <Switch checked={pref.email} onCheckedChange={() => togglePref(pref.id, 'email')} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-10">Push</Label>
                  <Switch checked={pref.push} onCheckedChange={() => togglePref(pref.id, 'push')} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Push notification permission */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent"><Smartphone className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Browser Push Notifications</p>
                <p className="text-xs text-muted-foreground">Allow AutoFlow to send you push notifications</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Push Notifications', description: 'Browser notification permission requested.' })}>
              Enable Push
            </Button>
          </div>
        </div>

        <Button onClick={() => toast({ title: 'Preferences Saved', description: 'Your notification preferences have been updated.' })}>
          Save Preferences
        </Button>
      </div>
    </DashboardLayout>
  );
}
