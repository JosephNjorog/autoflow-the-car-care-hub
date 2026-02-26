import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<any[]>('/users'),
  });

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id);
    try {
      await api.delete(`/users/${id}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User Removed', description: `${name} has been removed.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  return (
    <DashboardLayout>
      <PageHeader title="User Management" subtitle="Manage all users in the system" />
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading users...</div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{name.charAt(0)}</div>
                          <span className="text-foreground font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{u.email}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{u.phone || '—'}</td>
                      <td className="p-4"><span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">{u.role}</span></td>
                      <td className="p-4">
                        <span className={`text-xs font-medium ${u.approvalStatus === 'approved' || u.isVerified ? 'text-success' : u.approvalStatus === 'rejected' ? 'text-destructive' : 'text-warning'}`}>
                          {u.approvalStatus === 'pending' ? 'Pending' : u.approvalStatus === 'rejected' ? 'Rejected' : 'Verified'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-destructive" disabled={deleting === u.id} onClick={() => handleDelete(u.id, name)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
