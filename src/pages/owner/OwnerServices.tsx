import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Droplets, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const emptyForm = { name: '', description: '', price: '', duration: '', category: 'Basic' };

export default function OwnerServices() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<any[]>('/services'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['services'] });

  const handleCreate = async () => {
    if (!form.name || !form.price || !form.duration) {
      toast({ title: 'Required', description: 'Name, price, and duration are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/services', { name: form.name, description: form.description, price: parseFloat(form.price), duration: parseInt(form.duration), category: form.category });
      invalidate();
      setOpen(false);
      setForm(emptyForm);
      toast({ title: 'Service Created', description: 'New service has been added.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editingService || !editForm.name || !editForm.price) return;
    setSaving(true);
    try {
      await api.put(`/services/${editingService.id}`, { name: editForm.name, description: editForm.description, price: parseFloat(editForm.price), duration: parseInt(editForm.duration), category: editForm.category });
      invalidate();
      setEditOpen(false);
      setEditingService(null);
      toast({ title: 'Service Updated', description: `${editForm.name} has been updated.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleToggle = async (s: any) => {
    setToggling(s.id);
    try {
      await api.patch(`/services/${s.id}`, { isActive: !s.isActive });
      invalidate();
      toast({ title: s.isActive ? 'Service Disabled' : 'Service Enabled', description: `${s.name} has been ${s.isActive ? 'disabled' : 'enabled'}.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setToggling(null); }
  };

  const handleDelete = async (s: any) => {
    setDeleting(s.id);
    try {
      await api.delete(`/services/${s.id}`);
      invalidate();
      toast({ title: 'Service Deleted', description: `${s.name} has been removed.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Services" subtitle="Manage your service offerings"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Service</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add New Service</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Service Name</Label><Input placeholder="e.g. Express Wash" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the service..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Price (KES)</Label><Input type="number" placeholder="500" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" placeholder="30" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Category</Label><Input placeholder="e.g. Premium" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></div>
                <Button className="w-full" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Service'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No services yet. Add your first service!</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s: any) => (
            <div key={s.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Droplets className="w-4 h-4 text-primary" /></div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">{s.category}</span>
                </div>
                <Switch checked={s.isActive} disabled={toggling === s.id} onCheckedChange={() => handleToggle(s)} />
              </div>
              <p className="font-display text-lg text-foreground mb-1">{s.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{s.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-foreground">KES {parseFloat(s.price || 0).toLocaleString()}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {s.duration} min</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Dialog open={editOpen && editingService?.id === s.id} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingService(null); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingService(s); setEditForm({ name: s.name, description: s.description || '', price: String(s.price), duration: String(s.duration), category: s.category || 'Basic' }); }}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-display">Edit {s.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2"><Label>Service Name</Label><Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2"><Label>Price (KES)</Label><Input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={editForm.duration} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))} /></div>
                      </div>
                      <Button className="w-full" onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" disabled={deleting === s.id} onClick={() => handleDelete(s)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
