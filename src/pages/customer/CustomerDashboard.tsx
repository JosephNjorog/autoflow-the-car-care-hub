import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, StatusBadge, PageHeader } from '@/components/shared/SharedComponents';
import { mockBookings, mockLoyalty } from '@/data/mockData';
import { Calendar, Car, Star, CreditCard, Droplets, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function CustomerDashboard() {
  const upcomingBookings = mockBookings.filter(b => b.customerId === 'u1' && ['pending', 'confirmed', 'in_progress'].includes(b.status));
  const completedCount = mockBookings.filter(b => b.customerId === 'u1' && b.status === 'completed').length;

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Welcome back, James" subtitle="Here's what's happening with your car care." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Upcoming Bookings" value={upcomingBookings.length} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Completed Services" value={completedCount} icon={<Car className="w-5 h-5" />} />
        <StatCard title="Loyalty Points" value={mockLoyalty.totalPoints.toLocaleString()} subtitle={`${mockLoyalty.tier} tier`} icon={<Star className="w-5 h-5" />} />
        <StatCard title="Total Spent" value="KES 21,500" icon={<CreditCard className="w-5 h-5" />} trend={{ value: '12% this month', positive: true }} />
      </div>

      {/* Quick actions */}
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

      {/* Upcoming bookings */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">Upcoming Bookings</h3>
          <Link to="/customer/bookings"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No upcoming bookings. Book a wash!</p>
          ) : upcomingBookings.map((b) => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
              <div>
                <p className="font-medium text-foreground text-sm">{b.serviceName}</p>
                <p className="text-xs text-muted-foreground">{b.vehicleName} · {b.locationName}</p>
                <p className="text-xs text-muted-foreground">{b.date} at {b.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                <span className="text-sm font-medium text-foreground">KES {b.servicePrice.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
