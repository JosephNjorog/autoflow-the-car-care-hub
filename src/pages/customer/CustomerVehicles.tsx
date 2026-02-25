import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockVehicles } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CustomerVehicles() {
  const vehicles = mockVehicles.filter(v => v.customerId === 'u1');
  const [open, setOpen] = useState(false);

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="My Vehicles" subtitle="Manage your registered vehicles"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Vehicle</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add New Vehicle</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Make</Label><Input placeholder="Toyota" /></div>
                  <div className="space-y-2"><Label>Model</Label><Input placeholder="Prado" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Year</Label><Input type="number" placeholder="2024" /></div>
                  <div className="space-y-2"><Label>Color</Label><Input placeholder="White" /></div>
                </div>
                <div className="space-y-2"><Label>License Plate</Label><Input placeholder="KDA 123A" /></div>
                <Button className="w-full" onClick={() => setOpen(false)}>Add Vehicle</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(v => (
          <div key={v.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-primary/10"><Car className="w-5 h-5 text-primary" /></div>
              <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
            <p className="font-display text-lg text-foreground">{v.make} {v.model}</p>
            <p className="text-sm text-muted-foreground">{v.year} · {v.color}</p>
            <p className="text-sm font-medium text-primary mt-2">{v.licensePlate}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
