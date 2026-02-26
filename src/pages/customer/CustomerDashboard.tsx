import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, StatusBadge, PageHeader } from '@/components/shared/SharedComponents';
import { Calendar, Car, Star, CreditCard, Droplets, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty'],
    queryFn: () => api.get<any>('/loyalty'),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<any[]>('/transactions'),
  });

  const upcomingBookings = bookings.filter((b: any) =>
    ['pending', 'confirmed', 'in_progress'].includes(b.status)
  );
  const completedCount = bookings.filter((b: any) => b.status === 'completed').length;
  const totalSpent = transactions
    .filter((t: any) => t.status === 'completed')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout>
      <PageHeader title={`Welcome back, ${firstName}`} subtitle="Here's what's happening with your car care." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Upcoming Bookings" value={upcomingBookings.length} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Completed Services" value={completedCount} icon={<Car className="w-5 h-5" />} />
        <StatCard
          title="Loyalty Points"
          value={(loyalty?.totalPoints || 0).toLocaleString()}
          subtitle={`${loyalty?.tier || 'Bronze'} tier`}
          icon={<Star className="w-5 h-5" />}
        />
        <StatCard
          title="Total Spent"
          value={`KES ${totalSpent.toLocaleString()}`}
          icon={<CreditCard className="w-5 h-5" />}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link to="/customer/book" className="flex items-center gap-4 p-5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Droplets className="w-8 h-8" />
          <div>
            <p className="font-display text-lg">Book a Wash</p>
            <p className="text-sm opacity-70">Browse services and book in 2 taps</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </Link>
        <Link to="/customer/vehicles" className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:shadow-card-hover transition-shadow">
          <Car className="w-8 h-8 text-primary" />
          <div>
            <p className="font-display text-lg text-foreground">My Vehicles</p>
            <p className="text-sm text-muted-foreground">Manage your cars</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">Upcoming Bookings</h3>
          <Link to="/customer/bookings"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No upcoming bookings. Book a wash!</p>
          ) : upcomingBookings.map((b: any) => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
              <div>
                <p className="font-medium text-foreground text-sm">{b.serviceName}</p>
                <p className="text-xs text-muted-foreground">{b.vehicleName} · {b.locationName}</p>
                <p className="text-xs text-muted-foreground">{b.date} at {b.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                <span className="text-sm font-medium text-foreground">KES {(b.servicePrice || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
