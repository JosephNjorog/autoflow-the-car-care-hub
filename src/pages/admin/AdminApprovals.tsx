import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialApprovals = [
  { id: 'a1', type: 'owner', name: 'John Kariuki', business: 'Sparkle Auto Wash', email: 'john@sparkle.co.ke', date: '2026-02-24' },
  { id: 'a2', type: 'owner', name: 'Anne Mutua', business: 'Clean Drive Kenya', email: 'anne@cleandrive.co.ke', date: '2026-02-23' },
];

export default function AdminApprovals() {
  const [approvals, setApprovals] = useState(initialApprovals);
  const { toast } = useToast();

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    const item = approvals.find(a => a.id === id);
    setApprovals(prev => prev.filter(a => a.id !== id));
    toast({
      title: action === 'approve' ? 'Approved' : 'Rejected',
      description: `${item?.business} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
    });
  };

  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="Approvals" subtitle="Review pending registrations and requests" />
      <div className="space-y-4">
        {approvals.map(a => (
          <div key={a.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10"><Building className="w-5 h-5 text-warning" /></div>
                <div>
                  <p className="font-display text-foreground">{a.business}</p>
                  <p className="text-sm text-muted-foreground">{a.name} · {a.email}</p>
                  <p className="text-xs text-muted-foreground">Applied: {a.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleAction(a.id, 'approve')}><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleAction(a.id, 'reject')}><X className="w-3 h-3 mr-1" /> Reject</Button>
              </div>
            </div>
          </div>
        ))}
        {approvals.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No pending approvals. All caught up! 🎉</div>
        )}
      </div>
    </DashboardLayout>
  );
}
