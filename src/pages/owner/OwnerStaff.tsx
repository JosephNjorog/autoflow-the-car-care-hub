import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OwnerStaff() {
  const detailers = mockUsers.filter(u => u.role === 'detailer');
  const { toast } = useToast();
  const navigate = useNavigate();

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="Staff" subtitle="Manage your detailers" action={<Button size="sm" onClick={() => toast({ title: 'Add Staff', description: 'Staff invitation form would open here.' })}><Plus className="w-4 h-4 mr-1" /> Add Staff</Button>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {detailers.map(d => (
          <div key={d.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-lg">
                {d.name.charAt(0)}
              </div>
              <div>
                <p className="font-display text-foreground">{d.name}</p>
                <span className={`text-xs font-medium ${d.isVerified ? 'text-success' : 'text-warning'}`}>
                  {d.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {d.email}</p>
              <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {d.phone}</p>
              <p>Joined: {d.createdAt}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/detailer/schedule')}>View Schedule</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/detailer/jobs')}>View Jobs</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
