import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockBookings } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Camera, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DetailerJobs() {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const jobs = mockBookings
    .filter(b => b.detailerId === 'u3')
    .filter(b => filter === 'all' || b.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <DashboardLayout role="detailer" userName="Peter Ochieng">
      <PageHeader title="My Jobs" subtitle="Manage your assigned jobs" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'in_progress', 'confirmed', 'completed'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {jobs.map(b => (
          <div key={b.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-display text-foreground">{b.serviceName}</p>
                <p className="text-sm text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
                <p className="text-sm text-muted-foreground">{b.locationName} · {b.date} at {b.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status} />
                {b.status === 'in_progress' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast({ title: 'Upload Photos', description: 'Photo upload dialog would open here.' })}><Camera className="w-3 h-3 mr-1" /> Photos</Button>
                    <Button size="sm" variant="outline" onClick={() => toast({ title: 'Live Stream Started', description: 'Agora live video stream initiated for customer.' })}><Video className="w-3 h-3 mr-1" /> Go Live</Button>
                    <Button size="sm" onClick={() => toast({ title: 'Job Completed', description: `${b.serviceName} for ${b.customerName} marked as complete.` })}>Complete</Button>
                  </div>
                )}
                {b.status === 'confirmed' && (
                  <Button size="sm" onClick={() => toast({ title: 'Job Started', description: `Started ${b.serviceName} for ${b.customerName}.` })}>Start Job</Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-center py-12 text-muted-foreground">No jobs match this filter.</p>}
      </div>
    </DashboardLayout>
  );
}
