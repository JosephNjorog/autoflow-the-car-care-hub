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
  Wallet, CreditCard, Phone, Shield, Zap, ArrowLeft, Loader2, Banknote
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
        if (status.paymentStatus === 'completed') {
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
      });
      setBookingId(booking.id);

      if (paymentMethod === 'mpesa') {
        if (!mpesaPhone) {
          toast({ title: 'Phone Required', description: 'Enter your M-Pesa phone number.', variant: 'destructive' });
          setIsCreatingBooking(false);
          return;
        }
        await api.post('/payments/mpesa-stk', { bookingId: booking.id, phone: mpesaPhone });
        setStep('paying');
        startPolling(booking.id);
      } else if (paymentMethod === 'usdt' || paymentMethod === 'usdc') {
        setStep('paying');
        try {
          await runCryptoPayment(
            paymentMethod as 'usdt' | 'usdc',
            parseFloat(usdAmount),
            { onStep: setCryptoStep }
          );
          setStep('confirmed');
        } catch (cryptoErr) {
          const cryptoMsg = cryptoErr instanceof Error ? cryptoErr.message : 'Crypto payment failed';
          toast({ title: 'Payment Failed', description: cryptoMsg, variant: 'destructive' });
          setCryptoStep('idle');
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
  const usdAmount = selectedServiceData ? (selectedServiceData.price / conversionRate).toFixed(2) : '0';

  // ─── CONFIRMED ────────────────────────────────────
  if (step === 'confirmed') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>
          <h2 className="text-2xl font-display text-foreground mb-2">You're all set!</h2>
          <p className="text-muted-foreground mb-1">
            {selectedServiceData?.name} at {selectedLocation?.name}
          </p>
          <p className="text-sm text-muted-foreground mb-8">{selectedDate} • {selectedTime}</p>
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
                  No wallet detected. Please install MetaMask or open this in Trust Wallet's browser.
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
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-display text-foreground">Total</span>
              <span className="font-display text-xl text-foreground">KES {selectedServiceData.price.toLocaleString()}</span>
            </div>
          </div>

          <h3 className="text-sm font-medium text-foreground mb-1">Pay with</h3>
          <p className="text-xs text-muted-foreground mb-3">
            A 10% platform fee is included in all prices — this is how AutoFlow stays free for car wash owners.
          </p>
          <div className="space-y-2 mb-4">
            {[
              { id: 'mpesa', icon: Phone, label: 'M-Pesa', desc: 'Pay instantly via STK Push', badge: 'Recommended' },
              { id: 'usdt', icon: Wallet, label: 'USDT (Tether)', desc: `≈ $${usdAmount} USDT on Avalanche`, badge: 'Web3' },
              { id: 'usdc', icon: Shield, label: 'USDC', desc: `≈ $${usdAmount} USDC on Avalanche`, badge: 'Web3' },
              { id: 'card', icon: CreditCard, label: 'Card', desc: 'Visa, Mastercard', badge: '' },
              { id: 'cash', icon: Banknote, label: 'Cash on Arrival', desc: 'Pay the detailer directly — last resort only', badge: 'Last resort' },
            ].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${paymentMethod === m.id ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}>
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
                    ⚠️ No crypto wallet detected. Install <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline font-medium">MetaMask</a> or open this page in <a href="https://trustwallet.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Trust Wallet</a>'s browser to pay with crypto.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          <Button className="w-full h-12 text-base" disabled={!paymentMethod || isCreatingBooking} onClick={handleBookAndPay}>
            {isCreatingBooking ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : paymentMethod === 'mpesa' ? 'Pay with M-Pesa' :
              paymentMethod === 'usdt' ? 'Connect Wallet & Pay USDT' :
              paymentMethod === 'usdc' ? 'Connect Wallet & Pay USDC' :
              paymentMethod === 'card' ? 'Pay with Card' :
              paymentMethod === 'cash' ? 'Confirm Booking (Pay on Arrival)' :
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
