import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockServices } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminServices() {
  const { toast } = useToast();

  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="Services" subtitle="Review and approve services" />
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockServices.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="p-4"><p className="font-medium text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.description}</p></td>
                  <td className="p-4 text-muted-foreground">{s.category}</td>
                  <td className="p-4 text-right font-display text-foreground">KES {s.price.toLocaleString()}</td>
                  <td className="p-4"><span className={`text-xs font-medium ${s.isActive ? 'text-success' : 'text-warning'}`}>{s.isActive ? 'Active' : 'Pending'}</span></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="text-success" onClick={() => toast({ title: 'Service Approved', description: `${s.name} has been approved.` })}><CheckCircle className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast({ title: 'Service Rejected', description: `${s.name} has been rejected.` })}><X className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
