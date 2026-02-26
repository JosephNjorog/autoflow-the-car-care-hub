import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function CustomerVehicles() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ make: '', model: '', year: '', color: '', licensePlate: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<any[]>('/vehicles'),
  });

  const handleAdd = async () => {
    if (!form.make || !form.model) {
      toast({ title: 'Required', description: 'Make and model are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/vehicles', {
        make: form.make,
        model: form.model,
        year: form.year ? parseInt(form.year) : undefined,
        color: form.color,
        licensePlate: form.licensePlate,
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setOpen(false);
      setForm({ make: '', model: '', year: '', color: '', licensePlate: '' });
      toast({ title: 'Vehicle Added', description: 'New vehicle has been registered.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add vehicle';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id);
    try {
      await api.delete(`/vehicles/${id}`);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: 'Vehicle Removed', description: `${name} has been removed.`, variant: 'destructive' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove vehicle';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="My Vehicles" subtitle="Manage your registered vehicles"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Vehicle</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add New Vehicle</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Make</Label><Input placeholder="Toyota" value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Model</Label><Input placeholder="Prado" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Year</Label><Input type="number" placeholder="2024" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Color</Label><Input placeholder="White" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>License Plate</Label><Input placeholder="KDA 123A" value={form.licensePlate} onChange={e => setForm(p => ({ ...p, licensePlate: e.target.value }))} /></div>
                <Button className="w-full" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Vehicle'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No vehicles yet. Add your first vehicle!</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v: any) => (
            <div key={v.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-primary/10"><Car className="w-5 h-5 text-primary" /></div>
                <button
                  onClick={() => handleDelete(v.id, `${v.make} ${v.model}`)}
                  disabled={deleting === v.id}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="font-display text-lg text-foreground">{v.make} {v.model}</p>
              <p className="text-sm text-muted-foreground">{v.year} · {v.color}</p>
              <p className="text-sm font-medium text-primary mt-2">{v.licensePlate}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
