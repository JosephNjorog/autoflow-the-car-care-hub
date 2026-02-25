import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockLocations } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin, Edit, Trash2, LocateFixed, Loader2, Navigation } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function OwnerLocations() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Add form state
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [detecting, setDetecting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editDetecting, setEditDetecting] = useState(false);

  const detectLocation = (mode: 'add' | 'edit') => {
    const setDet = mode === 'add' ? setDetecting : setEditDetecting;
    const setLat = mode === 'add' ? setNewLat : setEditLat;
    const setLng = mode === 'add' ? setNewLng : setEditLng;
    const setAddr = mode === 'add' ? setNewAddress : setEditAddress;
    const setCity_ = mode === 'add' ? setNewCity : setEditCity;

    if (!navigator.geolocation) {
      toast({ title: 'Not Supported', description: 'Geolocation is not supported by your browser.', variant: 'destructive' });
      return;
    }

    setDet(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));

        // Reverse geocode using free API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.address) {
            const road = data.address.road || data.address.suburb || '';
            const area = data.address.suburb || data.address.neighbourhood || '';
            const city = data.address.city || data.address.town || data.address.county || '';
            setAddr([road, area].filter(Boolean).join(', '));
            setCity_(city);
          }
        } catch {
          // Silently fail reverse geocode, coords are still set
        }

        setDet(false);
        toast({ title: 'Location Detected', description: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
      },
      (error) => {
        setDet(false);
        toast({ title: 'Location Error', description: error.message || 'Could not detect your location.', variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetAddForm = () => {
    setNewName(''); setNewAddress(''); setNewCity(''); setNewLat(''); setNewLng('');
  };

  const startEdit = (l: typeof mockLocations[0]) => {
    setEditingId(l.id);
    setEditName(l.name);
    setEditAddress(l.address);
    setEditCity(l.city);
    setEditLat(l.lat?.toString() || '');
    setEditLng(l.lng?.toString() || '');
  };

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="Locations" subtitle="Manage your business locations"
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetAddForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Location</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="font-display">Add Location</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Location Name</Label><Input placeholder="e.g. AutoFlow Westlands" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                
                {/* Detect Location Button */}
                <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5" onClick={() => detectLocation('add')} disabled={detecting}>
                  {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  {detecting ? 'Detecting location...' : 'Use Current Location'}
                </Button>

                <div className="space-y-2"><Label>Address</Label><Input placeholder="e.g. Westlands Rd, Nairobi" value={newAddress} onChange={e => setNewAddress(e.target.value)} /></div>
                <div className="space-y-2"><Label>City</Label><Input placeholder="Nairobi" value={newCity} onChange={e => setNewCity(e.target.value)} /></div>

                {/* Coordinates (shown when detected) */}
                {(newLat || newLng) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Latitude</Label><Input value={newLat} onChange={e => setNewLat(e.target.value)} className="text-sm h-9" /></div>
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Longitude</Label><Input value={newLng} onChange={e => setNewLng(e.target.value)} className="text-sm h-9" /></div>
                  </div>
                )}

                {/* Map preview placeholder */}
                {(newLat && newLng) && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted/50 p-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Navigation className="w-4 h-4 text-primary" />
                      <span>📍 {newLat}, {newLng}</span>
                    </div>
                    <iframe
                      title="Location preview"
                      className="w-full h-40"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(newLng)-0.005},${Number(newLat)-0.005},${Number(newLng)+0.005},${Number(newLat)+0.005}&layer=mapnik&marker=${newLat},${newLng}`}
                      style={{ border: 0 }}
                    />
                  </div>
                )}

                <Button className="w-full" onClick={() => { setOpen(false); resetAddForm(); toast({ title: 'Location Added', description: 'New location has been created.' }); }}>Add Location</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockLocations.map(l => (
          <div key={l.id} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-primary/10"><MapPin className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-display text-foreground">{l.name}</p>
                <p className="text-sm text-muted-foreground">{l.address}</p>
                <p className="text-xs text-muted-foreground">{l.city}</p>
                {l.lat && l.lng && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={editOpen && editingId === l.id} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingId(null); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => startEdit(l)}><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle className="font-display">Edit {l.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2"><Label>Location Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                    
                    <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5" onClick={() => detectLocation('edit')} disabled={editDetecting}>
                      {editDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                      {editDetecting ? 'Detecting location...' : 'Use Current Location'}
                    </Button>

                    <div className="space-y-2"><Label>Address</Label><Input value={editAddress} onChange={e => setEditAddress(e.target.value)} /></div>
                    <div className="space-y-2"><Label>City</Label><Input value={editCity} onChange={e => setEditCity(e.target.value)} /></div>

                    {(editLat || editLng) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2"><Label className="text-xs text-muted-foreground">Latitude</Label><Input value={editLat} onChange={e => setEditLat(e.target.value)} className="text-sm h-9" /></div>
                        <div className="space-y-2"><Label className="text-xs text-muted-foreground">Longitude</Label><Input value={editLng} onChange={e => setEditLng(e.target.value)} className="text-sm h-9" /></div>
                      </div>
                    )}

                    {(editLat && editLng) && (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="bg-muted/50 p-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Navigation className="w-4 h-4 text-primary" />
                          <span>📍 {editLat}, {editLng}</span>
                        </div>
                        <iframe
                          title="Location preview"
                          className="w-full h-40"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(editLng)-0.005},${Number(editLat)-0.005},${Number(editLng)+0.005},${Number(editLat)+0.005}&layer=mapnik&marker=${editLat},${editLng}`}
                          style={{ border: 0 }}
                        />
                      </div>
                    )}

                    <Button className="w-full" onClick={() => { setEditOpen(false); setEditingId(null); toast({ title: 'Location Updated', description: `${l.name} has been updated.` }); }}>Save Changes</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => toast({ title: 'Location Deleted', description: `${l.name} has been removed.`, variant: 'destructive' })}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
