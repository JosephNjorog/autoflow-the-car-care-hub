import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Star, Clock, Droplets, Search, ChevronRight, ArrowLeft,
  Phone, Wallet, CheckCircle, Loader2, Award,
  ArrowRight, Shield, CreditCard, UserPlus, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fetchLivePrices } from '@/lib/prices';

// ─── Tier image URLs ──────────────────────────────────────────────────────────
const TIER_IMAGES = {
  economy:         'https://autopayke.lovable.app/assets/tier-economy-CYy0Teks.jpeg',
  premium_economy: 'https://autopayke.lovable.app/assets/tier-premium-D6jxk9Yj.jpeg',
  first_class:     'https://autopayke.lovable.app/assets/tier-firstclass-BtC3u5ET.jpeg',
};

// Guest-friendly fetch (no auth token needed)
async function guestGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}
async function guestPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ─── Tier definitions ─────────────────────────────────────────────────────────
type TierId = 'economy' | 'premium_economy' | 'first_class';

const TIERS = [
  {
    id: 'economy' as TierId,
    name: 'Economy',
    tagline: 'Quick Clean',
    price: 'KES 300 – 1,000',
    time: '15–25 min',
    accentClass: 'text-blue-400',
    bgClass: 'bg-blue-400/10',
    borderSelected: 'border-blue-400',
    highlights: ['Basic foam wash', 'Pressure rinse', 'Tire wash', 'Rim clean', 'Hand dry'],
  },
  {
    id: 'premium_economy' as TierId,
    name: 'Premium Economy',
    tagline: 'Full Clean',
    price: 'KES 1,050 – 2,000',
    time: '30–45 min',
    accentClass: 'text-purple-400',
    bgClass: 'bg-purple-400/10',
    borderSelected: 'border-purple-400',
    highlights: ['Foam wash + wax', 'Rim polish', 'Full vacuum', 'Dashboard polish', 'Window clean'],
  },
  {
    id: 'first_class' as TierId,
    name: 'First Class',
    tagline: 'Total Car Care',
    price: 'KES 2,050+',
    time: '60+ min',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-400/10',
    borderSelected: 'border-amber-400',
    highlights: ['Full detailing', 'Paint protection', 'Engine bay clean', 'Ceramic coating', 'Lounge access'],
  },
] as const;

const TIER_PRICE_RANGE: Record<TierId, [number, number]> = {
  economy:         [0,    1050],
  premium_economy: [1051, 2050],
  first_class:     [2051, 999999],
};

// 10 KSh = 1 AP point
function calcPoints(kesAmount: number) {
  return Math.max(1, Math.floor(kesAmount / 10));
}

type Step = 'tier-select' | 'browse' | 'services' | 'checkout' | 'paying' | 'confirmed';

// ─── Main component ───────────────────────────────────────────────────────────
export default function GuestBook() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep]                         = useState<Step>('tier-select');
  const [selectedTier, setSelectedTier]         = useState<TierId | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]); // multi-select
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedTime, setSelectedTime]         = useState('');
  const [paymentMethod, setPaymentMethod]       = useState('mpesa');
  const [searchQuery, setSearchQuery]           = useState('');

  // Guest info
  const [guestName,  setGuestName]  = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [, setBookingResults] = useState<{ id: string }[]>([]);
  const [isBooking, setIsBooking]   = useState(false);
  const [pollCount, setPollCount]   = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['guest-locations'],
    queryFn: () => guestGet<any[]>('/locations'),
    enabled: step === 'browse',
    staleTime: 60_000,
  });

  const { data: locationServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ['guest-services', selectedLocation?.id],
    queryFn: () => guestGet<any[]>(`/services?locationId=${selectedLocation.id}&activeOnly=true`),
    enabled: !!selectedLocation?.id,
    staleTime: 60_000,
  });

  const { data: livePrices } = useQuery({
    queryKey: ['live-prices'],
    queryFn: fetchLivePrices,
    staleTime: 60_000,
  });

  const conversionRate = livePrices?.kesPerUsd ?? 129.05;

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Filter services by tier price range
  const tierServices = useMemo(() => {
    if (!selectedTier) return locationServices;
    const [min, max] = TIER_PRICE_RANGE[selectedTier];
    return (locationServices as any[]).filter(s => s.price >= min && s.price <= max);
  }, [locationServices, selectedTier]);

  const filteredLocations = useMemo(() => {
    return (locations as any[]).filter(l =>
      !searchQuery ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [locations, searchQuery]);

  // Customer pays the service price as-is. AutoFlow's 10% is deducted from the owner payout on the backend.
  const servicesTotal  = selectedServices.reduce((s, svc) => s + parseFloat(svc.price), 0);
  const totalAmount    = servicesTotal;
  const usdAmount      = totalAmount ? (totalAmount / conversionRate).toFixed(2) : '0';
  const pointsEarned   = calcPoints(servicesTotal);
  const tierInfo       = TIERS.find(t => t.id === selectedTier);

  const toggleService = (svc: any) => {
    setSelectedServices(prev =>
      prev.some(s => s.id === svc.id)
        ? prev.filter(s => s.id !== svc.id)
        : [...prev, svc],
    );
  };

  const startPolling = (firstBookingId: string) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      setPollCount(count);
      try {
        const status = await guestGet<any>(`/payments/status?bookingId=${firstBookingId}`);
        if (['completed', 'captured', 'released'].includes(status.paymentStatus)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep('confirmed');
        } else if (count >= 20) {
          if (pollRef.current) clearInterval(pollRef.current);
          toast({ title: 'Payment Timeout', description: 'Check your M-Pesa and try again.', variant: 'destructive' });
          setStep('checkout');
        }
      } catch { /* ignore */ }
    }, 3000);
  };

  const handleBookAndPay = async () => {
    if (!selectedServices.length || !selectedLocation || !selectedDate || !selectedTime || !guestPhone) return;
    setIsBooking(true);
    try {
      // Create a booking for each selected service
      const bookings = await Promise.all(
        selectedServices.map(svc =>
          guestPost<any>('/bookings/guest', {
            serviceId:     svc.id,
            locationId:    selectedLocation.id,
            date:          selectedDate,
            time:          selectedTime,
            paymentMethod,
            paymentTiming: 'now',
            guestName:     guestName.trim() || 'Guest',
            guestPhone:    guestPhone.trim(),
            guestEmail:    guestEmail.trim() || undefined,
          })
        )
      );
      setBookingResults(bookings);

      if (paymentMethod === 'mpesa') {
        // Send one combined STK push for the total
        await guestPost('/payments/mpesa-stk', {
          bookingId: bookings[0].id,
          phone: guestPhone.trim(),
          amount: totalAmount,
        });
        setStep('paying');
        startPolling(bookings[0].id);
      } else {
        setStep('confirmed');
      }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Booking failed', variant: 'destructive' });
    } finally {
      setIsBooking(false);
    }
  };

  // ── Shared nav ─────────────────────────────────────────────────────────────
  const NavBar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Droplets className="w-4 h-4 text-background" />
          </div>
          <span className="text-base font-semibold text-foreground">AutoPayKe</span>
        </Link>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Sign in
        </Link>
      </div>
    </nav>
  );

  // ── CONFIRMED ──────────────────────────────────────────────────────────────
  if (step === 'confirmed') {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-md mx-auto px-4 pt-24 pb-16 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mb-1">{selectedLocation?.name}</p>
          <p className="text-sm text-muted-foreground mb-4">{selectedDate} · {selectedTime}</p>

          {selectedServices.length > 0 && (
            <div className="w-full rounded-xl border border-border bg-card p-4 mb-4 text-left space-y-1.5">
              {selectedServices.map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="text-foreground">KES {parseFloat(s.price).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-border pt-1.5">
                <span className="text-foreground">Total paid</span>
                <span className="text-foreground">KES {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="w-full rounded-xl bg-success/10 border border-success/20 p-4 mb-3 text-left">
            <p className="text-sm font-medium text-foreground mb-1">Payment in Escrow</p>
            <p className="text-xs text-muted-foreground">
              Held securely by AutoPayKe. Released to the car wash only after you confirm completion.
            </p>
          </div>

          <div className="w-full rounded-xl bg-primary/5 border border-border p-3 mb-6 flex items-center gap-3">
            <Award className="w-5 h-5 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">+{pointsEarned} AP Points earned</p>
              <p className="text-xs text-muted-foreground">10 KSh = 1 AutoPay Point</p>
            </div>
          </div>

          <div className="w-full rounded-xl border border-border bg-card p-5 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <UserPlus className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">Track your bookings & points</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Create a free account to track loyalty points, view history, and book faster next time.
            </p>
            <Button className="w-full" onClick={() => navigate(`/register?phone=${encodeURIComponent(guestPhone)}&name=${encodeURIComponent(guestName)}&email=${encodeURIComponent(guestEmail)}`)}>
              Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { setStep('tier-select'); setSelectedTier(null); setSelectedLocation(null); setSelectedServices([]); setSelectedDate(''); setSelectedTime(''); setGuestName(''); setGuestPhone(''); setGuestEmail(''); }}>
            Book another wash
          </button>
        </div>
      </div>
    );
  }

  // ── PAYING ─────────────────────────────────────────────────────────────────
  if (step === 'paying') {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-md mx-auto px-4 pt-24 pb-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Waiting for M-Pesa</h2>
          <p className="text-muted-foreground mb-2">STK Push sent to <strong>{guestPhone}</strong></p>
          <p className="text-sm text-muted-foreground mb-6">Enter your PIN to pay <strong>KES {totalAmount.toLocaleString()}</strong></p>
          <div className="flex gap-1.5 mb-8">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < pollCount ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <Button variant="outline" onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setStep('checkout'); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── CHECKOUT ───────────────────────────────────────────────────────────────
  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-lg mx-auto px-4 pt-20 pb-16">
          <button onClick={() => setStep('services')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-xl font-bold text-foreground mb-6">Checkout</h2>

          {/* Order summary */}
          <div className="rounded-xl border border-border bg-card p-5 mb-5">
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-foreground">{selectedLocation?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium text-foreground">{selectedDate} · {selectedTime}</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              {selectedServices.map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="text-foreground">KES {parseFloat(s.price).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-lg text-foreground">KES {totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>You'll earn <strong className="text-foreground">+{pointsEarned} AP points</strong> (10 KSh = 1 point)</span>
            </div>
          </div>

          {/* Guest details */}
          <h3 className="text-sm font-semibold text-foreground mb-3">Your details</h3>
          <div className="space-y-3 mb-5">
            <Input placeholder="Your name (optional)" value={guestName} onChange={e => setGuestName(e.target.value)} />
            <Input placeholder="M-Pesa phone number (required)" type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
            <Input placeholder="Email (optional — for receipt)" type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
          </div>

          {/* Payment method */}
          <h3 className="text-sm font-semibold text-foreground mb-3">Pay with</h3>
          <div className="space-y-2 mb-5">
            {[
              { id: 'mpesa', icon: Phone,      label: 'M-Pesa',  desc: 'STK Push to your phone',       badge: 'Recommended' },
              { id: 'usdt',  icon: Wallet,     label: 'USDT',    desc: `≈ $${usdAmount} on Avalanche`, badge: 'Web3' },
              { id: 'usdc',  icon: Shield,     label: 'USDC',    desc: `≈ $${usdAmount} on Avalanche`, badge: 'Web3' },
              { id: 'card',  icon: CreditCard, label: 'Card',    desc: 'Coming soon',                  badge: 'Soon', disabled: true },
            ].map(m => (
              <button key={m.id} onClick={() => !(m as any).disabled && setPaymentMethod(m.id)}
                disabled={(m as any).disabled}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  (m as any).disabled ? 'border-border opacity-40 cursor-not-allowed' :
                  paymentMethod === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paymentMethod === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.id ? 'border-primary' : 'border-border'}`}>
                  {paymentMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>

          <Button className="w-full h-12 text-base" disabled={isBooking || !guestPhone.trim()}
            onClick={handleBookAndPay}>
            {isBooking
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              : <>Pay KES {totalAmount.toLocaleString()} <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Secured by AutoPayKe escrow · Released after service confirmation
          </p>
        </div>
      </div>
    );
  }

  // ── SERVICES (multi-select) ─────────────────────────────────────────────────
  if (step === 'services' && selectedLocation) {
    const showUpgradeTip = tierServices.length === 0 && (locationServices as any[]).length > 0;

    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-32">
          <button onClick={() => { setStep('browse'); setSelectedServices([]); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Location header */}
          <div className="rounded-xl border border-border bg-card p-4 mb-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="font-bold text-foreground">{selectedLocation.name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {selectedLocation.address}
                </p>
              </div>
              {selectedLocation.rating && (
                <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-sm font-medium">{selectedLocation.rating}</span>
                </div>
              )}
            </div>
            {tierInfo && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${tierInfo.bgClass} ${tierInfo.accentClass}`}>
                {tierInfo.name} · {tierInfo.price}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Select services</h3>
            {selectedServices.length > 0 && (
              <span className="text-xs text-muted-foreground">{selectedServices.length} selected</span>
            )}
          </div>

          {loadingServices ? (
            <div className="text-center py-12">
              <Loader2 className="w-7 h-7 text-muted-foreground/50 mx-auto animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Loading services...</p>
            </div>
          ) : showUpgradeTip ? (
            <div className="text-center py-12 px-4">
              <Droplets className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">No {tierInfo?.name} services here</p>
              <p className="text-sm text-muted-foreground mb-4">Try a different tier or another location.</p>
              <Button variant="outline" onClick={() => setStep('browse')}>Choose Another Location</Button>
            </div>
          ) : tierServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services available at this location.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {tierServices.map((s: any) => {
                const isSelected = selectedServices.some(sel => sel.id === s.id);
                return (
                  <button key={s.id} onClick={() => toggleService(s)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">KES {parseFloat(s.price).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Clock className="w-2.5 h-2.5" /> {s.duration} min
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Date & time */}
          {selectedServices.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground">Pick a date & time</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Date</label>
                  <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Time</label>
                  <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                    <option value="">Select time</option>
                    {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sticky bottom summary + CTA */}
        <AnimatePresence>
          {selectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
              className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border"
            >
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected</p>
                    <p className="text-lg font-bold text-foreground">KES {totalAmount.toLocaleString()}</p>
                  </div>
                  <Button size="lg" disabled={!selectedDate || !selectedTime} onClick={() => setStep('checkout')}>
                    Continue to Checkout <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {/* Selected service chips */}
                <div className="flex gap-1.5 flex-wrap">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {s.name}
                      <button onClick={() => toggleService(s)}><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── BROWSE (location list) ──────────────────────────────────────────────────
  if (step === 'browse') {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-16">
          <button onClick={() => setStep('tier-select')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Change tier
          </button>

          {tierInfo && (
            <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl ${tierInfo.bgClass} ${tierInfo.accentClass} mb-4 w-fit`}>
              {tierInfo.name} · {tierInfo.price}
            </div>
          )}

          <h2 className="text-lg font-bold text-foreground mb-4">Nearby Car Washes</h2>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or area..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11" />
          </div>

          {loadingLocations ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-muted-foreground/50 mx-auto animate-spin mb-3" />
              <p className="text-muted-foreground">Finding car washes near you...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-16">
              <Droplets className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No car washes found. Try a different search.</p>
            </div>
          ) : (
            (() => {
              const cities = [...new Set(filteredLocations.map((l: any) => l.city))];
              return cities.map(city => (
                <div key={city as string} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">{city as string}</h3>
                    <span className="text-xs text-muted-foreground">{filteredLocations.filter((l: any) => l.city === city).length} location(s)</span>
                  </div>
                  <div className="space-y-3">
                    {filteredLocations.filter((l: any) => l.city === city).map((center: any, i: number) => (
                      <motion.button key={center.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => { setSelectedLocation(center); setSelectedServices([]); setStep('services'); }}
                        className="w-full flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left"
                      >
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {tierInfo ? (
                            <img src={TIER_IMAGES[tierInfo.id]} alt={tierInfo.name} className="w-full h-full object-cover" />
                          ) : (
                            <Droplets className="w-7 h-7 text-primary/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{center.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" /> {center.address}
                          </p>
                          {center.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-accent fill-accent" />
                              <span className="text-xs text-muted-foreground">{center.rating}</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </div>
    );
  }

  // ── TIER SELECT ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Step 1 of 3</p>
          <h1 className="text-2xl font-bold text-foreground mb-1">Choose your wash tier</h1>
          <p className="text-sm text-muted-foreground mb-8">Pick the level of service you want today.</p>

          <div className="space-y-4 mb-8">
            {TIERS.map((tier, i) => (
              <motion.button
                key={tier.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSelectedTier(tier.id === selectedTier ? null : tier.id)}
                className={`w-full text-left rounded-2xl border overflow-hidden transition-all duration-200 ${
                  selectedTier === tier.id ? `${tier.borderSelected} border-2` : 'border-border hover:border-foreground/20'
                }`}
              >
                {/* Tier image banner */}
                <div className="relative h-36 overflow-hidden">
                  <img src={TIER_IMAGES[tier.id]} alt={tier.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <span className="font-bold text-lg text-foreground">{tier.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bgClass} ${tier.accentClass}`}>{tier.tagline}</span>
                  </div>
                  <div className="absolute bottom-3 right-4">
                    <span className="text-sm font-semibold text-foreground">{tier.price}</span>
                  </div>
                  {selectedTier === tier.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Details below image */}
                <div className="bg-card p-4">
                  <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {tier.time}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Award className="w-3 h-3 text-primary" /> Earn AP points (10 KSh = 1 pt)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tier.highlights.map(h => (
                      <span key={h} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{h}</span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <Button className="w-full h-12 text-base" disabled={!selectedTier} onClick={() => setStep('browse')}>
            Find Nearby Car Washes <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
