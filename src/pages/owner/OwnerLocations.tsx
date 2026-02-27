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

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationFormData = { name: string; address: string; city: string; lat: string; lng: string };

const emptyForm: LocationFormData = { name: '', address: '', city: 'Nairobi', lat: '', lng: '' };

// ─── LocationForm (must be defined OUTSIDE the parent component) ──────────────
// Defining it inside causes React to remount it on every keystroke, losing focus.

interface LocationFormProps {
  f: LocationFormData;
  setF: React.Dispatch<React.SetStateAction<LocationFormData>>;
  detecting: boolean;
  onDetect: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}

function LocationForm({ f, setF, detecting, onDetect, onSave, saving, saveLabel }: LocationFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="loc-name">Location Name</Label>
        <Input
          id="loc-name"
          placeholder="e.g. AutoFlow Westlands"
          value={f.name}
          onChange={e => setF(p => ({ ...p, name: e.target.value }))}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5"
        onClick={onDetect}
        disabled={detecting}
      >
        {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
        {detecting ? 'Detecting location…' : 'Use Current Location'}
      </Button>

      <div className="space-y-2">
        <Label htmlFor="loc-address">Address</Label>
        <Input
          id="loc-address"
          placeholder="e.g. Westlands Rd, Westlands"
          value={f.address}
          onChange={e => setF(p => ({ ...p, address: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="loc-city">City</Label>
        <Input
          id="loc-city"
          placeholder="Nairobi"
          value={f.city}
          onChange={e => setF(p => ({ ...p, city: e.target.value }))}
        />
      </div>

      {(f.lat || f.lng) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="loc-lat" className="text-xs text-muted-foreground">Latitude</Label>
            <Input
              id="loc-lat"
              value={f.lat}
              onChange={e => setF(p => ({ ...p, lat: e.target.value }))}
              className="text-sm h-9 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-lng" className="text-xs text-muted-foreground">Longitude</Label>
            <Input
              id="loc-lng"
              value={f.lng}
              onChange={e => setF(p => ({ ...p, lng: e.target.value }))}
              className="text-sm h-9 font-mono"
            />
          </div>
        </div>
      )}

      {f.lat && f.lng && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="w-4 h-4 text-primary shrink-0" />
            <span className="font-mono text-xs">{parseFloat(f.lat).toFixed(5)}, {parseFloat(f.lng).toFixed(5)}</span>
          </div>
          <iframe
            title="Location preview"
            className="w-full h-44"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(f.lng) - 0.005},${Number(f.lat) - 0.005},${Number(f.lng) + 0.005},${Number(f.lat) + 0.005}&layer=mapnik&marker=${f.lat},${f.lng}`}
            style={{ border: 0 }}
          />
        </div>
      )}

      <Button className="w-full" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : saveLabel}
      </Button>
    </div>
  );
}

// ─── Geocode helper ───────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'AutoFlow/1.0 (autoflowbuzz.vercel.app)' } }
  );
  if (!res.ok) throw new Error('Geocoding failed');
  return res.json() as Promise<{
    display_name: string;
    address: {
      road?: string; suburb?: string; neighbourhood?: string;
      city?: string; town?: string; county?: string;
      state?: string; country?: string;
      house_number?: string; building?: string; amenity?: string;
    };
    name?: string;
  }>;
}

function buildAddress(addr: Awaited<ReturnType<typeof reverseGeocode>>['address']) {
  // Build a human-readable address: "House# Road, Suburb"
  const parts: string[] = [];
  if (addr.house_number && addr.road) parts.push(`${addr.house_number} ${addr.road}`);
  else if (addr.road) parts.push(addr.road);
  if (addr.suburb || addr.neighbourhood) parts.push((addr.suburb || addr.neighbourhood)!);
  return parts.filter(Boolean).join(', ');
}

function extractCity(addr: Awaited<ReturnType<typeof reverseGeocode>>['address']) {
  return addr.city || addr.town || addr.county || addr.state || 'Nairobi';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerLocations() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationFormData>(emptyForm);
  const [editForm, setEditForm] = useState<LocationFormData>(emptyForm);
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

  // ── Detect current location & reverse geocode ─────────────────────────────
  const detectLocation = async (
    setter: React.Dispatch<React.SetStateAction<LocationFormData>>,
    setDet: (v: boolean) => void
  ) => {
    if (!navigator.geolocation) {
      toast({ title: 'Not Supported', description: 'Geolocation is not available in this browser.', variant: 'destructive' });
      return;
    }
    setDet(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        const updates: Partial<LocationFormData> = {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
        };
        try {
          const geo = await reverseGeocode(latitude, longitude);
          const addr = buildAddress(geo.address);
          const city = extractCity(geo.address);
          if (addr) updates.address = addr;
          if (city) updates.city = city;
          // Suggest a name from the most specific named place
          const suggestedName =
            geo.address.amenity ||
            geo.address.building ||
            geo.address.neighbourhood ||
            geo.address.suburb ||
            (addr ? addr.split(',')[0] : '');
          if (suggestedName) {
            setter(p => ({ ...p, ...updates, name: p.name || suggestedName }));
          } else {
            setter(p => ({ ...p, ...updates }));
          }
          toast({ title: 'Location Detected', description: addr || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
        } catch {
          // Geocoding failed — still save coordinates
          setter(p => ({ ...p, ...updates }));
          toast({ title: 'Coordinates Captured', description: 'Could not fetch address. You can type it manually.', variant: 'default' });
        } finally {
          setDet(false);
        }
      },
      (err) => {
        setDet(false);
        toast({ title: 'Location Error', description: err.message, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast({ title: 'Required Fields', description: 'Location name and address are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/locations', {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim() || 'Nairobi',
        lat: form.lat || undefined,
        lng: form.lng || undefined,
      });
      invalidate();
      setOpen(false);
      setForm(emptyForm);
      toast({ title: 'Location Added', description: `"${form.name}" has been created.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create location', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await api.put(`/locations/${editingId}`, {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        city: editForm.city.trim() || 'Nairobi',
        lat: editForm.lat || undefined,
        lng: editForm.lng || undefined,
      });
      invalidate();
      setEditOpen(false);
      setEditingId(null);
      toast({ title: 'Location Updated', description: `"${editForm.name}" has been saved.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update location', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id);
    try {
      await api.delete(`/locations/${id}`);
      invalidate();
      toast({ title: 'Location Deleted', description: `"${name}" has been removed.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete location', variant: 'destructive' });
    } finally {
      setDeleting(null); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <PageHeader
        title="Locations"
        subtitle="Manage your business locations"
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Location</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Location</DialogTitle>
              </DialogHeader>
              <LocationForm
                f={form}
                setF={setForm}
                detecting={detecting}
                onDetect={() => detectLocation(setForm, setDetecting)}
                onSave={handleCreate}
                saving={saving}
                saveLabel="Add Location"
              />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading locations…
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No locations yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first wash location to start accepting bookings.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((l: any) => (
            <div key={l.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-foreground truncate">{l.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{l.address}</p>
                  <p className="text-xs text-muted-foreground">{l.city}</p>
                  {l.lat && l.lng && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
                      <Navigation className="w-3 h-3 shrink-0" />
                      {parseFloat(l.lat).toFixed(4)}, {parseFloat(l.lng).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog
                  open={editOpen && editingId === l.id}
                  onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingId(null); }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline" size="sm" className="flex-1"
                      onClick={() => {
                        setEditingId(l.id);
                        setEditForm({
                          name: l.name ?? '',
                          address: l.address ?? '',
                          city: l.city ?? 'Nairobi',
                          lat: l.lat ? String(l.lat) : '',
                          lng: l.lng ? String(l.lng) : '',
                        });
                        setEditOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display">Edit Location</DialogTitle>
                    </DialogHeader>
                    <LocationForm
                      f={editForm}
                      setF={setEditForm}
                      detecting={editDetecting}
                      onDetect={() => detectLocation(setEditForm, setEditDetecting)}
                      onSave={handleEdit}
                      saving={saving}
                      saveLabel="Save Changes"
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline" size="sm"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                  disabled={deleting === l.id}
                  onClick={() => handleDelete(l.id, l.name)}
                >
                  {deleting === l.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
