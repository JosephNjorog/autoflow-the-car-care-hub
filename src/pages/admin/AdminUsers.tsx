import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const { toast } = useToast();

  return (
    <DashboardLayout role="admin" userName="Sarah Njeri">
      <PageHeader title="User Management" subtitle="Manage all users in the system" />
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
              {mockUsers.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{u.name.charAt(0)}</div>
                      <span className="text-foreground font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{u.email}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{u.phone}</td>
                  <td className="p-4"><span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">{u.role}</span></td>
                  <td className="p-4"><span className={`text-xs font-medium ${u.isVerified ? 'text-success' : 'text-warning'}`}>{u.isVerified ? 'Verified' : 'Pending'}</span></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit User', description: `Editing ${u.name}'s profile.` })}><Edit className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast({ title: 'User Removed', description: `${u.name} has been removed.`, variant: 'destructive' })}><Trash2 className="w-3 h-3" /></Button>
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
