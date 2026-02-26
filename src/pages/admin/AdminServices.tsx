import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function AdminServices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<any[]>('/services?activeOnly=false'),
  });

  const handleToggle = async (s: any, activate: boolean) => {
    setToggling(s.id);
    try {
      await api.patch(`/services/${s.id}`, { isActive: activate });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: activate ? 'Service Approved' : 'Service Rejected', description: `${s.name} has been ${activate ? 'approved' : 'rejected'}.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setToggling(null); }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Services" subtitle="Review and manage all platform services" />
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading services...</div>
      ) : (
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
                {services.map((s: any) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="p-4"><p className="font-medium text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.description}</p></td>
                    <td className="p-4 text-muted-foreground">{s.category}</td>
                    <td className="p-4 text-right font-display text-foreground">KES {parseFloat(s.price || 0).toLocaleString()}</td>
                    <td className="p-4"><span className={`text-xs font-medium ${s.isActive ? 'text-success' : 'text-warning'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!s.isActive && (
                          <Button variant="ghost" size="sm" className="text-success" disabled={toggling === s.id} onClick={() => handleToggle(s, true)}><CheckCircle className="w-3 h-3" /></Button>
                        )}
                        {s.isActive && (
                          <Button variant="ghost" size="sm" className="text-destructive" disabled={toggling === s.id} onClick={() => handleToggle(s, false)}><X className="w-3 h-3" /></Button>
                        )}
                      </div>
                    </td>
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
