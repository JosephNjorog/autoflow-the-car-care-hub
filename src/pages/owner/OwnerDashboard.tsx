import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard, PageHeader } from '@/components/shared/SharedComponents';
import { mockBookings, mockAnalytics } from '@/data/mockData';
import { BarChart3, Calendar, DollarSign, Star, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function OwnerDashboard() {
  const { totalRevenue, totalBookings, completedBookings, averageRating, revenueByMonth } = mockAnalytics;
  const pendingBookings = mockBookings.filter(b => b.status === 'pending').length;

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="Business Dashboard" subtitle="Overview of your car wash operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value={`KES ${(totalRevenue / 1000).toFixed(0)}K`} icon={<DollarSign className="w-5 h-5" />} trend={{ value: '18% vs last month', positive: true }} />
        <StatCard title="Total Bookings" value={totalBookings} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Pending" value={pendingBookings} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard title="Avg Rating" value={averageRating} icon={<Star className="w-5 h-5" />} />
      </div>

      {/* Revenue chart */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">Revenue Trend</h3>
          <Link to="/owner/analytics"><Button variant="ghost" size="sm">Full Analytics</Button></Link>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(40,20%,88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150,10%,45%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(150,10%,45%)" tickFormatter={(v) => `${v/1000}K`} />
              <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="hsl(152,35%,25%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">Recent Bookings</h3>
          <Link to="/owner/bookings"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left pb-3 font-medium text-muted-foreground">Service</th>
                <th className="text-left pb-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left pb-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right pb-3 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockBookings.slice(0, 5).map(b => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">{b.customerName}</td>
                  <td className="py-3 text-foreground">{b.serviceName}</td>
                  <td className="py-3 text-muted-foreground hidden md:table-cell">{b.date}</td>
                  <td className="py-3"><span className={`text-xs font-medium capitalize ${b.status === 'completed' ? 'text-success' : b.status === 'pending' ? 'text-warning' : 'text-primary'}`}>{b.status.replace('_', ' ')}</span></td>
                  <td className="py-3 text-right font-display text-foreground">KES {b.servicePrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
