import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { api } from '@/lib/api';

export default function AdminBookings() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  return (
    <DashboardLayout>
      <PageHeader title="All Bookings" subtitle="System-wide booking oversight" />
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Location</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-foreground">{b.customerName}</td>
                    <td className="p-4 text-foreground">{b.serviceName}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{b.locationName}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{b.date}</td>
                    <td className="p-4"><StatusBadge status={b.status} /></td>
                    <td className="p-4 text-right font-display text-foreground">KES {(b.servicePrice || 0).toLocaleString()}</td>
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
