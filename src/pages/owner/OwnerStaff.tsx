import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Phone, UserPlus, Loader2, Trash2, Edit, Droplets, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  totalWashes: number;
  createdAt: string;
};

type StaffForm = { name: string; phone: string; notes: string };
const emptyForm: StaffForm = { name: '', phone: '', notes: '' };

// ─── StaffForm component (outside parent to prevent focus loss) ───────────────

interface StaffFormProps {
  form: StaffForm;
  setForm: React.Dispatch<React.SetStateAction<StaffForm>>;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}

function StaffFormFields({ form, setForm, onSave, saving, saveLabel }: StaffFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="staff-name">Full Name <span className="text-destructive">*</span></Label>
        <Input
          id="staff-name"
          placeholder="e.g. James Kamau"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-phone">Phone <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="staff-phone"
          placeholder="+254 7XX XXX XXX"
          value={form.phone}
          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-notes">Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          id="staff-notes"
          placeholder="e.g. specialises in interior detailing, Mon–Fri only"
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={2}
        />
      </div>
      <Button className="w-full" onClick={onSave} disabled={saving || !form.name.trim()}>
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : saveLabel}
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerStaff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [addForm, setAddForm] = useState<StaffForm>(emptyForm);
  const [editForm, setEditForm] = useState<StaffForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: () => api.get<StaffMember[]>('/users/staff'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['owner-staff'] });

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/users/staff', {
        name: addForm.name.trim(),
        phone: addForm.phone.trim() || undefined,
        notes: addForm.notes.trim() || undefined,
      });
      invalidate();
      setAddOpen(false);
      setAddForm(emptyForm);
      toast({ title: 'Staff Added', description: `${addForm.name} has been added to your team.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingStaff || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/users/staff/${editingStaff.id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        notes: editForm.notes.trim() || null,
      });
      invalidate();
      setEditOpen(false);
      setEditingStaff(null);
      toast({ title: 'Staff Updated', description: `${editForm.name} has been updated.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: StaffMember) => {
    setDeleting(s.id);
    try {
      await api.delete(`/users/staff/${s.id}`);
      invalidate();
      toast({ title: 'Staff Removed', description: `${s.name} has been removed from your team.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const totalWashes = staff.reduce((sum, s) => sum + (s.totalWashes || 0), 0);

  return (
    <DashboardLayout>
      <PageHeader
        title="Staff"
        subtitle={
          staff.length > 0
            ? `${staff.length} team member${staff.length !== 1 ? 's' : ''} · ${totalWashes} total washes tracked`
            : 'Manage your wash team'
        }
        action={
          <Button size="sm" onClick={() => { setAddOpen(true); setAddForm(emptyForm); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Staff
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading staff…
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No staff yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your team members — they don't need to have an AutoFlow account.
            You'll assign bookings to them directly from the Bookings page.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display text-xl shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-foreground truncate">{s.name}</p>
                  <span className="text-xs text-muted-foreground">Team member</span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                {s.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3 h-3 shrink-0" /> {s.phone}
                  </p>
                )}
                {s.notes && (
                  <p className="text-xs italic line-clamp-2">{s.notes}</p>
                )}
              </div>

              {/* Wash count */}
              <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <Droplets className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-display text-foreground">{s.totalWashes}</p>
                  <p className="text-xs text-muted-foreground">washes completed</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm" className="flex-1"
                  onClick={() => {
                    setEditingStaff(s);
                    setEditForm({ name: s.name, phone: s.phone || '', notes: s.notes || '' });
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
      )}

      {/* Add Staff Dialog */}
      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) setAddForm(emptyForm); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Team Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            No AutoFlow account needed — just enter their name. You can assign bookings to them directly.
          </p>
          <StaffFormFields
            form={addForm}
            setForm={setAddForm}
            onSave={handleAdd}
            saving={saving}
            saveLabel="Add to Team"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditingStaff(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit {editingStaff?.name ?? 'Staff'}</DialogTitle>
          </DialogHeader>
          <StaffFormFields
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
