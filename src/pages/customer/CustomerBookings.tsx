import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { runCryptoPayment, isWalletAvailable, type CryptoPaymentStep } from '@/lib/crypto';
import { fetchLivePrices } from '@/lib/prices';
import { CheckCircle, Loader2, ImageIcon, ShieldCheck, CalendarClock, X, Phone, Wallet } from 'lucide-react';

// ─── Photo Lightbox ───────────────────────────────────────────────────────────

function PhotoLightbox({ photos, open, onClose }: { photos: string[]; open: boolean; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  if (!open || photos.length === 0) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}>
        <X className="w-7 h-7" />
      </button>
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <img src={photos[idx]} alt={`Photo ${idx + 1}`} className="w-full rounded-xl object-contain max-h-[75vh]" />
        {photos.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerBookings() {
  const [filter, setFilter] = useState<string>('all');
  const [confirmBooking, setConfirmBooking] = useState<any>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [pickupPayStep, setPickupPayStep] = useState<'idle' | 'paying' | 'polling'>('idle');
  const [pickupPayMethod, setPickupPayMethod] = useState<'mpesa' | 'usdt' | 'usdc'>('mpesa');
  const [cryptoStep, setCryptoStep] = useState<CryptoPaymentStep>('idle');
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  const { data: livePrices } = useQuery({
    queryKey: ['live-prices'],
    queryFn: fetchLivePrices,
    staleTime: 60_000,
  });
  const conversionRate = livePrices?.kesPerUsd ?? 129.05;

  const filters = ['all', 'pending', 'confirmed', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'];

  const filtered = bookings
    .filter((b: any) => filter === 'all' || b.status === filter)
    .sort((a: any, b: any) => {
      // Awaiting confirmation first (action needed), then by date
      if (a.status === 'awaiting_confirmation' && b.status !== 'awaiting_confirmation') return -1;
      if (b.status === 'awaiting_confirmation' && a.status !== 'awaiting_confirmation') return 1;
      return (b.date || '').localeCompare(a.date || '');
    });

  const awaitingCount = bookings.filter((b: any) => b.status === 'awaiting_confirmation').length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });

  // Stop polling on unmount
  const stopPoll = () => { if (pollRef.current) clearInterval(pollRef.current); };

  // Poll for M-Pesa payment capture (pay-at-pickup flow)
  const startPickupPaymentPoll = (bookingId: string, onCaptured: () => void) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      setPollCount(count);
      try {
        const status = await api.get<any>(`/payments/status?bookingId=${bookingId}`);
        if (['completed', 'captured', 'released'].includes(status.paymentStatus)) {
          stopPoll();
          setPickupPayStep('idle');
          onCaptured();
        } else if (count >= 20) {
          stopPoll();
          setPickupPayStep('idle');
          toast({ title: 'Payment Timeout', description: 'Please try again.', variant: 'destructive' });
        }
      } catch { /* ignore */ }
    }, 3000);
  };

  // Customer confirms service is done — releases escrow to owner
  const handleConfirmPickup = async (booking: any) => {
    setConfirming(true);
    try {
      await api.patch(`/bookings/${booking.id}`, { confirmPickup: true });
      invalidate();
      setConfirmBooking(null);
      toast({ title: 'Service Confirmed!', description: 'Payment has been released to the car wash. Thank you!' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to confirm', variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  // Pay-at-pickup: trigger M-Pesa STK push, then confirm on success
  const handlePayAtPickup = async (booking: any) => {
    if (!mpesaPhone) {
      toast({ title: 'Phone Required', description: 'Enter your M-Pesa phone number.', variant: 'destructive' });
      return;
    }
    setPickupPayStep('paying');
    try {
      await api.post('/payments/mpesa-stk-pickup', { bookingId: booking.id, phone: mpesaPhone });
      setPickupPayStep('polling');
      startPickupPaymentPoll(booking.id, () => handleConfirmPickup(booking));
    } catch (err) {
      setPickupPayStep('idle');
      toast({ title: 'Payment Failed', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  // Pay-at-pickup: crypto (USDT/USDC on Avalanche), then confirm on success
  const handleCryptoAtPickup = async (booking: any, token: 'usdt' | 'usdc') => {
    const usdAmount = (booking.servicePrice / conversionRate).toFixed(2);
    setPickupPayStep('paying');
    setCryptoStep('connecting');
    try {
      await runCryptoPayment(
        token,
        parseFloat(usdAmount),
        { onStep: setCryptoStep },
        'injected',
        undefined,
      );
      setCryptoStep('idle');
      await handleConfirmPickup(booking);
    } catch (err) {
      setCryptoStep('idle');
      setPickupPayStep('idle');
      toast({ title: 'Crypto Payment Failed', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="My Bookings"
        subtitle={awaitingCount > 0
          ? `${awaitingCount} booking${awaitingCount !== 1 ? 's' : ''} ready for pickup — confirmation required`
          : 'Track all your car wash bookings'}
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            onClick={() => setFilter(f)} className="capitalize text-xs relative">
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
            {f === 'awaiting_confirmation' && awaitingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning text-warning-foreground text-[10px] font-bold">
                {awaitingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No bookings found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b: any) => {
            const isAwaiting = b.status === 'awaiting_confirmation';
            const isPickup = b.paymentTiming === 'pickup';

            return (
              <div key={b.id}
                className={`p-4 rounded-xl border shadow-card ${isAwaiting ? 'bg-success/5 border-success/30' : 'bg-card border-border'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-display text-foreground">{b.serviceName}</p>
                      <StatusBadge status={b.status} />
                      {isAwaiting && (
                        <Badge variant="outline" className="text-[10px] border-success/50 text-success px-1.5 py-0">
                          Action required
                        </Badge>
                      )}
                      {isPickup && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                          <CalendarClock className="w-2.5 h-2.5" /> Pay at pickup
                        </Badge>
                      )}
                      {!isPickup && b.paymentStatus === 'captured' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> In escrow
                        </Badge>
                      )}
                      {b.paymentStatus === 'released' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-success border-success/30 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> Released
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{b.vehicleName}</p>
                    <p className="text-sm text-muted-foreground">{b.locationName} · {b.date} at {b.time}</p>
                    {(b.staffName || b.detailerName) && (
                      <p className="text-xs text-muted-foreground mt-1">Assigned to {b.staffName || b.detailerName}</p>
                    )}

                    {/* After-photos preview */}
                    {b.afterPhotos?.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {b.afterPhotos.slice(0, 4).map((url: string, i: number) => (
                          <button key={i} onClick={() => setLightboxPhotos(b.afterPhotos)}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                            <img src={url} alt="After" className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {b.afterPhotos.length > 4 && (
                          <button onClick={() => setLightboxPhotos(b.afterPhotos)}
                            className="w-14 h-14 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground hover:border-primary transition-colors">
                            +{b.afterPhotos.length - 4}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-display text-foreground">KES {(b.servicePrice || 0).toLocaleString()}</span>

                    {/* View after-photos button */}
                    {b.afterPhotos?.length > 0 && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs"
                        onClick={() => setLightboxPhotos(b.afterPhotos)}>
                        <ImageIcon className="w-3 h-3" /> Photos ({b.afterPhotos.length})
                      </Button>
                    )}

                    {/* Awaiting confirmation CTA */}
                    {isAwaiting && (
                      <Button size="sm" className="gap-1 bg-success hover:bg-success/90"
                        onClick={() => { setConfirmBooking(b); setMpesaPhone(user?.phone || ''); setPickupPayStep('idle'); }}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isPickup ? 'Pay & Confirm' : 'Confirm Pickup'}
                      </Button>
                    )}

                    {b.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < b.rating ? 'text-accent' : 'text-border'}`}>★</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm Pickup Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!confirmBooking}
        onOpenChange={o => {
          if (!o) {
            stopPoll();
            setConfirmBooking(null);
            setPickupPayStep('idle');
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmBooking?.paymentTiming === 'pickup' ? 'Pay & Confirm Pickup' : 'Confirm Service Completion'}
            </DialogTitle>
          </DialogHeader>

          {/* After-photos in dialog */}
          {confirmBooking?.afterPhotos?.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">After-service photos from the team:</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {confirmBooking.afterPhotos.slice(0, 6).map((url: string, i: number) => (
                  <button key={i} onClick={() => setLightboxPhotos(confirmBooking.afterPhotos)}
                    className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                    <img src={url} alt="After" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>No after-photos uploaded yet.</span>
            </div>
          )}

          {confirmBooking?.paymentTiming === 'pickup' ? (
            /* Pay at pickup flow */
            pickupPayStep === 'polling' ? (
              <div className="text-center py-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Waiting for M-Pesa confirmation…</p>
                <div className="flex justify-center gap-1 mt-3">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < pollCount ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
            ) : pickupPayStep === 'paying' && (pickupPayMethod === 'usdt' || pickupPayMethod === 'usdc') ? (
              <div className="text-center py-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Processing {pickupPayMethod.toUpperCase()} Payment</p>
                <p className="text-xs text-muted-foreground capitalize">{cryptoStep === 'idle' ? 'Initiating...' : cryptoStep.replace('ing', 'ing...')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your car is ready! Choose how to pay.
                </p>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-display text-foreground">
                    KES {(confirmBooking?.servicePrice || 0).toLocaleString()}
                    {' '}
                    <span className="text-xs text-muted-foreground font-normal">
                      (≈ ${(( confirmBooking?.servicePrice || 0) / conversionRate).toFixed(2)} USD)
                    </span>
                  </span>
                </div>

                {/* Payment method tabs */}
                <div className="flex rounded-lg overflow-hidden border border-border">
                  {([
                    { id: 'mpesa' as const, label: 'M-Pesa', icon: Phone },
                    { id: 'usdt' as const, label: 'USDT', icon: Wallet },
                    { id: 'usdc' as const, label: 'USDC', icon: Wallet },
                  ]).map(m => (
                    <button key={m.id} onClick={() => setPickupPayMethod(m.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${pickupPayMethod === m.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                      <m.icon className="w-3 h-3" /> {m.label}
                    </button>
                  ))}
                </div>

                {pickupPayMethod === 'mpesa' && (
                  <>
                    <div>
                      <Label className="text-xs mb-1 block">M-Pesa Phone Number</Label>
                      <Input placeholder="0712345678" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} />
                    </div>
                    <Button className="w-full" disabled={pickupPayStep === 'paying' || !mpesaPhone}
                      onClick={() => handlePayAtPickup(confirmBooking)}>
                      {pickupPayStep === 'paying'
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending STK Push…</>
                        : <>Pay KES {(confirmBooking?.servicePrice || 0).toLocaleString()} via M-Pesa</>}
                    </Button>
                  </>
                )}

                {(pickupPayMethod === 'usdt' || pickupPayMethod === 'usdc') && (
                  <>
                    {!isWalletAvailable() && (
                      <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2 text-xs text-destructive">
                        No crypto wallet detected. Install MetaMask or open in Trust Wallet's browser.
                      </div>
                    )}
                    <Button className="w-full" disabled={pickupPayStep === 'paying'}
                      onClick={() => handleCryptoAtPickup(confirmBooking, pickupPayMethod)}>
                      {pickupPayStep === 'paying'
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                        : <>Pay ${((confirmBooking?.servicePrice || 0) / conversionRate).toFixed(2)} {pickupPayMethod.toUpperCase()} on Avalanche</>}
                    </Button>
                  </>
                )}
              </div>
            )
          ) : (
            /* Pay-now escrow release flow */
            <div className="space-y-3">
              <div className="rounded-lg bg-success/10 border border-success/20 p-3">
                <p className="text-sm text-muted-foreground">
                  By confirming, you release the <strong>KES {(confirmBooking?.servicePrice || 0).toLocaleString()}</strong> held in escrow to the car wash team. Only confirm if you are satisfied with the service.
                </p>
              </div>
              <Button
                className="w-full bg-success hover:bg-success/90"
                disabled={confirming}
                onClick={() => handleConfirmPickup(confirmBooking)}
              >
                {confirming
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Releasing payment…</>
                  : <><CheckCircle className="w-4 h-4 mr-2" /> Confirm & Release Payment</>
                }
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Payment auto-releases to the car wash after 2 hours if not confirmed.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Photo Lightbox ────────────────────────────────────────────────── */}
      <PhotoLightbox
        photos={lightboxPhotos}
        open={lightboxPhotos.length > 0}
        onClose={() => setLightboxPhotos([])}
      />
    </DashboardLayout>
  );
}
