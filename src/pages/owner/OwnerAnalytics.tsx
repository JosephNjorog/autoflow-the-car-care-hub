import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard } from '@/components/shared/SharedComponents';
import { mockAnalytics } from '@/data/mockData';
import { DollarSign, Calendar, Star, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(152,35%,25%)', 'hsl(36,80%,55%)', 'hsl(200,60%,50%)', 'hsl(0,72%,51%)', 'hsl(150,10%,45%)'];

export default function OwnerAnalytics() {
  const { totalRevenue, totalBookings, completedBookings, averageRating, revenueByMonth, bookingsByStatus, popularServices, customerGrowth } = mockAnalytics;

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="Analytics" subtitle="Insights into your business performance" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value={`KES ${(totalRevenue / 1000).toFixed(0)}K`} icon={<DollarSign className="w-5 h-5" />} trend={{ value: '18%', positive: true }} />
        <StatCard title="Total Bookings" value={totalBookings} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Completion Rate" value={`${((completedBookings / totalBookings) * 100).toFixed(0)}%`} icon={<Star className="w-5 h-5" />} />
        <StatCard title="Avg Rating" value={averageRating} icon={<Star className="w-5 h-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Revenue by Month</h3>
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

        {/* Customer growth */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Customer Growth</h3>
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
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular services */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Popular Services</h3>
          <div className="space-y-3">
            {popularServices.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.count} bookings</p>
                </div>
                <span className="font-display text-foreground">KES {s.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings by status */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-display text-foreground mb-4">Bookings by Status</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingsByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="status" label={({ status, count }) => `${status}: ${count}`}>
                  {bookingsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
