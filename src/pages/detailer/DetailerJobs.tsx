import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Camera, Video, CheckCheck, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Photo upload not configured');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

export default function DetailerJobs() {
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    bookingId: string;
    existingPhotos: string[];
    type: 'before' | 'after';
  } | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  const jobs = bookings
    .filter((b: any) => filter === 'all' || b.status === filter)
    .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));

  const updateStatus = async (id: string, status: string, label: string) => {
    setUpdating(id);
    try {
      await api.patch(`/bookings/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      toast({ title: `Job ${label}`, description: `Status updated to ${label.toLowerCase()}.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingUpload || !e.target.files?.length) return;
    const { bookingId, existingPhotos, type } = pendingUpload;
    setUploading(`${bookingId}-${type}`);
    const files = Array.from(e.target.files);
    try {
      if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Photo upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
      const urls = await Promise.all(files.map(f => uploadToCloudinary(f, `autoflow/${bookingId}`)));
      const allPhotos = [...existingPhotos, ...urls];
      await api.patch(`/bookings/${bookingId}`, type === 'before' ? { beforePhotos: allPhotos } : { afterPhotos: allPhotos });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Photos Uploaded', description: `${urls.length} ${type} photo${urls.length > 1 ? 's' : ''} saved.` });
    } catch (err) {
      toast({ title: 'Upload Failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    } finally {
      setUploading(null);
      setPendingUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (bookingId: string, existingPhotos: string[], type: 'before' | 'after') => {
    setPendingUpload({ bookingId, existingPhotos, type });
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  return (
    <DashboardLayout>
      <PageHeader title="My Jobs" subtitle="Manage your assigned jobs" />

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoUpload}
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'confirmed', 'in_progress', 'awaiting_confirmation', 'completed'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            onClick={() => setFilter(f)} className="capitalize text-xs">
            {f === 'all' ? 'All'
              : f === 'awaiting_confirmation' ? 'Ready'
              : f.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No jobs match this filter.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((b: any) => {
            const isConfirmed = b.status === 'confirmed';
            const isInProgress = b.status === 'in_progress';
            const isReady = b.status === 'awaiting_confirmation';
            const uploadingBefore = uploading === `${b.id}-before`;
            const uploadingAfter = uploading === `${b.id}-after`;

            return (
              <div key={b.id}
                className={`p-4 rounded-xl border shadow-card ${isReady ? 'bg-success/5 border-success/30' : 'bg-card border-border'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-foreground">{b.serviceName}</p>
                    <p className="text-sm text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
                    <p className="text-sm text-muted-foreground">{b.locationName} · {b.date} at {b.time}</p>
                    {(b.beforePhotos?.length > 0 || b.afterPhotos?.length > 0) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📷 {b.beforePhotos?.length || 0} before · {b.afterPhotos?.length || 0} after photos
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={b.status} />

                    {/* ── Confirmed: Take before photos + Start Job ── */}
                    {isConfirmed && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline"
                          disabled={uploadingBefore}
                          onClick={() => triggerUpload(b.id, b.beforePhotos || [], 'before')}>
                          {uploadingBefore
                            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
                            : <><Camera className="w-3 h-3 mr-1" /> Before ({b.beforePhotos?.length || 0})</>}
                        </Button>
                        <Button size="sm"
                          disabled={updating === b.id}
                          onClick={() => updateStatus(b.id, 'in_progress', 'Started')}>
                          {updating === b.id ? 'Starting...' : 'Start Job'}
                        </Button>
                      </div>
                    )}

                    {/* ── In Progress: Photos + Go Live + Mark Ready ── */}
                    {isInProgress && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline"
                          disabled={uploadingBefore}
                          onClick={() => triggerUpload(b.id, b.beforePhotos || [], 'before')}>
                          {uploadingBefore
                            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
                            : <><Camera className="w-3 h-3 mr-1" /> Before ({b.beforePhotos?.length || 0})</>}
                        </Button>
                        <Button size="sm" variant="outline"
                          disabled={uploadingAfter}
                          onClick={() => triggerUpload(b.id, b.afterPhotos || [], 'after')}>
                          {uploadingAfter
                            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
                            : <><Upload className="w-3 h-3 mr-1" /> After ({b.afterPhotos?.length || 0})</>}
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => toast({ title: 'Live Stream', description: 'Live stream via Agora — coming soon.' })}>
                          <Video className="w-3 h-3 mr-1" /> Go Live
                        </Button>
                        <Button size="sm" className="bg-success hover:bg-success/90"
                          disabled={updating === b.id}
                          onClick={() => updateStatus(b.id, 'awaiting_confirmation', 'Ready for Pickup')}>
                          {updating === b.id
                            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Updating...</>
                            : <><CheckCheck className="w-3 h-3 mr-1" /> Mark Ready</>}
                        </Button>
                      </div>
                    )}

                    {/* ── Ready (awaiting_confirmation): Still allow after-photo uploads ── */}
                    {isReady && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <Button size="sm" variant="outline"
                          disabled={uploadingAfter}
                          onClick={() => triggerUpload(b.id, b.afterPhotos || [], 'after')}>
                          {uploadingAfter
                            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
                            : <><Upload className="w-3 h-3 mr-1" /> After ({b.afterPhotos?.length || 0})</>}
                        </Button>
                        <span className="text-xs text-success font-medium flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" /> Awaiting customer
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
