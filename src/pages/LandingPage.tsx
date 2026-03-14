import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Star, Shield, Zap, ArrowRight, CheckCircle,
  MapPin, Award, TrendingUp, Car, CreditCard, Wallet, Smartphone,
  Bot, Activity, Users, ChevronRight, BadgeCheck, Cpu,
  Building2, Wrench, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ─── Images ─────────────────────────────────────────────────────────────────
const IMG = {
  hero:       'https://autopayke.lovable.app/assets/hero-car-DMSUyPsx.jpeg',
  economy:    'https://autopayke.lovable.app/assets/tier-economy-CYy0Teks.jpeg',
  firstClass: 'https://autopayke.lovable.app/assets/tier-firstclass-BtC3u5ET.jpeg',
  premium:    'https://autopayke.lovable.app/assets/tier-premium-D6jxk9Yj.jpeg',
  nearbyMap:  'https://autopayke.lovable.app/assets/nearby-wash-map-XMf7XkSX.jpeg',
};

// ─── Data ────────────────────────────────────────────────────────────────────

const marqueeItems = [
  'Service Discovery', 'M-Pesa Payments', 'Proof-of-Service', 'Loyalty Rewards',
  'Revenue Analytics', 'Automated Payouts', 'USDT & USDC', 'Verified Detailers',
  'Service Discovery', 'M-Pesa Payments', 'Proof-of-Service', 'Loyalty Rewards',
  'Revenue Analytics', 'Automated Payouts', 'USDT & USDC', 'Verified Detailers',
];

const tiers = [
  {
    name: 'Economy',
    price: 'KSh 300 – 1,000',
    image: IMG.economy,
    services: ['Exterior rinse', 'Tire rinse', 'Basic interior wipe', 'Window clean'],
  },
  {
    name: 'First Class',
    price: 'KSh 1,000 – 2,000',
    image: IMG.firstClass,
    services: ['Full exterior wash', 'Engine wash', 'Interior detailing', 'Tyre dressing'],
  },
  {
    name: 'Premium',
    price: 'KSh 1,500 – 4,000',
    image: IMG.premium,
    services: ['Full detailing', 'Sumpguard wash', 'Paint protection', 'Leather treatment'],
  },
];

const operatorFeatures = [
  { icon: <MapPin className="w-5 h-5" />, title: 'Add your location', desc: 'Add your location, services, pricing, and operating hours.' },
  { icon: <CreditCard className="w-5 h-5" />, title: 'Automated Payment', desc: 'Accept M-Pesa, cards, and stablecoin payments — all verified and settled instantly.' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Revenue Analytics', desc: 'Track peak hours, revenue trends, and customer retention.' },
  { icon: <Award className="w-5 h-5" />, title: 'Loyalty Tools', desc: 'Digital stamps, tier rewards, and automated win-back campaigns to keep customers returning.' },
];

const carOwnerFeatures = [
  { icon: <MapPin className="w-5 h-5" />, title: 'Service Discovery', desc: 'Discover verified car washes near you with real-time availability and pricing.' },
  { icon: <Car className="w-5 h-5" />, title: 'Book a Service', desc: 'Select your wash tier, confirm the booking, and get notified when it\'s done.' },
  { icon: <CheckCircle className="w-5 h-5" />, title: 'Track Your Washes', desc: 'Every wash is recorded with proof-of-service. View your full history anytime.' },
  { icon: <Star className="w-5 h-5" />, title: 'Earn Rewards', desc: 'Customers earn points and tier rewards with every verified wash — no stamps needed.' },
];

// ─── Animation ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: d, ease: [0.16, 1, 0.3, 1] as const } }),
};

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

// ─── Waitlist roles ───────────────────────────────────────────────────────────
const WL_ROLES = [
  { id: 'car_owner',   label: 'Car Owner',       icon: <Car className="w-5 h-5" />,       desc: 'I want my car washed' },
  { id: 'owner',       label: 'Business Owner',   icon: <Building2 className="w-5 h-5" />, desc: 'I run a car wash' },
  { id: 'detailer',    label: 'Detailer',         icon: <Wrench className="w-5 h-5" />,    desc: 'I want to find jobs' },
] as const;

const WL_TIERS = ['Economy', 'First Class', 'Premium'] as const;

// ─── Multi-step Waitlist ──────────────────────────────────────────────────────
function WaitlistForm() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);      // 0 = role, 1 = details, 2 = done
  const [direction, setDirection] = useState(1);

  const [role, setRole] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState('');
  // Business-owner specific
  const [bizName, setBizName] = useState('');
  const [bizLocation, setBizLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/waitlist', {
        name: name || null,
        email,
        phone: phone || null,
        role,
        tier: tier ? tier.toLowerCase().replace(' ', '_') : null,
        metadata: role === 'owner' ? { bizName, bizLocation } : undefined,
      });
      setDirection(1);
      setStep(2);
    } catch {
      toast({ title: 'Already registered', description: 'This email is already on the waitlist.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const transition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Progress bar */}
      {step < 2 && (
        <div className="h-0.5 bg-border">
          <motion.div
            className="h-full bg-foreground"
            animate={{ width: step === 0 ? '50%' : '100%' }}
            transition={transition}
          />
        </div>
      )}

      <div className="p-6 md:p-8 min-h-[340px] flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── Step 0: Role selection ── */}
          {step === 0 && (
            <motion.div
              key="step-role"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-col flex-1"
            >
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Step 1 of 2</p>
              <h3 className="text-xl font-bold text-foreground mb-6">I want to join as a…</h3>
              <div className="space-y-3 flex-1">
                {WL_ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                      role === r.id
                        ? 'border-foreground bg-foreground/5'
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      role === r.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                    }`}>
                      {r.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{r.label}</p>
                      <p className="text-sm text-muted-foreground">{r.desc}</p>
                    </div>
                    {role === r.id && (
                      <CheckCircle className="w-4 h-4 text-foreground ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <Button
                className="w-full mt-6 h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold"
                disabled={!role}
                onClick={() => go(1)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 1: Details (varies by role) ── */}
          {step === 1 && (
            <motion.div
              key="step-details"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-col flex-1"
            >
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => go(0)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Step 2 of 2</p>
              </div>

              {role === 'car_owner' && (
                <h3 className="text-xl font-bold text-foreground mb-6">Tell us about yourself</h3>
              )}
              {role === 'owner' && (
                <h3 className="text-xl font-bold text-foreground mb-6">About your car wash</h3>
              )}
              {role === 'detailer' && (
                <h3 className="text-xl font-bold text-foreground mb-6">Your details</h3>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      type="tel"
                      placeholder="+254..."
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Email <span className="text-foreground/40">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                </div>

                {/* Car owner: tier preference */}
                {role === 'car_owner' && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Preferred wash tier <span className="normal-case text-muted-foreground/40">(optional)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {WL_TIERS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTier(tier === t ? '' : t)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                            tier === t
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business owner: extra fields */}
                {role === 'owner' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Business name</label>
                      <input
                        type="text"
                        placeholder="e.g. Westlands Premium Car Wash"
                        value={bizName}
                        onChange={e => setBizName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Westlands, Nairobi"
                        value={bizLocation}
                        onChange={e => setBizLocation(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tiers you offer</label>
                      <div className="grid grid-cols-3 gap-2">
                        {WL_TIERS.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTier(tier === t ? '' : t)}
                            className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                              tier === t
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-auto pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl text-base"
                  >
                    {loading ? 'Joining...' : 'Join the Waitlist'} {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    No spam. We'll only reach out when we launch in your area.
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── Step 2: Done ── */}
          {step === 2 && (
            <motion.div
              key="step-done"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-col items-center justify-center flex-1 text-center py-8"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full border border-success/30 bg-success/10 flex items-center justify-center mb-5"
              >
                <CheckCircle className="w-8 h-8 text-success" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">You're on the list.</h3>
              {role === 'owner' && (
                <p className="text-muted-foreground text-sm max-w-xs">
                  We'll be in touch to help you list <strong className="text-foreground">{bizName || 'your car wash'}</strong> on AutoPayKe.
                </p>
              )}
              {role === 'car_owner' && (
                <p className="text-muted-foreground text-sm max-w-xs">
                  We'll notify you the moment{tier ? ` ${tier}` : ''} services are available near you.
                </p>
              )}
              {role === 'detailer' && (
                <p className="text-muted-foreground text-sm max-w-xs">
                  We'll reach out when we're ready to onboard detailers in your area.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 md:px-8 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Droplets className="w-4 h-4 text-background" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">AutoPayKe</span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#tiers" className="hover:text-foreground transition-colors duration-200">Tiers</a>
            <a href="#operators" className="hover:text-foreground transition-colors duration-200">For Operators</a>
            <a href="#car-owners" className="hover:text-foreground transition-colors duration-200">For Car Owners</a>
            <Link to="/roadmap" className="hover:text-foreground transition-colors duration-200">Roadmap</Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/login')}
            >
              Sign in
            </Button>
            <Button
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 font-medium"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-end pb-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMG.hero}
            alt="AutoPayKe mobile app interface showing car wash booking with vehicle"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 md:px-8 w-full pt-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="max-w-4xl"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-pulse" />
                The Operating System for Car Wash Businesses
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={0.1}
              className="text-[clamp(3.5rem,10vw,8rem)] font-bold leading-[1.0] tracking-[-0.03em] text-foreground mb-6"
            >
              Book. Wash.<br />Track. Earn.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={0.2}
              className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-10"
            >
              AutoPayKe connects car owners to verified car washes nearby while giving operators the tools to verify services, automate payments, and reward loyalty.
            </motion.p>

            <motion.div variants={fadeUp} custom={0.3} className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-7 text-base h-12 rounded-xl"
                onClick={() => navigate('/register')}
              >
                Find a Wash Nearby <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-accent font-medium px-7 text-base h-12 rounded-xl"
                onClick={scrollToWaitlist}
              >
                Register Car Wash <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────────── */}
      <div className="border-y border-border py-4 overflow-hidden bg-card">
        <motion.div
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {marqueeItems.map((item, i) => (
            <span key={i} className="text-sm text-muted-foreground shrink-0 flex items-center gap-2.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Problem ─────────────────────────────────────────────────────────── */}
      <section className="py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-5">
              The Problem
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-foreground mb-5"
            >
              A massive market,<br />
              <span className="text-muted-foreground font-light">completely underserved.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base text-muted-foreground max-w-lg leading-relaxed mb-14">
              Kenya's car wash industry is growing fast — but the infrastructure hasn't kept up. No digital payments, no service records, no loyalty programs.
            </motion.p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { stat: '10M+', label: 'Registered vehicles in Kenya' },
                { stat: '40K+', label: 'Car wash businesses nationwide' },
                { stat: '95%',  label: 'Still cash-only operations' },
                { stat: '0',    label: 'With digital loyalty programs' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="p-6 rounded-2xl border border-border bg-card"
                >
                  <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-2">{s.stat}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Tiers ───────────────────────────────────────────────────────────── */}
      <section id="tiers" className="py-28 md:py-36 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="mb-14"
          >
            <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">
              Service Tiers
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-[-0.03em] text-foreground mb-4"
            >
              Choose the Right<br />Car Wash Experience
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base text-muted-foreground max-w-lg leading-relaxed">
              From a quick exterior rinse to full detailing — every tier is verified, tracked, and rewarded through AutoPayKe.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group relative rounded-2xl overflow-hidden border border-border bg-card"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={tier.image}
                    alt={tier.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">{tier.price}</p>
                  </div>
                  <ul className="space-y-2.5">
                    {tier.services.map((s, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
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

      {/* ── For Operators ───────────────────────────────────────────────────── */}
      <section id="operators" className="py-28 md:py-36 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-5">
                For Operators
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-5"
              >
                The complete car wash operating system.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed mb-12 max-w-md">
                AutoPayKe gives operators the tools to verify services, automate payments, track revenue, and reward loyalty — all from one dashboard.
              </motion.p>
              <div className="space-y-0 border-t border-border">
                {operatorFeatures.map((f, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i * 0.08} className="flex gap-5 py-6 border-b border-border">
                    <div className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeUp} className="mt-8">
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl h-12"
                  onClick={scrollToWaitlist}
                >
                  Register Your Wash <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="sticky top-24"
            >
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <div className="ml-3 flex-1 bg-muted rounded-md h-5" />
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Today's Revenue", value: 'KES 18,400', delta: '+12%' },
                      { label: 'Bookings',         value: '24',         delta: '+4' },
                      { label: 'Active Staff',      value: '6 / 8',      delta: '' },
                      { label: 'Loyalty Pts',       value: '1,240',      delta: '+320' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-background border border-border">
                        <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xl font-bold text-foreground">{stat.value}</p>
                          {stat.delta && <p className="text-xs text-muted-foreground">{stat.delta}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-background border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Bookings</p>
                    </div>
                    {[
                      { name: 'James M.',  service: 'Premium Detail', amount: 'KES 3,200', done: true },
                      { name: 'Aisha K.', service: 'First Class',    amount: 'KES 1,500', done: false },
                      { name: 'Brian O.', service: 'Economy',         amount: 'KES 600',   done: null },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.service}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{b.amount}</p>
                          <p className={`text-[10px] font-medium ${b.done === true ? 'text-success' : 'text-muted-foreground/60'}`}>
                            {b.done === true ? 'completed' : b.done === false ? 'in progress' : 'pending'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-foreground text-background">
                    <div>
                      <p className="text-xs text-background/60 mb-1">This Month</p>
                      <p className="text-2xl font-bold">KES 84,200</p>
                    </div>
                    <div className="flex items-center gap-1 text-background/70 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      +23%
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── For Car Owners ──────────────────────────────────────────────────── */}
      <section id="car-owners" className="py-28 md:py-36 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="sticky top-24 order-2 lg:order-1"
            >
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="relative h-52 overflow-hidden">
                  <img src={IMG.nearbyMap} alt="Nearby car washes map" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Nearby Washes</p>
                  {[
                    { name: 'Premium Shine Wash',  dist: '1.2 km', rating: '4.8', tier: 'Premium',     price: 'KES 3,200' },
                    { name: 'Quick Rinse Wash',    dist: '0.4 km', rating: '4.6', tier: 'Economy',     price: 'KES 500' },
                    { name: 'City Express Wash',   dist: '2.1 km', rating: '4.9', tier: 'First Class', price: 'KES 1,200' },
                  ].map((w, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{w.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{w.dist}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <Star className="w-3 h-3 fill-foreground/50 text-foreground/50" />
                          <span className="text-xs text-muted-foreground">{w.rating}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-xs text-muted-foreground">{w.tier}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{w.price}</p>
                    </div>
                  ))}
                  <motion.div
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-success/30 bg-success/10"
                  >
                    <Smartphone className="w-4 h-4 text-success shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-success">M-Pesa STK Push Sent</p>
                      <p className="text-[10px] text-muted-foreground">Enter PIN to confirm KES 1,200</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="order-1 lg:order-2"
            >
              <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-5">
                For Car Owners
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-5"
              >
                Find a wash nearby and get it done in minutes.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed mb-12 max-w-md">
                Find nearby car washes, book a service, track every wash, and earn rewards — all from your phone.
              </motion.p>
              <div className="space-y-0 border-t border-border">
                {carOwnerFeatures.map((f, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i * 0.08} className="flex gap-5 py-6 border-b border-border">
                    <div className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeUp} className="mt-8">
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl h-12"
                  onClick={() => navigate('/register')}
                >
                  Find a Wash Nearby <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Proof-of-Service ────────────────────────────────────────────────── */}
      <section className="py-28 md:py-36 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-5">
                Proof-of-Service Infrastructure
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-5"
              >
                Every wash,<br />verified on record.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed mb-6 max-w-md">
                AutoPayKe introduces a Proof-of-Service protocol for real-world services — verifying every wash, automating every payment, and rewarding every customer.
              </motion.p>
              <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed mb-12 max-w-md">
                Every completed wash generates a tamper-proof digital record. Payments are released automatically upon verification — no disputes, no delays.
              </motion.p>
              <div className="space-y-4">
                {[
                  { icon: <Shield className="w-4 h-4" />,   title: 'Tamper-proof records',  desc: 'Each completed wash generates a digital proof-of-service record.' },
                  { icon: <Zap className="w-4 h-4" />,      title: 'Automated settlement',   desc: 'Payments are released automatically upon service verification.' },
                  { icon: <Activity className="w-4 h-4" />, title: 'Real-time tracking',     desc: 'Customers and operators track every step in real time.' },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i * 0.08} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-semibold text-foreground">Service Record</p>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-success/30 bg-success/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-[11px] font-medium text-success">Verified</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Service',  value: 'Premium Detail' },
                    { label: 'Location', value: 'Westlands Centre' },
                    { label: 'Amount',   value: 'KES 3,200' },
                    { label: 'Payment',  value: 'M-Pesa confirmed', success: true },
                    { label: 'Points',   value: '+320 pts earned' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-medium flex items-center gap-1 ${row.success ? 'text-success' : 'text-foreground'}`}>
                        {row.success && <BadgeCheck className="w-3.5 h-3.5" />}
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-[10px] font-mono text-muted-foreground/50 break-all">
                    proof: 0x4a2f...8c1e · Avalanche C-Chain · Block #28,491,044
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-4">Accepted Payments</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: <Smartphone className="w-4 h-4" />, label: 'M-Pesa', sub: 'Recommended' },
                    { icon: <Wallet className="w-4 h-4" />,     label: 'USDT',   sub: 'Avalanche C-Chain' },
                    { icon: <Wallet className="w-4 h-4" />,     label: 'USDC',   sub: 'Avalanche C-Chain' },
                    { icon: <CreditCard className="w-4 h-4" />, label: 'Cash',   sub: 'Pay on arrival' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">{p.icon}</div>
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

      {/* ── AI Agent ────────────────────────────────────────────────────────── */}
      <section className="py-28 md:py-36 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
                  <Bot className="w-5 h-5 text-background" />
                </div>
                <span className="text-sm font-semibold text-foreground">AutoPayKe Agent</span>
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-5"
              >
                AI-powered.<br />Always on.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed max-w-md">
                AutoPayKe includes an AI-powered assistant that helps car owners and operators discover services, track activity, and optimize operations in real time.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">AutoPayKe Agent</p>
                    <p className="text-[10px] text-muted-foreground">Always online</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { role: 'user',  text: 'Find me a Premium car wash near Westlands under KES 4,000' },
                    { role: 'agent', text: 'Found 3 verified Premium washes nearby. Top pick: Premium Shine Wash — 1.2 km away, KES 3,200, rated 4.8★ with 120+ verified services. Shall I book it?' },
                    { role: 'user',  text: 'Yes, book it with M-Pesa' },
                    { role: 'agent', text: 'Booking confirmed. M-Pesa STK Push sent to your number — enter your PIN to complete payment of KES 3,200.' },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.18, duration: 0.4 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-foreground text-background rounded-br-sm'
                          : 'bg-secondary text-foreground rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Waitlist ────────────────────────────────────────────────────────── */}
      <section id="waitlist" className="py-28 md:py-36 border-t border-border">
        <div className="max-w-xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Early Access</span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-4"
            >
              Join the waitlist.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed mb-10">
              The complete car wash operating system for Kenya. Be first in line when we launch in your area.
            </motion.p>

            <motion.div variants={fadeUp}>
              <WaitlistForm />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-background" />
                </div>
                <span className="text-base font-semibold text-foreground">AutoPayKe</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                The operating system for car wash businesses in Kenya. Payments, analytics, and loyalty — unified.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Platform</p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <a href="#tiers" className="block hover:text-foreground transition-colors">Service Tiers</a>
                <a href="#operators" className="block hover:text-foreground transition-colors">For Operators</a>
                <a href="#car-owners" className="block hover:text-foreground transition-colors">For Car Owners</a>
                <Link to="/roadmap" className="block hover:text-foreground transition-colors">Roadmap</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Account</p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link to="/login" className="block hover:text-foreground transition-colors">Sign In</Link>
                <Link to="/register" className="block hover:text-foreground transition-colors">Register</Link>
                <Link to="/register?role=owner" className="block hover:text-foreground transition-colors">List Your Wash</Link>
                <a href="#waitlist" className="block hover:text-foreground transition-colors">Join Waitlist</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 AutoPayKe. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Built on Avalanche · Serving Kenya 🇰🇪</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
