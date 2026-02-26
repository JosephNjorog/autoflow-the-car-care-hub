import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Eye, EyeOff, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'detailer' | 'owner'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      toast({ title: 'Weak password', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await register({ ...formData, role });
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
          <h1 className="text-4xl font-display text-primary-foreground mb-4">Join AutoFlow</h1>
          <p className="text-primary-foreground/60">Create your account and start booking premium car wash services.</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 lg:hidden mb-6">
              <Droplets className="w-7 h-7 text-primary" />
              <span className="font-display text-xl">AutoFlow</span>
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
              {role === 'owner' && (
                <p className="text-xs text-warning mt-1">Business owner accounts require admin approval before access is granted.</p>
              )}
            </div>
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
              {isLoading ? 'Creating account...' : 'Create Account'}
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
