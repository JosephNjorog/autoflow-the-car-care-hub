import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Eye, EyeOff, Wallet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [walletStep, setWalletStep] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setWalletStep(true);
  };

  const handleFinish = () => {
    navigate(`/${role === 'admin' ? 'customer' : role}`);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md text-center">
          <Droplets className="w-16 h-16 text-primary-foreground/80 mx-auto mb-6" />
          <h1 className="text-4xl font-display text-primary-foreground mb-4">Join AutoFlow</h1>
          <p className="text-primary-foreground/60">Create your account and start booking premium car wash services.</p>
        </motion.div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 lg:hidden mb-6">
              <Droplets className="w-7 h-7 text-primary" />
              <span className="font-display text-xl">AutoFlow</span>
            </Link>
            <h2 className="text-2xl font-display text-foreground">{walletStep ? 'Connect Your Wallet' : 'Create your account'}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {walletStep ? 'Optional: connect a crypto wallet for stablecoin payments' : 'Fill in your details to get started'}
            </p>
          </div>

          {!walletStep ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input placeholder="James" required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input placeholder="Mwangi" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label>Phone (M-Pesa)</Label>
                <Input type="tel" placeholder="+254 7XX XXX XXX" required />
              </div>
              <div className="space-y-2">
                <Label>I am a</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="detailer">Detailer (Staff)</SelectItem>
                    <SelectItem value="owner">Business Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full">Create Account</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: 'Core Wallet', desc: 'Avalanche native wallet' },
                  { name: 'WalletConnect', desc: 'Connect any supported wallet' },
                  { name: 'MetaMask', desc: 'Popular browser wallet' },
                ].map((w) => (
                  <button key={w.name} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleFinish}>Skip for Now</Button>
                <Button className="flex-1" onClick={handleFinish}>Connect & Continue</Button>
              </div>
            </div>
          )}

          {!walletStep && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </Button>
                <Button variant="outline" className="w-full">
                  <Wallet className="w-4 h-4 mr-2" /> Wallet
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
