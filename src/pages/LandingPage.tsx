import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Star, Shield, Smartphone, Zap, Users, ArrowRight, CheckCircle, Wallet, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  { icon: <Smartphone className="w-6 h-6" />, title: 'Book in 2 Taps', desc: 'Quick mobile-first booking experience built for Kenya.' },
  { icon: <Zap className="w-6 h-6" />, title: 'M-Pesa Payments', desc: 'Pay via STK Push with Paybill or Till number.' },
  { icon: <Star className="w-6 h-6" />, title: 'Loyalty Rewards', desc: 'Earn points on every wash. Redeem for discounts.' },
  { icon: <Shield className="w-6 h-6" />, title: 'Before & After', desc: 'Photo documentation of every service.' },
  { icon: <Users className="w-6 h-6" />, title: 'Staff Management', desc: 'Schedule detailers and track performance.' },
  { icon: <Wallet className="w-6 h-6" />, title: 'Crypto Wallet', desc: 'Connect your wallet for stablecoin payments on Avalanche.' },
];

const steps = [
  { num: '01', title: 'Choose a Service', desc: 'Browse our range of professional car wash and detailing services.' },
  { num: '02', title: 'Pick a Time', desc: 'Select your preferred date, time, and location for the service.' },
  { num: '03', title: 'Pay & Relax', desc: 'Pay via M-Pesa or crypto, then sit back while we handle the rest.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <Link to="/" className="flex items-center gap-2">
            <Droplets className="w-7 h-7 text-primary" />
            <span className="font-display text-xl text-foreground">AutoFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <Link to="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link>
            <a href="#cta" className="hover:text-foreground transition-colors">Get Started</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
            <Button size="sm" onClick={() => navigate('/register')}>
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-bg.webp"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background dark:from-background/90 dark:via-background/80 dark:to-background" />
          {/* Accent glow */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 30% 50%, hsl(36 80% 55% / 0.2), transparent 60%), radial-gradient(ellipse at 70% 30%, hsl(152 35% 25% / 0.15), transparent 50%)',
            }}
            animate={{ opacity: [0.25, 0.35, 0.25] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Diagonal shine sweep */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, hsl(36 80% 55% / 0.08) 45%, transparent 50%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 6, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-24 md:pt-32 md:pb-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Premium Car Wash · Kenya & Beyond
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-foreground leading-tight mb-6">
              Car care that{' '}
              <em className="text-gradient not-italic">actually</em>
              {' '}shines.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
              Book, pay, and track your car wash — all from your phone. M-Pesa, crypto, and loyalty rewards built in.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/register')} className="px-8">
                <Droplets className="w-4 h-4 mr-2" /> Book a Wash
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/register?role=owner')}>
                List Your Business
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {[
              { value: '2K+', label: 'Cars Washed' },
              { value: '98%', label: 'Satisfaction' },
              { value: '4.9/5', label: 'Rating' },
              { value: '50+', label: 'Detailers' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-card border border-border shadow-card">
                <p className="text-2xl font-display text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display text-foreground mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-md mx-auto">A complete platform for car wash businesses and customers.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground">
              Your car, <em className="not-italic text-gradient">spotless</em> in 3 steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <span className="font-display text-5xl text-primary/20">{s.num}</span>
                <h3 className="font-display text-xl text-foreground mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="gradient-primary rounded-2xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-display text-primary-foreground mb-4">
              Ready to transform your car wash experience?
            </h2>
            <p className="text-primary-foreground/70 max-w-md mx-auto mb-8">
              Join thousands of happy customers and car wash businesses across Kenya.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" variant="secondary" onClick={() => navigate('/register')} className="px-8">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate('/register?role=owner')} className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10">
                I'm a Business Owner
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            <span className="font-display text-foreground">AutoFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 AutoFlow. Built on Avalanche.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
            <Link to="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
