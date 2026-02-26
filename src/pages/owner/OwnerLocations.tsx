import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin, Edit, Trash2, LocateFixed, Loader2, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const emptyForm = { name: '', address: '', city: 'Nairobi', lat: '', lng: '' };

export default function OwnerLocations() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [detecting, setDetecting] = useState(false);
  const [editDetecting, setEditDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', user?.id],
    queryFn: () => api.get<any[]>(`/locations?ownerId=${user?.id}&activeOnly=false`),
    enabled: !!user?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['locations'] });

  const detectLocation = (setter: (v: Partial<typeof emptyForm>) => void, setDet: (v: boolean) => void) => {
    if (!navigator.geolocation) { toast({ title: 'Not Supported', variant: 'destructive' }); return; }
    setDet(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const updates: Partial<typeof emptyForm> = { lat: latitude.toFixed(6), lng: longitude.toFixed(6) };
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.address) {
            const road = data.address.road || data.address.suburb || '';
            const area = data.address.suburb || '';
            const city = data.address.city || data.address.town || '';
            updates.address = [road, area].filter(Boolean).join(', ');
            updates.city = city;
          }
        } catch { /* silently fail */ }
        setter(updates);
        setDet(false);
        toast({ title: 'Location Detected', description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
      },
      (err) => { setDet(false); toast({ title: 'Location Error', description: err.message, variant: 'destructive' }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreate = async () => {
    if (!form.name || !form.address) { toast({ title: 'Required', description: 'Name and address are required.', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.post('/locations', { name: form.name, address: form.address, city: form.city, lat: form.lat || undefined, lng: form.lng || undefined });
      invalidate();
      setOpen(false);
      setForm(emptyForm);
      toast({ title: 'Location Added', description: 'New location has been created.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editingId || !editForm.name) return;
    setSaving(true);
    try {
      await api.put(`/locations/${editingId}`, { name: editForm.name, address: editForm.address, city: editForm.city, lat: editForm.lat || undefined, lng: editForm.lng || undefined });
      invalidate();
      setEditOpen(false);
      setEditingId(null);
      toast({ title: 'Location Updated', description: `${editForm.name} has been updated.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id);
    try {
      await api.delete(`/locations/${id}`);
      invalidate();
      toast({ title: 'Location Deleted', description: `${name} has been removed.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  const LocationForm = ({ f, setF, det, setDet, onSave, saveLabel }: any) => (
    <div className="space-y-4 pt-2">
      <div className="space-y-2"><Label>Location Name</Label><Input placeholder="e.g. AutoFlow Westlands" value={f.name} onChange={e => setF((p: any) => ({ ...p, name: e.target.value }))} /></div>
      <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5" onClick={() => detectLocation((updates) => setF((p: any) => ({ ...p, ...updates })), setDet)} disabled={det}>
        {det ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
        {det ? 'Detecting...' : 'Use Current Location'}
      </Button>
      <div className="space-y-2"><Label>Address</Label><Input placeholder="e.g. Westlands Rd, Nairobi" value={f.address} onChange={e => setF((p: any) => ({ ...p, address: e.target.value }))} /></div>
      <div className="space-y-2"><Label>City</Label><Input placeholder="Nairobi" value={f.city} onChange={e => setF((p: any) => ({ ...p, city: e.target.value }))} /></div>
      {(f.lat || f.lng) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label className="text-xs text-muted-foreground">Latitude</Label><Input value={f.lat} onChange={e => setF((p: any) => ({ ...p, lat: e.target.value }))} className="text-sm h-9" /></div>
          <div className="space-y-2"><Label className="text-xs text-muted-foreground">Longitude</Label><Input value={f.lng} onChange={e => setF((p: any) => ({ ...p, lng: e.target.value }))} className="text-sm h-9" /></div>
        </div>
      )}
      {f.lat && f.lng && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted/50 p-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="w-4 h-4 text-primary" />
            <span>📍 {f.lat}, {f.lng}</span>
          </div>
          <iframe title="Location preview" className="w-full h-40"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(f.lng)-0.005},${Number(f.lat)-0.005},${Number(f.lng)+0.005},${Number(f.lat)+0.005}&layer=mapnik&marker=${f.lat},${f.lng}`}
            style={{ border: 0 }} />
        </div>
      )}
      <Button className="w-full" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : saveLabel}</Button>
    </div>
  );

  return (
    <DashboardLayout>
      <PageHeader title="Locations" subtitle="Manage your business locations"
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Location</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="font-display">Add Location</DialogTitle></DialogHeader>
              <LocationForm f={form} setF={setForm} det={detecting} setDet={setDetecting} onSave={handleCreate} saveLabel="Add Location" />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No locations yet. Add your first location!</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((l: any) => (
            <div key={l.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-primary/10"><MapPin className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="font-display text-foreground">{l.name}</p>
                  <p className="text-sm text-muted-foreground">{l.address}</p>
                  <p className="text-xs text-muted-foreground">{l.city}</p>
                  {l.lat && l.lng && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> {parseFloat(l.lat).toFixed(4)}, {parseFloat(l.lng).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={editOpen && editingId === l.id} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingId(null); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingId(l.id); setEditForm({ name: l.name, address: l.address, city: l.city, lat: l.lat ? String(l.lat) : '', lng: l.lng ? String(l.lng) : '' }); }}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle className="font-display">Edit {l.name}</DialogTitle></DialogHeader>
                    <LocationForm f={editForm} setF={setEditForm} det={editDetecting} setDet={setEditDetecting} onSave={handleEdit} saveLabel="Save Changes" />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" disabled={deleting === l.id} onClick={() => handleDelete(l.id, l.name)}>
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
