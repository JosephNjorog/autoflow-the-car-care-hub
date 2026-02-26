import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function AdminApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => api.get<any[]>('/admin/approvals'),
  });

  const handleAction = async (id: string, action: 'approve' | 'reject', name: string) => {
    setProcessing(id);
    try {
      await api.patch('/admin/approvals', { userId: id, action });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({
        title: action === 'approve' ? 'Approved' : 'Rejected',
        description: `${name} has been ${action}d.`,
      });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setProcessing(null); }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Approvals" subtitle="Review pending registrations and requests" />
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No pending approvals. All caught up! 🎉</div>
      ) : (
        <div className="space-y-4">
          {approvals.map((a: any) => {
            const name = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
            return (
              <div key={a.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-warning/10"><Building className="w-5 h-5 text-warning" /></div>
                    <div>
                      <p className="font-display text-foreground">{name}</p>
                      <p className="text-sm text-muted-foreground">{a.email}</p>
                      {a.phone && <p className="text-xs text-muted-foreground">{a.phone}</p>}
                      <p className="text-xs text-muted-foreground">Applied: {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" disabled={processing === a.id}
                      onClick={() => handleAction(a.id, 'approve', name)}>
                      <CheckCircle className="w-3 h-3 mr-1" /> {processing === a.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" disabled={processing === a.id}
                      onClick={() => handleAction(a.id, 'reject', name)}>
                      <X className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
