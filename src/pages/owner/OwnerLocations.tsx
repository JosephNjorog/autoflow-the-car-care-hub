import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockLocations } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function OwnerLocations() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="Locations" subtitle="Manage your business locations"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Location</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add Location</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Location Name</Label><Input placeholder="e.g. AutoFlow Westlands" /></div>
                <div className="space-y-2"><Label>Address</Label><Input placeholder="e.g. Westlands Rd, Nairobi" /></div>
                <div className="space-y-2"><Label>City</Label><Input placeholder="Nairobi" /></div>
                <Button className="w-full" onClick={() => { setOpen(false); toast({ title: 'Location Added', description: 'New location has been created.' }); }}>Add Location</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockLocations.map(l => (
          <div key={l.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-primary/10"><MapPin className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-display text-foreground">{l.name}</p>
                <p className="text-sm text-muted-foreground">{l.address}</p>
                <p className="text-xs text-muted-foreground">{l.city}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={editOpen && editingId === l.id} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingId(null); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingId(l.id)}><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Edit {l.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2"><Label>Location Name</Label><Input defaultValue={l.name} /></div>
                    <div className="space-y-2"><Label>Address</Label><Input defaultValue={l.address} /></div>
                    <div className="space-y-2"><Label>City</Label><Input defaultValue={l.city} /></div>
                    <Button className="w-full" onClick={() => { setEditOpen(false); setEditingId(null); toast({ title: 'Location Updated', description: `${l.name} has been updated.` }); }}>Save Changes</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => toast({ title: 'Location Deleted', description: `${l.name} has been removed.`, variant: 'destructive' })}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
