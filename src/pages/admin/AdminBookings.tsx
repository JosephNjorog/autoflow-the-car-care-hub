import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockBookings } from '@/data/mockData';

export default function AdminBookings() {
  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="All Bookings" subtitle="System-wide booking oversight" />
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
              {mockBookings.map(b => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{b.customerName}</td>
                  <td className="p-4 text-foreground">{b.serviceName}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{b.locationName}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{b.date}</td>
                  <td className="p-4"><StatusBadge status={b.status} /></td>
                  <td className="p-4 text-right font-display text-foreground">KES {b.servicePrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
