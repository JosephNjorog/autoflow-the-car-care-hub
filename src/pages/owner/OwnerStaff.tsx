import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Phone, Mail, UserPlus, Loader2, Trash2, Edit, Droplets, Users, Search, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type OfflineStaff = { id: string; name: string; phone?: string; notes?: string; totalWashes: number; createdAt: string };
type OnlineDetailer = { id: string; name: string; firstName?: string; lastName?: string; email: string; phone?: string; isVerified?: boolean; createdAt: string };

type OfflineForm = { name: string; phone: string; notes: string };
const emptyOffline: OfflineForm = { name: '', phone: '', notes: '' };

// ─── Offline StaffForm (outside parent to prevent focus loss) ─────────────────

interface OfflineFormProps {
  form: OfflineForm;
  setForm: React.Dispatch<React.SetStateAction<OfflineForm>>;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}

function OfflineStaffFormFields({ form, setForm, onSave, saving, saveLabel }: OfflineFormProps) {
  return (
    <div className="space-y-4 pt-1">
      <div className="space-y-2">
        <Label htmlFor="staff-name">Full Name <span className="text-destructive">*</span></Label>
        <Input id="staff-name" placeholder="e.g. James Kamau" value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-phone">Phone <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
        <Input id="staff-phone" placeholder="+254 7XX XXX XXX" value={form.phone}
          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-notes">Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea id="staff-notes" placeholder="e.g. specialises in interior, Mon–Fri only" value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
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

  // Offline staff state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<OfflineStaff | null>(null);
  const [addForm, setAddForm] = useState<OfflineForm>(emptyOffline);
  const [editForm, setEditForm] = useState<OfflineForm>(emptyOffline);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Online detailer state (invite flow)
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<'search' | 'create'>('search');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // Data
  const { data: offlineStaff = [], isLoading: loadingOffline } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: () => api.get<OfflineStaff[]>('/users/staff'),
  });

  const { data: onlineDetailers = [], isLoading: loadingOnline } = useQuery({
    queryKey: ['owner-detailers'],
    queryFn: () => api.get<OnlineDetailer[]>('/users?role=detailer'),
  });

  const invalidateOffline = () => queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
  const invalidateOnline = () => queryClient.invalidateQueries({ queryKey: ['owner-detailers'] });

  const totalWashes = offlineStaff.reduce((sum, s) => sum + (s.totalWashes || 0), 0);

  // ── Offline CRUD ─────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/users/staff', {
        name: addForm.name.trim(),
        phone: addForm.phone.trim() || undefined,
        notes: addForm.notes.trim() || undefined,
      });
      invalidateOffline();
      setAddOpen(false);
      setAddForm(emptyOffline);
      toast({ title: 'Staff Added', description: `${addForm.name} has been added to your team.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleEditSave = async () => {
    if (!editingStaff || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/users/staff/${editingStaff.id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        notes: editForm.notes.trim() || null,
      });
      invalidateOffline();
      setEditOpen(false);
      setEditingStaff(null);
      toast({ title: 'Updated', description: `${editForm.name} has been updated.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (s: OfflineStaff) => {
    setDeleting(s.id);
    try {
      await api.delete(`/users/staff/${s.id}`);
      invalidateOffline();
      toast({ title: 'Removed', description: `${s.name} removed from team.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  // ── Online detailer flows ─────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchEmail) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const result = await api.get<any>(`/users/lookup?email=${encodeURIComponent(searchEmail)}&role=detailer`);
      setSearchResult(result);
    } catch {
      toast({ title: 'Not found', description: 'No detailer account found with that email.', variant: 'destructive' });
    } finally { setSearching(false); }
  };

  const handleLink = async () => {
    if (!searchResult) return;
    setLinking(true);
    try {
      await api.post('/users/staff', { detailerId: searchResult.id });
      invalidateOnline();
      toast({ title: 'Detailer linked', description: `${searchResult.name} has been added to your team.` });
      setInviteOpen(false);
      resetInvite();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setLinking(false); }
  };

  const handleCreate = async () => {
    const { firstName, lastName, email } = createForm;
    if (!firstName || !lastName || !email) {
      toast({ title: 'Required fields missing', variant: 'destructive' }); return;
    }
    setCreating(true);
    try {
      const password = createForm.password || Math.random().toString(36).slice(-10) + 'A1!';
      await api.post('/users/staff', { create: true, firstName, lastName, email, phone: createForm.phone || undefined, password });
      setTempPassword(password);
      invalidateOnline();
      toast({ title: 'Account created', description: `${firstName}'s detailer account is ready.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const resetInvite = () => {
    setInviteMode('search');
    setSearchEmail('');
    setSearchResult(null);
    setCreateForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    setTempPassword('');
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Staff"
        subtitle={
          offlineStaff.length > 0
            ? `${offlineStaff.length + onlineDetailers.length} team members · ${totalWashes} washes tracked`
            : 'Manage your wash team'
        }
        action={
          <Button size="sm" onClick={() => { setAddOpen(true); setAddForm(emptyOffline); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Staff
          </Button>
        }
      />

      <Tabs defaultValue="team">
        <TabsList className="mb-6">
          <TabsTrigger value="team" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Team Members
            {offlineStaff.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({offlineStaff.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="detailers" className="flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> App Detailers
            {onlineDetailers.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({onlineDetailers.length})</span>}
          </TabsTrigger>
        </TabsList>

        {/* ── Offline Team Members Tab ─────────────────────────────────── */}
        <TabsContent value="team">
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
            Add team members here — <strong>no AutoPayKe account needed</strong>. Just their name (and optional phone). You assign bookings to them from the Bookings page.
          </div>

          {loadingOffline ? (
            <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : offlineStaff.length === 0 ? (
            <div className="text-center py-14">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No team members yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Click "Add Staff" to add your first team member.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offlineStaff.map(s => (
                <div key={s.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display text-xl shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-foreground truncate">{s.name}</p>
                      <span className="text-xs text-muted-foreground">Offline team member</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    {s.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {s.phone}</p>}
                    {s.notes && <p className="text-xs italic line-clamp-2">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <Droplets className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-display text-foreground">{s.totalWashes}</p>
                      <p className="text-xs text-muted-foreground">washes completed</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => { setEditingStaff(s); setEditForm({ name: s.name, phone: s.phone || '', notes: s.notes || '' }); setEditOpen(true); }}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" disabled={deleting === s.id}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => handleDelete(s)}>
                      {deleting === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Online Detailers Tab ─────────────────────────────────────── */}
        <TabsContent value="detailers">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Detailers with AutoPayKe accounts. They can log in, view their jobs, and track their schedule.
            </p>
            <Button size="sm" variant="outline" onClick={() => { setInviteOpen(true); resetInvite(); }}>
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Detailer
            </Button>
          </div>

          {loadingOnline ? (
            <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : onlineDetailers.length === 0 ? (
            <div className="text-center py-14">
              <UserPlus className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No linked detailers</p>
              <p className="text-sm text-muted-foreground mt-1">Add detailers who have (or need) an AutoPayKe account.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineDetailers.map((d: OnlineDetailer) => (
                <div key={d.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-lg shrink-0">
                      {(d.name || d.firstName || '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-foreground truncate">{d.name || `${d.firstName} ${d.lastName}`}</p>
                      <span className={`text-xs font-medium ${d.isVerified ? 'text-success' : 'text-warning'}`}>
                        {d.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {d.email}</p>
                    {d.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {d.phone}</p>}
                    <p className="text-xs">Joined: {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Offline Staff Dialog ──────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) setAddForm(emptyOffline); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Add Team Member</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">No AutoPayKe account needed — just enter their name.</p>
          <OfflineStaffFormFields form={addForm} setForm={setAddForm} onSave={handleAdd} saving={saving} saveLabel="Add to Team" />
        </DialogContent>
      </Dialog>

      {/* ── Edit Offline Staff Dialog ─────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditingStaff(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Edit {editingStaff?.name ?? 'Staff'}</DialogTitle></DialogHeader>
          <OfflineStaffFormFields form={editForm} setForm={setEditForm} onSave={handleEditSave} saving={saving} saveLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* ── Add Online Detailer Dialog ────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={o => { setInviteOpen(o); if (!o) resetInvite(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Add Detailer</DialogTitle></DialogHeader>

          {tempPassword ? (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
                <p className="font-display text-foreground">Account Created!</p>
                <p className="text-sm text-muted-foreground">Share these credentials with your new detailer:</p>
              </div>
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{createForm.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Password:</span><span className="text-primary font-medium">{tempPassword}</span></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">They should change their password after first login.</p>
              <Button className="w-full" onClick={() => { setInviteOpen(false); resetInvite(); }}>Done</Button>
            </div>
          ) : (
            <>
              <div className="flex gap-1 p-1 rounded-lg bg-muted mb-2">
                {(['search', 'create'] as const).map(m => (
                  <button key={m} onClick={() => setInviteMode(m)}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${inviteMode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    {m === 'search' ? 'Find Existing' : 'Create Account'}
                  </button>
                ))}
              </div>

              {inviteMode === 'search' ? (
                <div className="space-y-4 pt-1">
                  <p className="text-sm text-muted-foreground">Find a detailer who already has an AutoFlow account.</p>
                  <div className="space-y-2">
                    <Label>Detailer's Email</Label>
                    <div className="flex gap-2">
                      <Input placeholder="detailer@email.com" value={searchEmail}
                        onChange={e => setSearchEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                      <Button type="button" variant="outline" onClick={handleSearch} disabled={searching || !searchEmail}>
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  {searchResult && (
                    <div className="rounded-lg border border-border p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display">
                        {searchResult.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{searchResult.name}</p>
                        <p className="text-xs text-muted-foreground">{searchResult.email}</p>
                      </div>
                      <Button size="sm" onClick={handleLink} disabled={linking}>
                        {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-sm text-muted-foreground">Create a new detailer account. Share credentials afterwards.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>First Name</Label><Input placeholder="James" value={createForm.firstName} onChange={e => setCreateForm(p => ({ ...p, firstName: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Kamau" value={createForm.lastName} onChange={e => setCreateForm(p => ({ ...p, lastName: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" placeholder="james@email.com" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input placeholder="+254 7XX XXX XXX" value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="space-y-2">
                    <Label>Password <span className="text-xs text-muted-foreground font-normal">(auto-generated if blank)</span></Label>
                    <Input type="text" placeholder="Leave blank to auto-generate" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={creating}>
                    {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : 'Create Detailer Account'}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
