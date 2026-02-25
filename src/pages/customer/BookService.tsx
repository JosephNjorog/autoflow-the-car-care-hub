import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockServices, mockLocations, mockVehicles, mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, Droplets, MapPin, Star, Search,
  SlidersHorizontal, Car, Smartphone, ChevronLeft, ChevronRight,
  Wallet, CreditCard, Phone, Shield, Zap, ArrowLeft
} from 'lucide-react';

type ServiceMode = 'all' | 'irl' | 'mobile';

interface WashCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  distance: string;
  eta: string;
  serviceMode: 'irl' | 'mobile' | 'both';
  services: typeof mockServices;
  detailers: { id: string; name: string; avatar: string; rating: number; jobsDone: number }[];
  image: string;
  priceRange: string;
  isOpen: boolean;
}

// Build mock wash center data from locations
const washCenters: WashCenter[] = [
  {
    id: 'l1', name: 'AutoFlow Westlands', address: 'Westlands Rd, Nairobi', city: 'Nairobi',
    rating: 4.8, reviewCount: 234, distance: '1.2 km', eta: '5 min',
    serviceMode: 'both',
    services: mockServices.filter(s => s.isActive),
    detailers: [
      { id: 'u3', name: 'Peter Ochieng', avatar: '', rating: 4.9, jobsDone: 312 },
      { id: 'u4', name: 'Mary Akinyi', avatar: '', rating: 4.7, jobsDone: 198 },
    ],
    image: '', priceRange: 'KES 500 – 15,000', isOpen: true,
  },
  {
    id: 'l2', name: 'AutoFlow Karen', address: 'Karen Rd, Nairobi', city: 'Nairobi',
    rating: 4.6, reviewCount: 156, distance: '4.8 km', eta: '15 min',
    serviceMode: 'irl',
    services: mockServices.filter(s => s.isActive && s.category !== 'Premium'),
    detailers: [
      { id: 'u8', name: 'Lilian Wambui', avatar: '', rating: 4.8, jobsDone: 87 },
    ],
    image: '', priceRange: 'KES 500 – 2,500', isOpen: true,
  },
  {
    id: 'l3', name: 'AutoFlow CBD', address: 'Kenyatta Ave, Nairobi', city: 'Nairobi',
    rating: 4.5, reviewCount: 89, distance: '2.1 km', eta: '8 min',
    serviceMode: 'irl',
    services: mockServices.filter(s => s.isActive && s.category === 'Basic'),
    detailers: [
      { id: 'u3', name: 'Peter Ochieng', avatar: '', rating: 4.9, jobsDone: 312 },
    ],
    image: '', priceRange: 'KES 500 – 2,000', isOpen: false,
  },
  {
    id: 'l4', name: 'CleanRide Mobile', address: 'Comes to you • Nairobi', city: 'Nairobi',
    rating: 4.9, reviewCount: 67, distance: '—', eta: '30 min',
    serviceMode: 'mobile',
    services: mockServices.filter(s => s.isActive && ['Basic', 'Standard'].includes(s.category)),
    detailers: [
      { id: 'u4', name: 'Mary Akinyi', avatar: '', rating: 4.7, jobsDone: 198 },
      { id: 'u8', name: 'Lilian Wambui', avatar: '', rating: 4.8, jobsDone: 87 },
    ],
    image: '', priceRange: 'KES 800 – 2,000', isOpen: true,
  },
];

export default function BookService() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('all');
  const [selectedCenter, setSelectedCenter] = useState<WashCenter | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDetailer, setSelectedDetailer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [step, setStep] = useState<'browse' | 'center' | 'checkout' | 'confirmed'>('browse');

  const vehicles = mockVehicles.filter(v => v.customerId === 'u1');

  const filteredCenters = useMemo(() => {
    return washCenters.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = serviceMode === 'all' ||
        c.serviceMode === serviceMode ||
        c.serviceMode === 'both';
      return matchesSearch && matchesMode;
    });
  }, [searchQuery, serviceMode]);

  const selectedServiceData = selectedCenter?.services.find(s => s.id === selectedService);
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  // ─── CONFIRMED ────────────────────────────────────
  if (step === 'confirmed') {
    return (
      <DashboardLayout role="customer" userName="James Mwangi">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>
          <h2 className="text-2xl font-display text-foreground mb-2">You're all set!</h2>
          <p className="text-muted-foreground mb-1">
            {selectedServiceData?.name} at {selectedCenter?.name}
          </p>
          <p className="text-sm text-muted-foreground mb-8">{selectedDate} • {selectedTime}</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/customer/bookings')}>View Bookings</Button>
            <Button variant="outline" onClick={() => { setStep('browse'); setSelectedCenter(null); setSelectedService(''); }}>Book Another</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── CHECKOUT ─────────────────────────────────────
  if (step === 'checkout' && selectedCenter && selectedServiceData) {
    const conversionRate = 129.05;
    const usdAmount = (selectedServiceData.price / conversionRate).toFixed(2);

    return (
      <DashboardLayout role="customer" userName="James Mwangi">
        <div className="max-w-lg mx-auto">
          <button onClick={() => setStep('center')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h2 className="text-xl font-display text-foreground mb-6">Checkout</h2>

          {/* Order summary */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="text-sm font-medium text-foreground">{selectedServiceData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-medium text-foreground">{selectedCenter.name}</span>
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
            {selectedDetailer && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Detailer</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedCenter.detailers.find(d => d.id === selectedDetailer)?.name}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-display text-foreground">Total</span>
              <span className="font-display text-xl text-foreground">KES {selectedServiceData.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment methods */}
          <h3 className="text-sm font-medium text-foreground mb-3">Pay with</h3>
          <div className="space-y-2 mb-6">
            {[
              { id: 'mpesa', icon: Phone, label: 'M-Pesa', desc: 'Pay instantly via STK Push', badge: 'Popular' },
              { id: 'card', icon: CreditCard, label: 'Card', desc: 'Visa, Mastercard', badge: '' },
              { id: 'usdt', icon: Wallet, label: 'USDT (Tether)', desc: `≈ $${usdAmount} USDT on Avalanche`, badge: 'Web3' },
              { id: 'usdc', icon: Shield, label: 'USDC', desc: `≈ $${usdAmount} USDC on Avalanche`, badge: 'Web3' },
            ].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  paymentMethod === m.id
                    ? 'border-primary bg-primary/5 shadow-card'
                    : 'border-border bg-card hover:border-primary/30'
                }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  paymentMethod === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    {m.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.badge}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === m.id ? 'border-primary' : 'border-border'
                }`}>
                  {paymentMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>

          {(paymentMethod === 'usdt' || paymentMethod === 'usdc') && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="rounded-lg bg-accent/5 border border-accent/20 p-3 mb-6">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-accent" />
                <span>Rate via <span className="font-medium text-foreground">Chainlink Data Feeds</span>: 1 USD = {conversionRate} KES</span>
              </p>
            </motion.div>
          )}

          <Button className="w-full h-12 text-base" disabled={!paymentMethod} onClick={() => setStep('confirmed')}>
            {paymentMethod === 'mpesa' ? 'Pay with M-Pesa' :
             paymentMethod === 'card' ? 'Pay with Card' :
             paymentMethod === 'usdt' ? 'Connect Wallet & Pay USDT' :
             paymentMethod === 'usdc' ? 'Connect Wallet & Pay USDC' :
             'Select payment method'}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ─── CENTER DETAIL ────────────────────────────────
  if (step === 'center' && selectedCenter) {
    return (
      <DashboardLayout role="customer" userName="James Mwangi">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setStep('browse'); setSelectedCenter(null); setSelectedService(''); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All locations
          </button>

          {/* Center header */}
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-display text-foreground">{selectedCenter.name}</h2>
                  {selectedCenter.serviceMode === 'mobile' && (
                    <Badge variant="secondary" className="text-[10px]"><Smartphone className="w-3 h-3 mr-1" />Mobile</Badge>
                  )}
                  {selectedCenter.serviceMode === 'both' && (
                    <Badge variant="secondary" className="text-[10px]">IRL + Mobile</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {selectedCenter.address}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-accent/10 px-2.5 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                <span className="text-sm font-medium text-foreground">{selectedCenter.rating}</span>
                <span className="text-xs text-muted-foreground">({selectedCenter.reviewCount})</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedCenter.eta} away</span>
              <span>{selectedCenter.priceRange}</span>
              <span className={selectedCenter.isOpen ? 'text-success' : 'text-destructive'}>
                {selectedCenter.isOpen ? 'Open now' : 'Closed'}
              </span>
            </div>
          </div>

          {/* Services */}
          <h3 className="font-display text-base text-foreground mb-3">Services</h3>
          <div className="space-y-2 mb-6">
            {selectedCenter.services.map(s => (
              <button key={s.id} onClick={() => setSelectedService(s.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  selectedService === s.id
                    ? 'border-primary bg-primary/5 shadow-card'
                    : 'border-border bg-card hover:border-primary/30'
                }`}>
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

          {/* Detailers */}
          <h3 className="font-display text-base text-foreground mb-3">Available Detailers</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {selectedCenter.detailers.map(d => (
              <button key={d.id} onClick={() => setSelectedDetailer(d.id === selectedDetailer ? '' : d.id)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  selectedDetailer === d.id
                    ? 'border-primary bg-primary/5 shadow-card'
                    : 'border-border bg-card hover:border-primary/30'
                }`}>
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center text-muted-foreground font-display text-lg">
                  {d.name.charAt(0)}
                </div>
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-accent fill-accent" />
                  <span className="text-xs text-foreground">{d.rating}</span>
                  <span className="text-[10px] text-muted-foreground">• {d.jobsDone} jobs</span>
                </div>
              </button>
            ))}
          </div>

          {/* Schedule */}
          <AnimatePresence>
            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                className="space-y-4 mb-6">
                <h3 className="font-display text-base text-foreground">Pick a time</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Vehicle</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger><SelectValue placeholder="Select your vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.make} {v.model} – {v.licensePlate}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
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

          {/* CTA */}
          {selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="sticky bottom-4 bg-card/80 backdrop-blur-md border border-border rounded-xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedServiceData?.name}</p>
                <p className="text-lg font-display text-foreground">KES {selectedServiceData?.price.toLocaleString()}</p>
              </div>
              <Button size="lg"
                disabled={!selectedVehicle || !selectedDate || !selectedTime}
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

  // ─── BROWSE (Uber-style list) ─────────────────────
  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search car washes near you..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-card border-border"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {([
          { value: 'all', label: 'All', icon: SlidersHorizontal },
          { value: 'irl', label: 'At Car Wash', icon: Car },
          { value: 'mobile', label: 'Mobile', icon: Smartphone },
        ] as const).map(f => (
          <button key={f.value} onClick={() => setServiceMode(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              serviceMode === f.value
                ? 'bg-primary text-primary-foreground shadow-card'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Location groups */}
      {(() => {
        const cities = [...new Set(filteredCenters.map(c => c.city))];
        return cities.map(city => {
          const centersInCity = filteredCenters.filter(c => c.city === city);
          return (
            <div key={city} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-display text-base text-foreground">{city}</h3>
                <span className="text-xs text-muted-foreground">{centersInCity.length} location{centersInCity.length > 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-3">
                {centersInCity.map((center, i) => (
                  <motion.button
                    key={center.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { setSelectedCenter(center); setStep('center'); setSelectedService(''); setSelectedDetailer(''); }}
                    className="w-full flex gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card-hover hover:border-primary/30 transition-all text-left group"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      <Droplets className="w-8 h-8 text-primary/40 group-hover:text-primary transition-colors" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-display text-foreground truncate">{center.name}</h4>
                        {center.serviceMode === 'mobile' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            <Smartphone className="w-2.5 h-2.5 mr-0.5" />Mobile
                          </Badge>
                        )}
                        {!center.isOpen && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">Closed</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                        <MapPin className="w-3 h-3 shrink-0" /> {center.address}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="font-medium text-foreground">{center.rating}</span>
                          <span>({center.reviewCount})</span>
                        </span>
                        <span>{center.distance}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{center.eta}</span>
                      </div>
                      {/* Detailer avatars */}
                      <div className="flex items-center gap-1 mt-2">
                        {center.detailers.slice(0, 3).map(d => (
                          <div key={d.id} className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground -ml-1 first:ml-0">
                            {d.name.charAt(0)}
                          </div>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {center.detailers.length} detailer{center.detailers.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <p className="text-xs text-muted-foreground">from</p>
                      <p className="font-display text-foreground">KES {Math.min(...center.services.map(s => s.price)).toLocaleString()}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        });
      })()}

      {filteredCenters.length === 0 && (
        <div className="text-center py-16">
          <Droplets className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No car washes found. Try a different filter.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
