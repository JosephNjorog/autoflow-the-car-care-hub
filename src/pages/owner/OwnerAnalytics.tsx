import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard } from '@/components/shared/SharedComponents';
import { DollarSign, Calendar, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/lib/api';

const COLORS = ['hsl(152,35%,25%)', 'hsl(36,80%,55%)', 'hsl(200,60%,50%)', 'hsl(0,72%,51%)', 'hsl(150,10%,45%)'];

export default function OwnerAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get<any>('/analytics'),
  });

  const totalRevenue = analytics?.totalRevenue || 0;
  const totalBookings = analytics?.totalBookings || 0;
  const completedBookings = analytics?.completedBookings || 0;
  const averageRating = analytics?.averageRating || 0;
  const revenueByMonth = analytics?.revenueByMonth || [];
  const bookingsByStatus = analytics?.bookingsByStatus || [];
  const popularServices = analytics?.popularServices || [];
  const customerGrowth = analytics?.customerGrowth || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Analytics" subtitle="Insights into your business performance" />
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="Analytics" subtitle="Insights into your business performance" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value={`KES ${(totalRevenue / 1000).toFixed(0)}K`} icon={<DollarSign className="w-5 h-5" />} trend={{ value: '18%', positive: true }} />
        <StatCard title="Total Bookings" value={totalBookings} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Completion Rate" value={totalBookings ? `${((completedBookings / totalBookings) * 100).toFixed(0)}%` : '—'} icon={<Star className="w-5 h-5" />} />
        <StatCard title="Avg Rating" value={averageRating ? parseFloat(averageRating).toFixed(1) : '—'} icon={<Star className="w-5 h-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Revenue by Month</h3>
          {revenueByMonth.length > 0 ? (
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
          ) : <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No revenue data yet.</div>}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Customer Growth</h3>
          {customerGrowth.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(40,20%,88%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150,10%,45%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(150,10%,45%)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="customers" stroke="hsl(36,80%,55%)" strokeWidth={2} dot={{ fill: 'hsl(36,80%,55%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No customer data yet.</div>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Popular Services</h3>
          {popularServices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {popularServices.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.count} bookings</p>
                  </div>
                  <span className="font-display text-foreground">KES {parseFloat(s.revenue || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Bookings by Status</h3>
          {bookingsByStatus.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingsByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="status" label={({ status, count }: any) => `${status}: ${count}`}>
                    {bookingsByStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No booking data yet.</div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
