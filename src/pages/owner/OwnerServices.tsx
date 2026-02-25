import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockServices } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Droplets, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function OwnerServices() {
  const [open, setOpen] = useState(false);

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="Services" subtitle="Manage your service offerings"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Service</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add New Service</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Service Name</Label><Input placeholder="e.g. Express Wash" /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the service..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Price (KES)</Label><Input type="number" placeholder="500" /></div>
                  <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" placeholder="30" /></div>
                </div>
                <div className="space-y-2"><Label>Category</Label><Input placeholder="e.g. Premium" /></div>
                <Button className="w-full" onClick={() => setOpen(false)}>Create Service</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockServices.map(s => (
          <div key={s.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10"><Droplets className="w-4 h-4 text-primary" /></div>
                <span className="text-xs font-medium text-muted-foreground uppercase">{s.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={s.isActive} />
              </div>
            </div>
            <p className="font-display text-lg text-foreground mb-1">{s.name}</p>
            <p className="text-xs text-muted-foreground mb-3">{s.description}</p>
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-foreground">KES {s.price.toLocaleString()}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {s.duration} min</span>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1"><Edit className="w-3 h-3 mr-1" /> Edit</Button>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
