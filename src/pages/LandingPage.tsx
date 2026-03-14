import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Droplets, Star, Shield, Zap, Users, ArrowRight, CheckCircle,
  MapPin, Award, TrendingUp, Car, CreditCard, ChevronRight, BadgeCheck,
  Sparkles, Activity, Bot, Cpu, Wallet, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ─── Data ──────────────────────────────────────────────────────────────────────

const trustItems = [
  'M-Pesa STK Push', 'Proof-of-Service', 'Avalanche Network', 'USDT & USDC',
  'Loyalty Rewards', 'AI Assistant', 'Revenue Analytics', 'Verified Detailers',
  'M-Pesa STK Push', 'Proof-of-Service', 'Avalanche Network', 'USDT & USDC',
  'Loyalty Rewards', 'AI Assistant', 'Revenue Analytics', 'Verified Detailers',
];

const tiers = [
  {
    name: 'Economy',
    price: 'KSh 300 – 1,000',
    desc: 'The quick, efficient clean for everyday drivers.',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop',
    services: ['Exterior rinse', 'Tire rinse', 'Basic interior wipe', 'Window clean'],
    color: 'from-blue-500/20 to-cyan-500/10',
    badge: 'Most Popular',
  },
  {
    name: 'First Class',
    price: 'KSh 1,000 – 2,000',
    desc: 'A thorough wash with interior attention.',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&auto=format&fit=crop',
    services: ['Full exterior wash', 'Engine wash', 'Interior detailing', 'Tyre dressing', 'Dashboard wipe'],
    color: 'from-violet-500/20 to-purple-500/10',
    badge: 'Best Value',
  },
  {
    name: 'Premium',
    price: 'KSh 1,500 – 4,000',
    desc: 'Full detailing — the complete AutoPayKe experience.',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&auto=format&fit=crop',
    services: ['Full detailing', 'Sumpguard wash', 'Paint protection', 'Leather treatment', 'Odour elimination'],
    color: 'from-amber-500/20 to-orange-500/10',
    badge: 'Premium',
  },
];

const operatorSteps = [
  { num: '01', icon: <MapPin className="w-6 h-6" />, title: 'Add your location', desc: 'List your location, services, pricing, and operating hours in minutes.' },
  { num: '02', icon: <CreditCard className="w-6 h-6" />, title: 'Automated Payment', desc: 'Accept M-Pesa, cards, and stablecoin payments — all verified and settled instantly.' },
  { num: '03', icon: <TrendingUp className="w-6 h-6" />, title: 'Revenue Analytics', desc: 'Track peak hours, revenue trends, and customer retention from your dashboard.' },
  { num: '04', icon: <Award className="w-6 h-6" />, title: 'Loyalty Tools', desc: 'Digital stamps, tier rewards, and automated win-back campaigns to keep customers returning.' },
];

const driverSteps = [
  { num: '01', icon: <MapPin className="w-6 h-6" />, title: 'Find nearby washes', desc: 'Discover verified car washes near you with real-time availability and pricing.' },
  { num: '02', icon: <Car className="w-6 h-6" />, title: 'Book a Service', desc: 'Select your wash tier, confirm the booking, and get notified when it\'s done.' },
  { num: '03', icon: <CheckCircle className="w-6 h-6" />, title: 'Track Your Washes', desc: 'Every wash is recorded with proof-of-service. View your full history anytime.' },
  { num: '04', icon: <Star className="w-6 h-6" />, title: 'Earn Rewards', desc: 'Customers earn points and tier rewards with every verified wash — no stamps needed.' },
];

const WAITLIST_ROLES = ['Driver', 'Owner', 'Detailer', 'Developer'] as const;
const WAITLIST_TIERS = ['Economy', 'First Class', 'Premium'] as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [wlName, setWlName] = useState('');
  const [wlEmail, setWlEmail] = useState('');
  const [wlPhone, setWlPhone] = useState('');
  const [wlRole, setWlRole] = useState<string>('Driver');
  const [wlTier, setWlTier] = useState<string>('');
  const [wlLoading, setWlLoading] = useState(false);
  const [wlDone, setWlDone] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlEmail || !wlRole) return;
    setWlLoading(true);
    try {
      await api.post('/auth/waitlist', {
        name: wlName,
        email: wlEmail,
        phone: wlPhone,
        role: wlRole.toLowerCase().replace(' ', '_'),
        tier: wlTier ? wlTier.toLowerCase().replace(' ', '_') : null,
      });
      setWlDone(true);
      toast({ title: "You're on the list!", description: 'We\'ll reach out as soon as AutoPayKe launches in your area.' });
    } catch {
      toast({ title: 'Already registered', description: 'This email is already on the waitlist.', variant: 'destructive' });
    } finally {
      setWlLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass border-b border-border/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl text-foreground tracking-tight">
              <span className="uppercase font-bold">AUTOPAY</span><span className="lowercase font-light text-primary">ke</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#tiers" className="hover:text-foreground transition-colors">Tiers</a>
            <a href="#operators" className="hover:text-foreground transition-colors">For Operators</a>
            <a href="#drivers" className="hover:text-foreground transition-colors">For Drivers</a>
            <Link to="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
            <Button size="sm" onClick={() => navigate('/register')} className="shadow-glow">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop&q=80"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(207 85% 40% / 0.2), transparent 55%), radial-gradient(ellipse at 80% 20%, hsl(191 92% 48% / 0.15), transparent 50%)' }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              The Operating System for Car Wash Businesses
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-foreground leading-[1.0] mb-6 tracking-tight">
              Book.<br />
              Wash.<br />
              <em className="not-italic text-gradient">Track. Earn.</em>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
              AutoPayKe connects drivers to verified car washes nearby while giving operators the tools to verify services, automate payments, and reward loyalty.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button size="lg" onClick={() => navigate('/register')} className="px-8 shadow-glow ice-shimmer text-base">
                <MapPin className="w-4 h-4 mr-2" /> Find a Wash Nearby
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/register?role=owner')} className="border-border/60 text-base">
                Register Car Wash <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[22, 44, 32, 68, 55].map((n) => (
                  <img
                    key={n}
                    src={`https://randomuser.me/api/portraits/${n % 2 === 0 ? 'women' : 'men'}/${n}.jpg`}
                    className="w-9 h-9 rounded-full border-2 border-background object-cover"
                    alt=""
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">Launching in Nairobi</span> · Be among the first
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust Marquee ──────────────────────────────────────────────────────── */}
      <div className="border-y border-border/50 bg-card/40 py-4 overflow-hidden">
        <motion.div
          className="flex gap-10 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        >
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
              {item}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Problem Statement ──────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl"
          >
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-4">The Problem</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-foreground leading-tight mb-6">
              A massive market,<br />
              <span className="text-muted-foreground font-light">completely underserved.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-xl">
              Kenya's car wash industry is growing fast — but the infrastructure hasn't kept up. No digital payments, no service records, no loyalty systems.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { stat: '10M+', label: 'Registered vehicles in Kenya', color: 'text-blue-500' },
              { stat: '40K+', label: 'Car wash businesses nationwide', color: 'text-primary' },
              { stat: '95%', label: 'Still cash-only operations', color: 'text-amber-500' },
              { stat: '0%', label: 'With digital loyalty programs', color: 'text-rose-500' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border shadow-card"
              >
                <p className={`text-4xl font-display font-bold mb-1 ${s.color}`}>{s.stat}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Tiers ──────────────────────────────────────────────────────── */}
      <section id="tiers" className="py-24 md:py-32 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-3">Service Tiers</p>
            <h2 className="text-4xl md:text-5xl font-display text-foreground mb-4">Every tier, verified.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              From a quick exterior rinse to full detailing — every tier is verified, tracked, and rewarded through AutoPayKe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group relative rounded-2xl overflow-hidden border border-border bg-card shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={tier.image}
                    alt={tier.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium backdrop-blur-sm">
                      {tier.badge}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-foreground mb-1">{tier.name}</h3>
                  <p className="text-primary font-semibold text-lg mb-3">{tier.price}</p>
                  <p className="text-sm text-muted-foreground mb-5">{tier.desc}</p>
                  <ul className="space-y-2">
                    {tier.services.map((s, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Operators ──────────────────────────────────────────────────────── */}
      <section id="operators" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-xs text-primary uppercase tracking-widest font-medium mb-4">For Operators</p>
              <h2 className="text-4xl md:text-5xl font-display text-foreground leading-tight mb-6">
                Run your car wash<br />like a tech company.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10">
                AutoPayKe gives operators the tools to verify services, automate payments, track revenue, and reward loyalty — all from one dashboard.
              </p>
              <div className="space-y-6">
                {operatorSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {step.icon}
                      </div>
                      {i < operatorSteps.length - 1 && <div className="w-px flex-1 bg-border/60 mt-2" />}
                    </div>
                    <div className="pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">{step.num}</span>
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button size="lg" onClick={() => navigate('/register?role=owner')} className="shadow-glow mt-4">
                Register Your Wash <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl border border-border bg-card shadow-card-hover overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">dashboard.autopayke.com</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Today's Revenue", value: 'KES 18,400', icon: <TrendingUp className="w-4 h-4" />, color: 'text-success' },
                      { label: 'Bookings Today', value: '24', icon: <Car className="w-4 h-4" />, color: 'text-primary' },
                      { label: 'Active Staff', value: '6 / 8', icon: <Users className="w-4 h-4" />, color: 'text-blue-500' },
                      { label: 'Loyalty Pts Issued', value: '1,240', icon: <Award className="w-4 h-4" />, color: 'text-amber-500' },
                    ].map((stat, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-background/60 border border-border">
                        <div className={`flex items-center gap-1.5 mb-2 ${stat.color}`}>{stat.icon}<span className="text-xs text-muted-foreground">{stat.label}</span></div>
                        <p className="font-display text-xl text-foreground">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-background/60 border border-border p-3.5">
                    <p className="text-xs text-muted-foreground mb-3">Recent Bookings</p>
                    {[
                      { name: 'James M.', service: 'Premium Detail', status: 'completed', amount: 'KES 3,200' },
                      { name: 'Aisha K.', service: 'First Class', status: 'in_progress', amount: 'KES 1,500' },
                      { name: 'Brian O.', service: 'Economy', status: 'pending', amount: 'KES 600' },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.service}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{b.amount}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-success/15 text-success' : b.status === 'in_progress' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {b.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating earnings card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-5 -left-5 frost rounded-xl p-4 shadow-ice border border-border w-52"
              >
                <p className="text-xs text-muted-foreground mb-1">This month</p>
                <p className="text-2xl font-display text-foreground">KES 84,200</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                  <p className="text-xs text-success font-medium">+23% vs last month</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── For Drivers ────────────────────────────────────────────────────────── */}
      <section id="drivers" className="py-24 md:py-32 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="mx-auto w-72 rounded-[2rem] border-4 border-foreground/10 bg-card shadow-card-hover overflow-hidden">
                <div className="h-6 bg-foreground/5 flex items-center justify-center">
                  <div className="w-20 h-1.5 rounded-full bg-foreground/20" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Nearby Washes</p>
                    <span className="text-xs text-primary">See all</span>
                  </div>
                  {[
                    { name: 'Premium Shine Wash', dist: '1.2 km', rating: '4.8', price: 'KES 2,400', tier: 'Premium' },
                    { name: 'Quick Rinse Wash', dist: '0.4 km', rating: '4.6', price: 'KES 500', tier: 'Economy' },
                    { name: 'City Express Wash', dist: '2.1 km', rating: '4.9', price: 'KES 1,200', tier: 'First Class' },
                  ].map((w, i) => (
                    <div key={i} className="p-3 rounded-xl bg-background/60 border border-border">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">{w.name}</p>
                        <span className="text-xs text-muted-foreground">{w.dist}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs text-muted-foreground">{w.rating}</span>
                          <span className="text-xs text-muted-foreground/50 mx-1">·</span>
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{w.tier}</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground">{w.price}</p>
                      </div>
                    </div>
                  ))}
                  {/* M-Pesa prompt */}
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-success shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-success">M-Pesa STK Push Sent</p>
                      <p className="text-[10px] text-muted-foreground">Enter PIN to confirm KES 1,200</p>
                    </div>
                  </motion.div>
                </div>
              </div>
              {/* Floating loyalty card */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -right-4 top-16 frost rounded-xl p-3.5 shadow-ice border border-border w-48"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-medium text-foreground">Gold Member</p>
                </div>
                <p className="text-2xl font-display text-foreground">3,240 pts</p>
                <p className="text-[10px] text-muted-foreground mt-1">760 pts to Platinum</p>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[81%] rounded-full bg-amber-400" />
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <p className="text-xs text-primary uppercase tracking-widest font-medium mb-4">For Drivers</p>
              <h2 className="text-4xl md:text-5xl font-display text-foreground leading-tight mb-6">
                Find a wash nearby.<br />
                <span className="text-muted-foreground font-light">Pay. Earn. Repeat.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10">
                Find nearby car washes, book a service, track every wash, and earn rewards — all from your phone.
              </p>
              <div className="space-y-6">
                {driverSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {step.icon}
                      </div>
                      {i < driverSteps.length - 1 && <div className="w-px flex-1 bg-border/60 mt-2" />}
                    </div>
                    <div className="pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">{step.num}</span>
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button size="lg" onClick={() => navigate('/register')} className="shadow-glow mt-4">
                Find a Wash Nearby <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Proof-of-Service ───────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/5 via-transparent to-muted-foreground/5" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-xs text-primary uppercase tracking-widest font-medium mb-4">Proof-of-Service Protocol</p>
              <h2 className="text-4xl md:text-5xl font-display text-foreground leading-tight mb-6">
                Every wash,<br />verified on-chain.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                AutoPayKe turns every car wash into a verified, trackable, and intelligent transaction. Every completed wash generates a tamper-proof digital record. Payments are released automatically upon verification — no disputes, no delays.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Shield className="w-5 h-5" />, title: 'Tamper-proof records', desc: 'Each wash generates a digital proof-of-service record stored permanently.' },
                  { icon: <Zap className="w-5 h-5" />, title: 'Automated settlement', desc: 'Funds are released to the operator automatically upon service verification.' },
                  { icon: <Activity className="w-5 h-5" />, title: 'Real-time tracking', desc: 'Customers track their service status in real time from booking to completion.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-card/60 border border-border">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{item.icon}</div>
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {/* Service record card */}
              <div className="rounded-2xl border border-border bg-card shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-foreground">Service Record</p>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-success font-medium">Verified</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="text-foreground font-medium">Premium Detail</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="text-foreground font-medium">Westlands Centre</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-foreground font-medium">KES 3,200</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="text-success font-medium flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />M-Pesa confirmed</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Points earned</span><span className="text-amber-500 font-medium">+320 pts</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[10px] text-muted-foreground font-mono break-all">proof: 0x4a2f...8c1e · Avalanche C-Chain</p>
                </div>
              </div>

              {/* Payments section */}
              <div className="rounded-2xl border border-border bg-card shadow-card p-5">
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">Accepted Payments</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Smartphone className="w-5 h-5" />, label: 'M-Pesa', sub: 'Recommended', color: 'text-green-500 bg-green-500/10' },
                    { icon: <Wallet className="w-5 h-5" />, label: 'USDT', sub: 'Avalanche C-Chain', color: 'text-emerald-500 bg-emerald-500/10' },
                    { icon: <Wallet className="w-5 h-5" />, label: 'USDC', sub: 'Avalanche C-Chain', color: 'text-blue-500 bg-blue-500/10' },
                    { icon: <CreditCard className="w-5 h-5" />, label: 'Cash', sub: 'Pay on arrival', color: 'text-amber-500 bg-amber-500/10' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${p.color}`}>{p.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.label}</p>
                        <p className="text-[10px] text-muted-foreground">{p.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── AI Assistant ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-card/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">AutoPayKe Agent</p>
                  <p className="text-xs text-muted-foreground">AI-powered assistant</p>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-display text-foreground mb-4">
                Your AI car care assistant.
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                AutoPayKe includes an AI-powered assistant that helps drivers and car wash operators discover services, track activity, and optimize operations in real time.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full max-w-md"
            >
              <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
                {[
                  { role: 'user', text: 'Find me a Premium car wash near Westlands under KES 4,000' },
                  { role: 'agent', text: 'Found 3 verified Premium washes nearby. Top pick: Premium Shine Wash — 1.2 km away, KES 3,200, rated 4.8★ with 120+ verified services. Shall I book it?' },
                  { role: 'user', text: 'Yes, book it with M-Pesa' },
                  { role: 'agent', text: 'Booking confirmed. M-Pesa STK Push sent to your number. Enter your PIN to complete payment.' },
                ].map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Waitlist CTA ───────────────────────────────────────────────────────── */}
      <section id="waitlist" className="py-24 md:py-32">
        <div className="max-w-2xl mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              <Cpu className="w-4 h-4" />
              Early Access
            </div>
            <h2 className="text-4xl md:text-5xl font-display text-foreground mb-4">
              Join the waitlist.
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              The complete car wash operating system for Kenya. Payments, analytics, and loyalty — unified.
              <br />Be first in line when we launch.
            </p>

            {wlDone ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-success/30 bg-success/10 p-10 text-center"
              >
                <CheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
                <h3 className="font-display text-2xl text-foreground mb-2">You're on the list!</h3>
                <p className="text-muted-foreground">We'll reach out as soon as AutoPayKe launches in your area.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleWaitlist} className="frost rounded-2xl p-6 md:p-8 shadow-ice space-y-4 text-left">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={wlName}
                      onChange={e => setWlName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Phone <span className="text-muted-foreground/50">(optional)</span></label>
                    <input
                      type="tel"
                      placeholder="+254..."
                      value={wlPhone}
                      onChange={e => setWlPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Email <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={wlEmail}
                    onChange={e => setWlEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">I am a <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WAITLIST_ROLES.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setWlRole(r)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${wlRole === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">Preferred tier <span className="text-muted-foreground/50">(optional)</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {WAITLIST_TIERS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setWlTier(wlTier === t ? '' : t)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${wlTier === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" size="lg" disabled={wlLoading} className="w-full shadow-glow">
                  {wlLoading ? 'Joining...' : 'Join the Waitlist'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">No spam. We'll only email you when AutoPayKe launches in your area.</p>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-display text-foreground text-lg">
                  <span className="uppercase font-bold">AUTOPAY</span><span className="lowercase font-light text-primary">ke</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                The operating system for car wash businesses in Kenya. Payments, analytics, and loyalty — unified.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Platform</p>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <a href="#tiers" className="block hover:text-foreground transition-colors">Service Tiers</a>
                <a href="#operators" className="block hover:text-foreground transition-colors">For Operators</a>
                <a href="#drivers" className="block hover:text-foreground transition-colors">For Drivers</a>
                <Link to="/roadmap" className="block hover:text-foreground transition-colors">Roadmap</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Account</p>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <Link to="/login" className="block hover:text-foreground transition-colors">Sign In</Link>
                <Link to="/register" className="block hover:text-foreground transition-colors">Register</Link>
                <Link to="/register?role=owner" className="block hover:text-foreground transition-colors">List Your Wash</Link>
                <a href="#waitlist" className="block hover:text-foreground transition-colors">Join Waitlist</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 AutoPayKe · Built on Avalanche · Serving Kenya 🇰🇪</p>
            <p className="text-xs text-muted-foreground">No subscription. AutoPayKe earns only when you do.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
