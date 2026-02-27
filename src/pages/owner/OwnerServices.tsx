import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Droplets, Clock, Loader2, ToggleLeft, ToggleRight, BookOpen, CheckCircle } from 'lucide-react';
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

type ServiceTemplate = {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  defaultDuration: number;
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
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ONLY this owner's services (active + inactive) — scoped by ownerId
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', user?.id],
    queryFn: () => api.get<any[]>(`/services?ownerId=${user!.id}`),
    enabled: !!user?.id,
  });

  // Fetch the global service catalog (templates)
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['service-templates'],
    queryFn: () => api.get<ServiceTemplate[]>('/services/templates'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['services'] });

  // Set of service names the owner already has (for "already added" state in catalog)
  const ownedNames = new Set(services.map((s: any) => s.name.toLowerCase()));

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

  const handleAddTemplate = async (template: ServiceTemplate) => {
    setAddingTemplate(template.id);
    try {
      await api.post('/services', { templateId: template.id });
      invalidate();
      toast({
        title: 'Service Added & Active',
        description: `"${template.name}" is now visible to customers. Go to My Services to adjust the price or hide it.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      if (msg.toLowerCase().includes('already')) {
        toast({ title: 'Already Added', description: msg });
      } else {
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    } finally {
      setAddingTemplate(null);
    }
  };

  const activeCount = services.filter((s: any) => s.isActive).length;

  // Group templates by category for the catalog view
  const templatesByCategory = templates.reduce<Record<string, ServiceTemplate[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

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

      <Tabs defaultValue="my-services">
        <TabsList className="mb-6">
          <TabsTrigger value="my-services">My Services</TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Service Catalog
          </TabsTrigger>
        </TabsList>

        {/* ── My Services Tab ─────────────────────────────────────────────── */}
        <TabsContent value="my-services">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading services…
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <Droplets className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No services yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Add your first service manually or browse the Service Catalog to get started quickly.
              </p>
            </div>
          ) : (
            <>
              {activeCount === 0 && services.length > 0 && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ None of your {services.length} service{services.length !== 1 ? 's are' : ' is'} active — customers won't see any services until you enable at least one using the toggle on each card.
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
        </TabsContent>

        {/* ── Service Catalog Tab ─────────────────────────────────────────── */}
        <TabsContent value="catalog">
          <div className="mb-5 p-4 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-0.5">Browse the Service Catalog</p>
            Browse standard car wash services below. Click <strong>Add to My Services</strong> to copy one to your account — then adjust the price, duration, and activate it when you're ready.
          </div>

          {templatesLoading ? (
            <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading catalog…
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(templatesByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-display text-base text-foreground mb-3 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    {category}
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(t => {
                      const alreadyAdded = ownedNames.has(t.name.toLowerCase());
                      return (
                        <div
                          key={t.id}
                          className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t.category}</Badge>
                          </div>
                          <p className="font-display text-base text-foreground mb-1">{t.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 flex-1 mb-3">
                            {t.description || 'No description'}
                          </p>
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-display text-foreground">
                              KES {t.defaultPrice.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" /> {t.defaultDuration} min
                            </span>
                          </div>
                          {alreadyAdded ? (
                            <Button variant="outline" size="sm" className="w-full text-success border-success/30" disabled>
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Added
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              disabled={addingTemplate === t.id}
                              onClick={() => handleAddTemplate(t)}
                            >
                              {addingTemplate === t.id
                                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Adding…</>
                                : <><Plus className="w-3.5 h-3.5 mr-1.5" /> Add to My Services</>
                              }
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
