import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockServices, mockLocations, mockVehicles } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Droplets } from 'lucide-react';

export default function BookService() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [booked, setBooked] = useState(false);
  const navigate = useNavigate();
  const vehicles = mockVehicles.filter(v => v.customerId === 'u1');

  if (booked) {
    return (
      <DashboardLayout role="customer" userName="James Mwangi">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-4 rounded-full bg-success/10 text-success mb-4">
            <CheckCircle className="w-12 h-12" />
          </motion.div>
          <h2 className="text-2xl font-display text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">Your car wash has been booked. You'll receive a confirmation shortly.</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/customer/bookings')}>View My Bookings</Button>
            <Button variant="outline" onClick={() => { setBooked(false); setStep(1); }}>Book Another</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Book a Service" subtitle="Choose a service, vehicle, and time slot." />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
            {s < 3 && <div className={`w-12 sm:w-20 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg text-foreground">Select a Service</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockServices.filter(s => s.isActive).map((s) => (
              <button key={s.id} onClick={() => setSelectedService(s.id)}
                className={`p-5 rounded-xl border text-left transition-all ${selectedService === s.id ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:shadow-card'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">{s.category}</span>
                </div>
                <p className="font-display text-foreground mb-1">{s.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{s.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg text-foreground">KES {s.price.toLocaleString()}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {s.duration} min</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={!selectedService} onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 max-w-lg">
          <h3 className="font-display text-lg text-foreground">Choose Details</h3>
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} - {v.licensePlate}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {mockLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name} - {l.address}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                <SelectContent>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button disabled={!selectedVehicle || !selectedLocation || !selectedDate || !selectedTime} onClick={() => setStep(3)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 max-w-lg">
          <h3 className="font-display text-lg text-foreground">Payment</h3>
          <div className="p-4 rounded-xl bg-card border border-border space-y-2">
            <p className="text-sm text-muted-foreground">Service: <span className="text-foreground font-medium">{mockServices.find(s => s.id === selectedService)?.name}</span></p>
            <p className="text-sm text-muted-foreground">Vehicle: <span className="text-foreground font-medium">{vehicles.find(v => v.id === selectedVehicle)?.make} {vehicles.find(v => v.id === selectedVehicle)?.model}</span></p>
            <p className="text-sm text-muted-foreground">Date: <span className="text-foreground font-medium">{selectedDate} at {selectedTime}</span></p>
            <div className="pt-2 border-t border-border">
              <p className="font-display text-xl text-foreground">KES {mockServices.find(s => s.id === selectedService)?.price.toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Payment Method</Label>
            {[{ id: 'mpesa', label: 'M-Pesa', desc: 'Pay via STK Push' }, { id: 'crypto', label: 'Crypto', desc: 'USDC on Avalanche' }].map((m) => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === m.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === m.id ? 'border-primary bg-primary' : 'border-border'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setBooked(true)}>Confirm & Pay</Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
