import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Mail, Phone, Search, UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type AddMode = 'search' | 'create';

export default function OwnerStaff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMode>('search');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [newForm, setNewForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const { data: detailers = [], isLoading } = useQuery({
    queryKey: ['owner-detailers'],
    queryFn: () => api.get<any[]>('/users?role=detailer'),
  });

  const handleSearch = async () => {
    if (!searchEmail) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const result = await api.get<any>(`/users/lookup?email=${encodeURIComponent(searchEmail)}&role=detailer`);
      setSearchResult(result);
    } catch {
      toast({ title: 'Not found', description: 'No detailer account found with that email.', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    if (!searchResult) return;
    setLinking(true);
    try {
      await api.post('/users/staff', { detailerId: searchResult.id });
      queryClient.invalidateQueries({ queryKey: ['owner-detailers'] });
      toast({ title: 'Staff added', description: `${searchResult.name} has been added to your team.` });
      setOpen(false);
      resetDialog();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setLinking(false);
    }
  };

  const handleCreate = async () => {
    const { firstName, lastName, email } = newForm;
    if (!firstName || !lastName || !email) {
      toast({ title: 'Required fields missing', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      // Generate a random password if not provided
      const password = newForm.password || Math.random().toString(36).slice(-10) + 'A1!';
      const created = await api.post<any>('/users/staff', {
        create: true,
        firstName, lastName, email,
        phone: newForm.phone || undefined,
        password,
      });
      setTempPassword(password);
      queryClient.invalidateQueries({ queryKey: ['owner-detailers'] });
      toast({ title: 'Staff created', description: `${firstName}'s account is ready.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const resetDialog = () => {
    setMode('search');
    setSearchEmail('');
    setSearchResult(null);
    setNewForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    setTempPassword('');
  };

  return (
    <DashboardLayout>
      <PageHeader title="Staff" subtitle="Manage your detailers"
        action={
          <Button size="sm" onClick={() => { setOpen(true); resetDialog(); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Staff
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading staff...</div>
      ) : detailers.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium mb-1">No staff yet</p>
          <p className="text-sm text-muted-foreground">Add detailers to your team to assign them to bookings.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {detailers.map((d: any) => (
            <div key={d.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-lg">
                  {(d.name || d.firstName || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-display text-foreground">{d.name || `${d.firstName} ${d.lastName}`}</p>
                  <span className={`text-xs font-medium ${d.isVerified || d.approvalStatus === 'approved' ? 'text-success' : 'text-warning'}`}>
                    {d.isVerified || d.approvalStatus === 'approved' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {d.email}</p>
                {d.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {d.phone}</p>}
                <p>Joined: {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Staff Member</DialogTitle>
          </DialogHeader>

          {tempPassword ? (
            /* Success: show temp password */
            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
                <p className="font-display text-foreground">Account Created!</p>
                <p className="text-sm text-muted-foreground">Share these credentials with your new staff member:</p>
              </div>
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{newForm.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Password:</span><span className="text-primary font-medium">{tempPassword}</span></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">They should change their password after first login.</p>
              <Button className="w-full" onClick={() => { setOpen(false); resetDialog(); }}>Done</Button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="flex gap-1 p-1 rounded-lg bg-muted mb-2">
                {(['search', 'create'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    {m === 'search' ? 'Find Existing' : 'Create New'}
                  </button>
                ))}
              </div>

              {mode === 'search' ? (
                <div className="space-y-4 pt-1">
                  <p className="text-sm text-muted-foreground">Find a detailer who already has an AutoFlow account and add them to your team.</p>
                  <div className="space-y-2">
                    <Label>Detailer's Email</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="detailer@email.com"
                        value={searchEmail}
                        onChange={e => setSearchEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      />
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
                  <p className="text-sm text-muted-foreground">Create a new detailer account. Share the credentials with them afterwards.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>First Name</Label><Input placeholder="James" value={newForm.firstName} onChange={e => setNewForm(p => ({ ...p, firstName: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Kamau" value={newForm.lastName} onChange={e => setNewForm(p => ({ ...p, lastName: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" placeholder="james@email.com" value={newForm.email} onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input placeholder="+254 7XX XXX XXX" value={newForm.phone} onChange={e => setNewForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="space-y-2">
                    <Label>Password <span className="text-xs text-muted-foreground font-normal">(auto-generated if blank)</span></Label>
                    <Input type="text" placeholder="Leave blank to auto-generate" value={newForm.password} onChange={e => setNewForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={creating}>
                    {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Staff Account'}
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
