import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, Droplets, MapPin, Star, Search,
  SlidersHorizontal, Car, Smartphone, ChevronLeft, ChevronRight,
  Wallet, CreditCard, Phone, Shield, Zap, ArrowLeft, Loader2, CalendarClock, ShoppingBag
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { runCryptoPayment, isWalletAvailable, type CryptoPaymentStep } from '@/lib/crypto';
import { fetchLivePrices } from '@/lib/prices';

type ServiceMode = 'all' | 'irl' | 'mobile';

export default function BookService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('all');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentTiming, setPaymentTiming] = useState<'now' | 'pickup'>('now');
  const [includeLogistics, setIncludeLogistics] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');
  const [step, setStep] = useState<'browse' | 'center' | 'checkout' | 'paying' | 'confirmed'>('browse');
  const [bookingId, setBookingId] = useState('');
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cryptoStep, setCryptoStep] = useState<CryptoPaymentStep>('idle');

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get<any[]>('/locations'),
  });

  const { data: locationServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services', selectedLocation?.id],
    queryFn: () => api.get<any[]>(`/services?locationId=${selectedLocation.id}&activeOnly=true`),
    enabled: !!selectedLocation?.id,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<any[]>('/vehicles'),
  });

  const { data: livePrices } = useQuery({
    queryKey: ['live-prices'],
    queryFn: fetchLivePrices,
    staleTime: 60_000,
  });

  const filteredLocations = useMemo(() => {
    return locations.filter((l: any) => {
      const matchesSearch = !searchQuery ||
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [locations, searchQuery]);

  const selectedServiceData = locationServices.find((s: any) => s.id === selectedService);
  const selectedVehicleData = vehicles.find((v: any) => v.id === selectedVehicle);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = (bId: string) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      setPollCount(count);
      try {
        const status = await api.get<any>(`/payments/status?bookingId=${bId}`);
        if (['completed', 'captured', 'released'].includes(status.paymentStatus)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep('confirmed');
        } else if (count >= 20) {
          if (pollRef.current) clearInterval(pollRef.current);
          toast({ title: 'Payment Timeout', description: 'Please check your M-Pesa and try again.', variant: 'destructive' });
          setStep('checkout');
        }
      } catch {
        // ignore poll errors
      }
    }, 3000);
  };

  const handleBookAndPay = async () => {
    if (!selectedService || !selectedLocation || !selectedDate || !selectedTime || !paymentMethod) return;
    setIsCreatingBooking(true);
    try {
      const booking = await api.post<any>('/bookings', {
        vehicleId: selectedVehicle || undefined,
        serviceId: selectedService,
        locationId: selectedLocation.id,
        date: selectedDate,
        time: selectedTime,
        paymentMethod,
        paymentTiming,
      });
      setBookingId(booking.id);

      // Pay at pickup — no payment now, booking is confirmed when owner accepts
      if (paymentTiming === 'pickup') {
        setStep('confirmed');
        return;
      }

      if (paymentMethod === 'mpesa') {
        if (!mpesaPhone) {
          toast({ title: 'Phone Required', description: 'Enter your M-Pesa phone number.', variant: 'destructive' });
          setIsCreatingBooking(false);
          return;
        }
        await api.post('/payments/mpesa-stk', { bookingId: booking.id, phone: mpesaPhone, amount: totalAmount });
        setStep('paying');
        startPolling(booking.id);
      } else if (paymentMethod === 'usdt' || paymentMethod === 'usdc') {
        setStep('paying');
        try {
          await runCryptoPayment(
            paymentMethod as 'usdt' | 'usdc',
            parseFloat(usdAmount),
            { onStep: setCryptoStep },
            'injected',
            selectedLocation?.ownerWalletAddress ?? undefined,
          );
          setStep('confirmed');
        } catch (cryptoErr) {
          const cryptoMsg = cryptoErr instanceof Error ? cryptoErr.message : 'Crypto payment failed';
          toast({ title: 'Payment Failed', description: cryptoMsg, variant: 'destructive' });
          setCryptoStep('idle');
          setStep('checkout');
        }
      } else if (paymentMethod === 'card') {
        // Flutterwave inline card payment — load script dynamically, then open modal
        try {
          await new Promise<void>((resolve, reject) => {
            if ((window as any).FlutterwaveCheckout) { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load payment SDK'));
            document.head.appendChild(script);
          });
          await new Promise<void>((resolve, reject) => {
            (window as any).FlutterwaveCheckout({
              public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
              tx_ref: `autoflow-${booking.id}-${Date.now()}`,
              amount: selectedServiceData?.price,
              currency: 'KES',
              payment_options: 'card',
              customer: { email: user?.email, name: user?.name, phone_number: user?.phone },
              customizations: {
                title: 'AutoFlow Payment',
                description: `${selectedServiceData?.name} at ${selectedLocation?.name}`,
                logo: '/logo.png',
              },
              callback: async (response: { transaction_id: number; status: string }) => {
                if (response.status === 'successful') {
                  try {
                    await api.post('/payments/flutterwave-verify', {
                      transactionId: response.transaction_id,
                      bookingId: booking.id,
                    });
                    resolve();
                  } catch (verifyErr) {
                    reject(verifyErr);
                  }
                } else {
                  reject(new Error('Card payment was not completed'));
                }
              },
              onclose: () => reject(new Error('Payment window closed. Your booking is saved — retry payment in My Bookings.')),
            });
          });
          setStep('confirmed');
        } catch (cardErr) {
          const cardMsg = cardErr instanceof Error ? cardErr.message : 'Card payment failed';
          toast({ title: 'Payment Incomplete', description: cardMsg, variant: 'destructive' });
          setStep('checkout');
        }
      } else {
        setStep('confirmed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Booking failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const conversionRate = livePrices?.kesPerUsd ?? 129.05;
  const basePrice = selectedServiceData?.price || 0;
  const maintenanceFee = Math.round(basePrice * 0.05);      // 5% app maintenance
  const LOGISTICS_FEE = 200;                                 // KES 200 flat logistics
  const logisticsFee = includeLogistics ? LOGISTICS_FEE : 0;
  const totalAmount = basePrice + maintenanceFee + logisticsFee;
  const usdAmount = totalAmount ? (totalAmount / conversionRate).toFixed(2) : '0';

  // ─── CONFIRMED ────────────────────────────────────
  if (step === 'confirmed') {
    const isPickup = paymentTiming === 'pickup';
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>
          <h2 className="text-2xl font-display text-foreground mb-2">You're all set!</h2>
          <p className="text-muted-foreground mb-1">
            {selectedServiceData?.name} at {selectedLocation?.name}
          </p>
          <p className="text-sm text-muted-foreground mb-4">{selectedDate} • {selectedTime}</p>
          {isPickup ? (
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 mb-8 text-left w-full">
              <p className="text-sm font-medium text-foreground mb-1">Pay at Pickup</p>
              <p className="text-xs text-muted-foreground">
                No payment taken yet. You'll receive a notification when your car is ready. Confirm pickup in the app to pay and release the car.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-success/10 border border-success/20 p-4 mb-8 text-left w-full">
              <p className="text-sm font-medium text-foreground mb-1">Payment in Escrow</p>
              <p className="text-xs text-muted-foreground">
                Your payment is securely held by AutoFlow. It will be released to the car wash only after you confirm service completion.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={() => navigate('/customer/bookings')}>View Bookings</Button>
            <Button variant="outline" onClick={() => {
              setStep('browse'); setSelectedLocation(null); setSelectedService('');
              setSelectedVehicle(''); setSelectedDate(''); setSelectedTime(''); setPaymentMethod('');
            }}>Book Another</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── PAYING ────────────────────────────────────────
  if (step === 'paying') {
    const isCrypto = paymentMethod === 'usdt' || paymentMethod === 'usdc';
    const cryptoLabel = paymentMethod.toUpperCase();
    const cryptoStepLabels: Record<string, string> = {
      idle: 'Initiating...',
      connecting: 'Connecting to wallet...',
      switching: 'Switching to Avalanche C-Chain...',
      signing: 'Approve the transaction in your wallet...',
      confirming: 'Confirming on-chain...',
    };
    const cryptoSteps = ['connecting', 'switching', 'signing', 'confirming'] as const;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          {isCrypto ? (
            <>
              <h2 className="text-2xl font-display text-foreground mb-2">Processing {cryptoLabel} Payment</h2>
              <p className="text-muted-foreground mb-2">
                Sending <strong>${usdAmount} {cryptoLabel}</strong> on Avalanche C-Chain
              </p>
              {!isWalletAvailable() && (
                <p className="text-xs text-destructive mb-4">
                  No wallet detected. Install <a href="https://core.app" target="_blank" rel="noopener noreferrer" className="underline font-medium">Core Wallet</a> (recommended) or <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline font-medium">MetaMask</a>.
                </p>
              )}
              <div className="flex flex-col gap-2 w-full mb-8">
                {cryptoSteps.map((s, i) => {
                  const currentIdx = cryptoSteps.indexOf(cryptoStep as typeof cryptoSteps[number]);
                  const isDone = currentIdx > i;
                  const isActive = cryptoStep === s;
                  return (
                    <div key={s} className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${isActive ? 'border-primary bg-primary/5' : isDone ? 'border-success/30 bg-success/5' : 'border-border'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-primary' : isDone ? 'bg-success' : 'bg-muted'}`}>
                        {isDone ? <CheckCircle className="w-3 h-3 text-white" /> : isActive ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <span className="text-[10px] text-muted-foreground">{i + 1}</span>}
                      </div>
                      <span className={isActive ? 'text-foreground font-medium' : isDone ? 'text-success' : 'text-muted-foreground'}>
                        {cryptoStepLabels[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-display text-foreground mb-2">Waiting for M-Pesa</h2>
              <p className="text-muted-foreground mb-2">An STK Push has been sent to <strong>{mpesaPhone}</strong></p>
              <p className="text-sm text-muted-foreground mb-6">Enter your M-Pesa PIN on your phone to complete the payment of <strong>KES {selectedServiceData?.price?.toLocaleString()}</strong></p>
              <div className="flex gap-2 text-xs text-muted-foreground mb-8">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < pollCount ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
              <Button variant="outline" onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setStep('checkout'); }}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─── CHECKOUT ─────────────────────────────────────
  if (step === 'checkout' && selectedLocation && selectedServiceData) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto">
          <button onClick={() => setStep('center')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-xl font-display text-foreground mb-6">Checkout</h2>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="text-sm font-medium text-foreground">{selectedServiceData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-medium text-foreground">{selectedLocation.name}</span>
            </div>
            {selectedVehicleData && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vehicle</span>
                <span className="text-sm font-medium text-foreground">{selectedVehicleData.make} {selectedVehicleData.model}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm font-medium text-foreground">{selectedDate} • {selectedTime}</span>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service price</span>
                <span className="text-foreground">KES {basePrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform maintenance (5%)</span>
                <span className="text-foreground">KES {maintenanceFee.toLocaleString()}</span>
              </div>
              {/* Logistics fee — optional for mobile/house-call services */}
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setIncludeLogistics(v => !v)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-left">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${includeLogistics ? 'border-primary bg-primary' : 'border-border'}`}>
                    {includeLogistics && <div className="w-2 h-2 rounded-sm bg-white" />}
                  </div>
                  <span>Add detailer logistics (house call)</span>
                </button>
                <span className={includeLogistics ? 'text-foreground' : 'text-muted-foreground/50'}>
                  KES {LOGISTICS_FEE.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="font-display text-foreground">Total</span>
                <span className="font-display text-xl text-foreground">KES {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ── Payment Timing ──────────────────────────────── */}
          <h3 className="text-sm font-medium text-foreground mb-1">When to pay</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Funds are held in escrow by AutoFlow and released to the car wash only after you confirm service completion.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { id: 'now' as const, icon: Zap, label: 'Pay Now', desc: 'Secure escrow at booking' },
              { id: 'pickup' as const, icon: CalendarClock, label: 'Pay at Pickup', desc: 'Pay when your car is ready' },
            ].map(t => (
              <button key={t.id} onClick={() => setPaymentTiming(t.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${paymentTiming === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${paymentTiming === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <t.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Payment Method ──────────────────────────────── */}
          <h3 className="text-sm font-medium text-foreground mb-1">Pay with</h3>
          <p className="text-xs text-muted-foreground mb-3">
            A 10% platform fee is included in all prices — this is how AutoFlow stays free for car wash owners.
          </p>
          <div className="space-y-2 mb-4">
            {[
              { id: 'mpesa', icon: Phone, label: 'M-Pesa', desc: 'Pay via STK Push to your phone', badge: 'Recommended' },
              { id: 'usdt', icon: Wallet, label: 'USDT (Tether)', desc: `≈ $${usdAmount} USDT on Avalanche`, badge: 'Web3' },
              { id: 'usdc', icon: Shield, label: 'USDC', desc: `≈ $${usdAmount} USDC on Avalanche`, badge: 'Web3' },
              { id: 'card', icon: CreditCard, label: 'Card', desc: 'Visa, Mastercard (coming soon)', badge: 'Soon', disabled: true },
            ].map(m => (
              <button key={m.id} onClick={() => !(m as any).disabled && setPaymentMethod(m.id)}
                disabled={(m as any).disabled}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${(m as any).disabled ? 'border-border bg-card opacity-50 cursor-not-allowed' : paymentMethod === m.id ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paymentMethod === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    {m.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.badge}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.id ? 'border-primary' : 'border-border'}`}>
                  {paymentMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>

          {paymentMethod === 'mpesa' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-4">
              <Label className="text-sm mb-2 block">M-Pesa Phone Number</Label>
              <Input
                placeholder="0712345678"
                value={mpesaPhone}
                onChange={e => setMpesaPhone(e.target.value)}
                className="mb-2"
              />
              <p className="text-xs text-muted-foreground">You will receive an STK Push prompt on this number.</p>
            </motion.div>
          )}

          {(paymentMethod === 'usdt' || paymentMethod === 'usdc') && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2 mb-4">
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-accent" />
                  <span>Live rate: 1 USD = {conversionRate.toFixed(2)} KES</span>
                </p>
              </div>
              {!isWalletAvailable() && (
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                  <p className="text-xs text-destructive">
                    ⚠️ No crypto wallet detected. Install <a href="https://core.app" target="_blank" rel="noopener noreferrer" className="underline font-medium">Core Wallet</a> (recommended for Avalanche) or <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline font-medium">MetaMask</a> to pay with crypto.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          <Button className="w-full h-12 text-base" disabled={!paymentMethod || isCreatingBooking} onClick={handleBookAndPay}>
            {isCreatingBooking ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : paymentTiming === 'pickup' ? (
              <><ShoppingBag className="w-4 h-4 mr-2" /> Confirm Booking (Pay at Pickup)</>
            ) : paymentMethod === 'mpesa' ? 'Pay Now with M-Pesa' :
              paymentMethod === 'usdt' ? 'Connect Core/MetaMask & Pay USDT' :
              paymentMethod === 'usdc' ? 'Connect Core/MetaMask & Pay USDC' :
              'Select payment method'}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ─── CENTER DETAIL ────────────────────────────────
  if (step === 'center' && selectedLocation) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setStep('browse'); setSelectedLocation(null); setSelectedService(''); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All locations
          </button>

          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display text-foreground mb-1">{selectedLocation.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {selectedLocation.address}
                </p>
              </div>
              {selectedLocation.rating && (
                <div className="flex items-center gap-1 bg-accent/10 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-sm font-medium text-foreground">{selectedLocation.rating}</span>
                </div>
              )}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{selectedLocation.city}</span>
              {selectedLocation.lat && selectedLocation.lng && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {parseFloat(selectedLocation.lat).toFixed(4)}, {parseFloat(selectedLocation.lng).toFixed(4)}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-display text-base text-foreground mb-3">Services</h3>
          {loadingServices ? (
            <div className="text-center py-8 text-muted-foreground">Loading services...</div>
          ) : locationServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No services available at this location.</div>
          ) : (
            <div className="space-y-2 mb-6">
              {locationServices.map((s: any) => (
                <button key={s.id} onClick={() => setSelectedService(s.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${selectedService === s.id ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-display text-foreground">KES {s.price.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                      <Clock className="w-2.5 h-2.5" /> {s.duration} min
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <AnimatePresence>
            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                className="space-y-4 mb-6">
                <h3 className="font-display text-base text-foreground">Pick a time</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Vehicle (optional)</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger><SelectValue placeholder="Select your vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.make} {v.model} – {v.licensePlate}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger><SelectValue placeholder="Time" /></SelectTrigger>
                        <SelectContent>
                          {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="sticky bottom-4 bg-card/80 backdrop-blur-md border border-border rounded-xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedServiceData?.name}</p>
                <p className="text-lg font-display text-foreground">KES {selectedServiceData?.price?.toLocaleString()}</p>
              </div>
              <Button size="lg"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep('checkout')}>
                Proceed to Pay
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─── BROWSE ───────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search car washes near you..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-card border-border"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {([
          { value: 'all', label: 'All', icon: SlidersHorizontal },
          { value: 'irl', label: 'At Car Wash', icon: Car },
          { value: 'mobile', label: 'Mobile', icon: Smartphone },
        ] as const).map(f => (
          <button key={f.value} onClick={() => setServiceMode(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${serviceMode === f.value ? 'bg-primary text-primary-foreground shadow-card' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      {loadingLocations ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Finding car washes near you...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-16">
          <Droplets className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No car washes found. Try a different search.</p>
        </div>
      ) : (() => {
        const cities = [...new Set(filteredLocations.map((c: any) => c.city))];
        return cities.map(city => {
          const centersInCity = filteredLocations.filter((c: any) => c.city === city);
          return (
            <div key={city as string} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-display text-base text-foreground">{city as string}</h3>
                <span className="text-xs text-muted-foreground">{centersInCity.length} location{centersInCity.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {centersInCity.map((center: any, i: number) => (
                  <motion.button
                    key={center.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { setSelectedLocation(center); setStep('center'); setSelectedService(''); }}
                    className="w-full flex gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card-hover hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      <Droplets className="w-8 h-8 text-primary/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-foreground truncate mb-0.5">{center.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                        <MapPin className="w-3 h-3 shrink-0" /> {center.address}
                      </p>
                      <p className="text-xs text-muted-foreground">{center.city}</p>
                      {center.ownerName && (
                        <p className="text-xs text-muted-foreground mt-1">Owner: {center.ownerName}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        });
      })()}
    </DashboardLayout>
  );
}
