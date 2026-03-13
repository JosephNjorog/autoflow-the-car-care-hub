import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Eye, EyeOff, Wallet, Upload, X, IdCard, Building2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'detailer' | 'owner'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });

  // Owner KYC state
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('Nairobi');
  const [idDoc, setIdDoc] = useState<{ name: string; data: string } | null>(null);
  const [photos, setPhotos] = useState<{ name: string; data: string }[]>([]);
  const idInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'ID document must be under 5MB.', variant: 'destructive' });
      return;
    }
    const data = await fileToBase64(file);
    setIdDoc({ name: file.name, data });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast({ title: 'Too many photos', description: 'Upload up to 3 business photos.', variant: 'destructive' });
      return;
    }
    const newPhotos = await Promise.all(
      files.map(async f => ({ name: f.name, data: await fileToBase64(f) }))
    );
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      toast({ title: 'Weak password', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (role === 'owner' && !businessName) {
      toast({ title: 'Business name required', description: 'Please enter your business name.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await register({ ...formData, role });

      // Submit KYC application alongside registration for owners
      if (role === 'owner') {
        try {
          await api.post('/auth/submit-kyc', {
            businessName, businessAddress, businessCity, idDoc, photos,
          });
        } catch {
          // Non-blocking — account created, KYC can be resubmitted
        }
      }

      if (result.requiresApproval) {
        toast({
          title: 'Application Submitted!',
          description: 'Your business owner account is pending admin approval. We will notify you by email once approved.',
        });
        navigate('/login');
      } else {
        const dashboardMap = { customer: '/customer', detailer: '/detailer', owner: '/owner' };
        navigate(dashboardMap[role]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast({ title: 'Registration failed', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md text-center">
          <Droplets className="w-16 h-16 text-primary-foreground/80 mx-auto mb-6" />
          <h1 className="text-4xl font-display text-primary-foreground mb-4">Join AutoPayKe</h1>
          <p className="text-primary-foreground/60">Create your account and start booking premium car wash services.</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 py-8">
          <div className="text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 lg:hidden mb-6">
              <Droplets className="w-7 h-7 text-primary" />
              <span className="font-display text-xl">AutoPayKe</span>
            </Link>
            <h2 className="text-2xl font-display text-foreground">Create your account</h2>
            <p className="text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>First Name</Label><Input name="firstName" placeholder="James" value={formData.firstName} onChange={handleChange} required /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input name="lastName" placeholder="Mwangi" value={formData.lastName} onChange={handleChange} required /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label>Phone (M-Pesa)</Label><Input name="phone" type="tel" placeholder="+254 7XX XXX XXX" value={formData.phone} onChange={handleChange} /></div>
            <div className="space-y-2">
              <Label>I am a</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'customer' | 'detailer' | 'owner')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="detailer">Detailer (Staff)</SelectItem>
                  <SelectItem value="owner">Business Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner KYC section */}
            <AnimatePresence>
              {role === 'owner' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Business Details</p>
                      <span className="text-xs text-muted-foreground ml-auto">Required for approval</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Business Name <span className="text-destructive">*</span></Label>
                      <Input placeholder="e.g. Westlands AutoFlow" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2 col-span-2">
                        <Label>Business Address</Label>
                        <Input placeholder="e.g. Westlands Rd, Nairobi" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input placeholder="Nairobi" value={businessCity} onChange={e => setBusinessCity(e.target.value)} />
                      </div>
                    </div>

                    {/* National ID upload */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <IdCard className="w-3.5 h-3.5 text-primary" /> National ID / KYC Document
                      </Label>
                      <input ref={idInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                      {idDoc ? (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-success/10 border border-success/20 text-sm">
                          <span className="text-success font-medium truncate max-w-[80%]">{idDoc.name}</span>
                          <button type="button" onClick={() => { setIdDoc(null); if (idInputRef.current) idInputRef.current.value = ''; }}>
                            <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <Button type="button" variant="outline" className="w-full border-dashed gap-2 h-10" onClick={() => idInputRef.current?.click()}>
                          <Upload className="w-4 h-4" /> Upload ID / KYC Document
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">National ID, Passport, or Business Registration. Max 5MB.</p>
                    </div>

                    {/* Business photos */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-primary" /> Business Photos
                        <span className="text-xs text-muted-foreground font-normal ml-1">({photos.length}/3)</span>
                      </Label>
                      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                      {photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-1">
                          {photos.map((p, i) => (
                            <div key={i} className="relative group w-20 h-20">
                              <img src={p.data} alt={p.name} className="w-full h-full object-cover rounded-lg border border-border" />
                              <button type="button"
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}>
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {photos.length < 3 && (
                        <Button type="button" variant="outline" className="w-full border-dashed gap-2 h-10" onClick={() => photoInputRef.current?.click()}>
                          <Camera className="w-4 h-4" /> Add Business Photos {photos.length > 0 && `(${3 - photos.length} remaining)`}
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">Photos of your car wash premises. Up to 3 images.</p>
                    </div>

                    <p className="text-xs text-warning flex items-start gap-1.5 pt-1 border-t border-warning/20">
                      <span className="mt-0.5">⚠</span>
                      Your account will be reviewed by our team. You'll receive an email once approved.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : role === 'owner' ? 'Submit Application' : 'Create Account'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </Button>
            <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Connect after signing up', description: 'Connect your wallet from the Wallet page after creating your account.' })}>
              <Wallet className="w-4 h-4 mr-2" /> Wallet
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
