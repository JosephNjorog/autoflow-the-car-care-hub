import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets, Star, Shield, Smartphone, Zap, Users, ArrowRight, CheckCircle,
  Wallet, MapPin, Clock, Camera, Award, TrendingUp, Car, Wrench, CreditCard,
  BarChart2, ChevronRight, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

// ─── Data ──────────────────────────────────────────────────────────────────────

const features = [
  { icon: <Smartphone className="w-5 h-5" />, title: 'Book in 2 Taps', desc: 'Mobile-first booking built for Kenya. Select your service, time, and location in under a minute.' },
  { icon: <Zap className="w-5 h-5" />, title: 'M-Pesa STK Push', desc: 'One tap sends a payment prompt to your Safaricom number. No card, no hassle.' },
  { icon: <Wallet className="w-5 h-5" />, title: 'Crypto Payments', desc: 'Pay with USDT or USDC on Avalanche C-Chain. Core Wallet and MetaMask supported.' },
  { icon: <Camera className="w-5 h-5" />, title: 'Before & After Photos', desc: 'Every job is documented with photos so you know exactly what was done.' },
  { icon: <Award className="w-5 h-5" />, title: 'Loyalty Rewards', desc: 'Earn points every wash. Reach Silver, Gold, or Platinum for bigger discounts.' },
  { icon: <BarChart2 className="w-5 h-5" />, title: 'Owner Dashboard', desc: 'Real-time earnings, staff scheduling, and customer analytics — all in one place.' },
];

const steps = [
  {
    num: '01',
    icon: <Car className="w-8 h-8" />,
    title: 'Choose a Location',
    desc: 'Browse verified car wash centres near you. View services, prices, and ratings before booking.',
    color: 'from-blue-500/20 to-cyan-500/10',
    accent: 'text-blue-500',
  },
  {
    num: '02',
    icon: <Clock className="w-8 h-8" />,
    title: 'Pick Your Time',
    desc: 'Schedule at your convenience. Drop-off or detailer-comes-to-you options available.',
    color: 'from-cyan-500/20 to-teal-500/10',
    accent: 'text-cyan-500',
  },
  {
    num: '03',
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Pay & Track',
    desc: 'Pay via M-Pesa, USDT, or USDC. Get real-time updates and photo proof when your car is ready.',
    color: 'from-primary/20 to-accent/10',
    accent: 'text-primary',
  },
];

const testimonials = [
  {
    name: 'Amina Wanjiku',
    role: 'Customer, Nairobi',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    quote: 'I booked a full detail from my phone in under 2 minutes. The before-and-after photos were a nice touch — I knew exactly what I was paying for.',
    stars: 5,
  },
  {
    name: 'Brian Ochieng',
    role: 'Car Wash Owner, Westlands',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote: 'AutoPayKe handles my scheduling, payments, and staff tracking. My revenue is up 40% since I joined. The M-Pesa payouts are instant.',
    stars: 5,
  },
  {
    name: 'Grace Njeri',
    role: 'Customer, Kilimani',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    quote: 'Paying with crypto felt like the future. Core Wallet connected in one tap, and the USDC payment cleared in seconds on the Avalanche network.',
    stars: 5,
  },
  {
    name: 'David Kamau',
    role: 'Detailer, CBD',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    quote: 'I get jobs assigned directly to my phone, upload photos, and my commission hits my M-Pesa automatically. No chasing after payment anymore.',
    stars: 5,
  },
];


const payments = [
  { label: 'M-Pesa', color: 'bg-green-500', text: 'text-white', short: 'M' },
  { label: 'USDT', color: 'bg-emerald-500', text: 'text-white', short: '₮' },
  { label: 'USDC', color: 'bg-blue-500', text: 'text-white', short: '$' },
  { label: 'Cash', color: 'bg-amber-500', text: 'text-white', short: '₦' },
];

const trustItems = [
  'M-Pesa Payments', 'Avalanche Blockchain', 'USDT & USDC', 'Core Wallet',
  'MetaMask', 'Loyalty Points', 'Photo Proof', 'Instant Payouts',
  'M-Pesa Payments', 'Avalanche Blockchain', 'USDT & USDC', 'Core Wallet',
];

const ownerPerks = [
  { icon: <TrendingUp className="w-4 h-4" />, text: 'Real-time earnings dashboard' },
  { icon: <Users className="w-4 h-4" />, text: 'Manage detailers and shift schedules' },
  { icon: <Zap className="w-4 h-4" />, text: 'Automatic M-Pesa payouts (90% share)' },
  { icon: <BarChart2 className="w-4 h-4" />, text: 'Customer analytics and retention tools' },
  { icon: <Shield className="w-4 h-4" />, text: 'Verified business badge after KYC' },
  { icon: <Camera className="w-4 h-4" />, text: 'Photo documentation for every job' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass border-b border-border/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl text-foreground">AutoPayKe</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
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
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <img src="/images/hero-bg.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background" />
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, hsl(207 85% 40% / 0.18), transparent 60%), radial-gradient(ellipse at 75% 25%, hsl(191 92% 48% / 0.15), transparent 50%)' }}
            animate={{ opacity: [0.3, 0.45, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-foreground leading-tight mb-5">
                Car care that{' '}
                <em className="text-gradient not-italic">actually</em>
                {' '}shines.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Book professional car wash and detailing services across Kenya. Pay via M-Pesa, USDT, or USDC — and track every job in real time.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Button size="lg" onClick={() => navigate('/register')} className="px-8 shadow-glow ice-shimmer">
                  <Droplets className="w-4 h-4 mr-2" /> Book a Wash
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/register?role=owner')} className="border-border/60">
                  List Your Business <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Social proof row */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/60 w-fit">
                <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">Launching in Nairobi · <span className="text-foreground font-medium">Be among the first</span></p>
              </div>
            </motion.div>

            {/* Right — floating card mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:flex flex-col gap-4 items-end"
            >
              {/* Booking card */}
              <div className="frost rounded-2xl p-5 w-80 shadow-ice">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Premium Detail</p>
                      <p className="text-xs text-muted-foreground">Westlands Centre</p>
                    </div>
                  </div>
                  <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Active
                  </span>
                </div>
                <div className="h-px bg-border/50 mb-4" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-background/60 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Service</p>
                    <p className="text-sm font-semibold text-foreground">Full Wash</p>
                  </div>
                  <div className="bg-background/60 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                    <p className="text-sm font-semibold text-foreground">KES 1,575</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  <p className="text-xs text-success font-medium">M-Pesa payment confirmed</p>
                </div>
              </div>

              {/* Payment chip */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="frost rounded-xl px-4 py-3 flex items-center gap-3 shadow-ice w-64"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">₮</div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid with USDT</p>
                  <p className="text-sm font-semibold text-foreground">$12.40 · Avalanche</p>
                </div>
                <BadgeCheck className="w-5 h-5 text-success ml-auto" />
              </motion.div>

              {/* Rating chip */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="frost rounded-xl px-4 py-3 flex items-center gap-3 shadow-ice w-56"
              >
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs text-muted-foreground">"Spotless. Loved it!"</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust Marquee ─────────────────────────────────────────────────────── */}
      <div className="border-y border-border/50 bg-card/50 py-4 overflow-hidden">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {item}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-2">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground mb-4">Everything you need, nothing you don't</h2>
            <p className="text-muted-foreground max-w-md mx-auto">A complete platform for car wash businesses and their customers, built for the Kenyan market.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-2">How it works</p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground mb-4">
              Your car, <em className="not-italic text-gradient">spotless</em> in 3 steps
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">From booking to payment to photo proof — the whole process fits in your pocket.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px border-t-2 border-dashed border-border z-0 -translate-x-6" style={{ width: '40%' }} />
                )}
                <div className={`rounded-2xl bg-gradient-to-br ${s.color} border border-border p-7 text-center h-full`}>
                  <div className={`w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-5 ${s.accent} shadow-card`}>
                    {s.icon}
                  </div>
                  <span className="font-display text-4xl text-foreground/10 block mb-1">{s.num}</span>
                  <h3 className="font-display text-xl text-foreground mb-3">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payments Section ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-card/50 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <p className="text-sm text-muted-foreground mb-6">Accepted payment methods</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {payments.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-border bg-card shadow-card hover:shadow-card-hover transition-all"
              >
                <div className={`w-7 h-7 rounded-full ${p.color} ${p.text} flex items-center justify-center text-sm font-bold`}>
                  {p.short}
                </div>
                <span className="text-sm font-medium text-foreground">{p.label}</span>
              </motion.div>
            ))}
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-border bg-card shadow-card">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Secure & encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-2">Real People, Real Results</p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground mb-4">What our community says</h2>
            <p className="text-muted-foreground max-w-md mx-auto">From customers to car wash owners to detailers — here's how AutoPayKe is changing how Kenya cares for its cars.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="frost rounded-2xl p-6 shadow-ice flex flex-col"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-border"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Business Owners ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
                <img
                  src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=700&auto=format&fit=crop"
                  alt="Car wash team at work"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
              {/* Earnings card overlay */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -right-4 frost rounded-xl p-4 shadow-ice border border-border w-52"
              >
                <p className="text-xs text-muted-foreground mb-1">This month's earnings</p>
                <p className="text-2xl font-display text-foreground">KES 84,200</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                  <p className="text-xs text-success font-medium">+23% vs last month</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — copy */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs text-primary uppercase tracking-widest font-medium mb-3">For Business Owners</p>
              <h2 className="text-3xl md:text-4xl font-display text-foreground mb-4">
                Run your car wash smarter
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                AutoFlow gives car wash owners a complete operations platform — from managing bookings and staff to collecting payments and growing your customer base.
              </p>
              <ul className="space-y-3 mb-8">
                {ownerPerks.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {p.icon}
                    </div>
                    {p.text}
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={() => navigate('/register?role=owner')} className="shadow-glow">
                List Your Business Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── For Detailers strip ───────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="gradient-primary rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">For Detailers</p>
                <h3 className="font-display text-2xl text-white">Get paid for every wash</h3>
                <p className="text-white/70 text-sm mt-1">Accept jobs, upload before/after photos, earn 40% commission — paid automatically to your M-Pesa.</p>
              </div>
            </div>
            <Button size="lg" variant="secondary" onClick={() => navigate('/register')} className="shrink-0">
              Join as a Detailer <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section id="cta" className="py-20 md:py-28 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="frost rounded-3xl p-10 md:p-16 shadow-ice">
            {/* Avatar stack */}
            <div className="flex justify-center -space-x-3 mb-6">
              {[22, 32, 44, 55, 68, 75].map((n) => (
                <img
                  key={n}
                  src={`https://randomuser.me/api/portraits/${n % 2 === 0 ? 'women' : 'men'}/${n}.jpg`}
                  alt=""
                  className="w-11 h-11 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-display text-foreground mb-4">
              Ready for a car that <em className="not-italic text-gradient">shines?</em>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              The smarter way to book, pay for, and manage car care in Kenya.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/register')} className="px-10 shadow-glow ice-shimmer">
                Book Your First Wash <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/register?role=owner')}>
                I Own a Car Wash
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-5">No subscription. No setup fees. AutoFlow earns only when you do.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Droplets className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-foreground">AutoFlow</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              © 2026 AutoFlow · Built on Avalanche · Serving Kenya 🇰🇪
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
              <Link to="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
