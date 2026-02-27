import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Droplets, Clock, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceFormData = {
  name: string;
  description: string;
  price: string;
  duration: string;
  category: string;
};

const emptyForm: ServiceFormData = {
  name: '', description: '', price: '', duration: '', category: 'Basic',
};

// ─── ServiceForm (must live OUTSIDE the parent to avoid unmount on re-render) ─

interface ServiceFormProps {
  form: ServiceFormData;
  setForm: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}

function ServiceForm({ form, setForm, onSave, saving, saveLabel }: ServiceFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="svc-name">Service Name</Label>
        <Input
          id="svc-name"
          placeholder="e.g. Express Wash"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="svc-desc">Description</Label>
        <Textarea
          id="svc-desc"
          placeholder="Describe what's included in this service..."
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="svc-price">Price (KES)</Label>
          <Input
            id="svc-price"
            type="number"
            min="0"
            placeholder="500"
            value={form.price}
            onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="svc-duration">Duration (min)</Label>
          <Input
            id="svc-duration"
            type="number"
            min="1"
            placeholder="30"
            value={form.duration}
            onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="svc-category">Category</Label>
        <Input
          id="svc-category"
          placeholder="e.g. Basic, Premium, Full Detail"
          value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          Used to group services for customers. E.g. Basic, Premium, Full Detail.
        </p>
      </div>

      <Button className="w-full" onClick={onSave} disabled={saving}>
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : saveLabel}
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerServices() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [createForm, setCreateForm] = useState<ServiceFormData>(emptyForm);
  const [editForm, setEditForm] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ONLY this owner's services (active + inactive) — scoped by ownerId
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', user?.id],
    queryFn: () => api.get<any[]>(`/services?ownerId=${user!.id}`),
    enabled: !!user?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['services'] });

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.price || !createForm.duration) {
      toast({ title: 'Required', description: 'Name, price, and duration are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/services', {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        price: parseFloat(createForm.price),
        duration: parseInt(createForm.duration),
        category: createForm.category.trim() || 'Basic',
      });
      invalidate();
      setCreateOpen(false);
      setCreateForm(emptyForm);
      toast({ title: 'Service Created', description: `"${createForm.name}" is now live for customers.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingService || !editForm.name.trim() || !editForm.price) return;
    setSaving(true);
    try {
      await api.put(`/services/${editingService.id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        price: parseFloat(editForm.price),
        duration: parseInt(editForm.duration),
        category: editForm.category.trim() || 'Basic',
      });
      invalidate();
      setEditOpen(false);
      setEditingService(null);
      toast({ title: 'Service Updated', description: `"${editForm.name}" has been saved.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: any) => {
    setToggling(s.id);
    try {
      await api.patch(`/services/${s.id}`, { isActive: !s.isActive });
      invalidate();
      toast({
        title: s.isActive ? 'Service Hidden' : 'Service Active',
        description: s.isActive
          ? `"${s.name}" is now hidden from customers.`
          : `"${s.name}" is now visible to customers.`,
      });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (s: any) => {
    setDeleting(s.id);
    try {
      await api.delete(`/services/${s.id}`);
      invalidate();
      toast({ title: 'Service Deleted', description: `"${s.name}" has been removed.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const activeCount = services.filter((s: any) => s.isActive).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <PageHeader
        title="Services"
        subtitle={
          services.length > 0
            ? `${activeCount} of ${services.length} service${services.length !== 1 ? 's' : ''} visible to customers`
            : 'Manage your service offerings'
        }
        action={
          <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setCreateForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Service</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Service</DialogTitle>
              </DialogHeader>
              <ServiceForm
                form={createForm}
                setForm={setCreateForm}
                onSave={handleCreate}
                saving={saving}
                saveLabel="Create Service"
              />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading services…
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <Droplets className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No services yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first service so customers can book it at your locations.
          </p>
        </div>
      ) : (
        <>
          {activeCount === 0 && services.length > 0 && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
              ⚠️ You have {services.length} service{services.length !== 1 ? 's' : ''} but none are active — customers won't see any services at your locations until you enable at least one.
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s: any) => (
              <div
                key={s.id}
                className={`p-5 rounded-xl border shadow-card transition-opacity ${
                  s.isActive ? 'bg-card border-border' : 'bg-muted/30 border-border/50 opacity-70'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${s.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Droplets className={`w-4 h-4 ${s.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <Badge variant={s.isActive ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                      {s.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {toggling === s.id
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      : s.isActive
                        ? <ToggleRight className="w-4 h-4 text-primary" />
                        : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    }
                    <Switch
                      checked={s.isActive}
                      disabled={toggling === s.id}
                      onCheckedChange={() => handleToggle(s)}
                    />
                  </div>
                </div>

                {/* Name & description */}
                <p className="font-display text-lg text-foreground mb-1">{s.name}</p>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{s.description || 'No description'}</p>

                {/* Price & duration */}
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg text-foreground">
                    KES {parseFloat(s.price || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {s.duration} min
                  </span>
                </div>

                {/* Status pill */}
                <div className={`mt-2 text-xs font-medium ${s.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                  {s.isActive ? '● Visible to customers' : '○ Hidden from customers'}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline" size="sm" className="flex-1"
                    onClick={() => {
                      setEditingService(s);
                      setEditForm({
                        name: s.name ?? '',
                        description: s.description ?? '',
                        price: String(s.price ?? ''),
                        duration: String(s.duration ?? ''),
                        category: s.category ?? 'Basic',
                      });
                      setEditOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    disabled={deleting === s.id}
                    onClick={() => handleDelete(s)}
                  >
                    {deleting === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit dialog — single instance outside the map */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditingService(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Edit {editingService?.name ?? 'Service'}
            </DialogTitle>
          </DialogHeader>
          <ServiceForm
            form={editForm}
            setForm={setEditForm}
            onSave={handleEdit}
            saving={saving}
            saveLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
