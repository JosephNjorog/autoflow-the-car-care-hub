import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function OwnerStaff() {
  const { toast } = useToast();

  const { data: detailers = [], isLoading } = useQuery({
    queryKey: ['detailers'],
    queryFn: () => api.get<any[]>('/users?role=detailer'),
  });

  return (
    <DashboardLayout>
      <PageHeader title="Staff" subtitle="Manage your detailers"
        action={
          <Button size="sm" onClick={() => toast({ title: 'Add Staff', description: 'Invite a detailer by sharing your business code.' })}>
            <Plus className="w-4 h-4 mr-1" /> Add Staff
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading staff...</div>
      ) : detailers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No detailers assigned yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {detailers.map((d: any) => (
            <div key={d.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-lg">
                  {(d.name || d.firstName || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-display text-foreground">{d.name || `${d.firstName} ${d.lastName}`}</p>
                  <span className={`text-xs font-medium ${d.isVerified || d.approvalStatus === 'approved' ? 'text-success' : 'text-warning'}`}>
                    {d.isVerified || d.approvalStatus === 'approved' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {d.email}</p>
                {d.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {d.phone}</p>}
                <p>Joined: {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
