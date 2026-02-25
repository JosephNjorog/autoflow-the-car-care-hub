import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Car, Star, CreditCard, Users, Settings, LogOut,
  Menu, X, Bell, ChevronDown, Briefcase, Clock, DollarSign, MapPin,
  BarChart3, Shield, CheckCircle, FileText, Wallet, Droplets
} from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const navItems: Record<UserRole, NavItem[]> = {
  customer: [
    { label: 'Dashboard', path: '/customer', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Book Service', path: '/customer/book', icon: <Droplets className="w-5 h-5" /> },
    { label: 'My Bookings', path: '/customer/bookings', icon: <Calendar className="w-5 h-5" /> },
    { label: 'My Vehicles', path: '/customer/vehicles', icon: <Car className="w-5 h-5" /> },
    { label: 'Loyalty', path: '/customer/loyalty', icon: <Star className="w-5 h-5" /> },
    { label: 'Payments', path: '/customer/payments', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Wallet', path: '/customer/wallet', icon: <Wallet className="w-5 h-5" /> },
  ],
  detailer: [
    { label: 'Dashboard', path: '/detailer', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Jobs', path: '/detailer/jobs', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Schedule', path: '/detailer/schedule', icon: <Clock className="w-5 h-5" /> },
    { label: 'Earnings', path: '/detailer/earnings', icon: <DollarSign className="w-5 h-5" /> },
  ],
  owner: [
    { label: 'Dashboard', path: '/owner', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Bookings', path: '/owner/bookings', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Services', path: '/owner/services', icon: <Droplets className="w-5 h-5" /> },
    { label: 'Staff', path: '/owner/staff', icon: <Users className="w-5 h-5" /> },
    { label: 'Locations', path: '/owner/locations', icon: <MapPin className="w-5 h-5" /> },
    { label: 'Analytics', path: '/owner/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Payments', path: '/owner/payments', icon: <CreditCard className="w-5 h-5" /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Services', path: '/admin/services', icon: <Droplets className="w-5 h-5" /> },
    { label: 'Transactions', path: '/admin/transactions', icon: <FileText className="w-5 h-5" /> },
    { label: 'Approvals', path: '/admin/approvals', icon: <CheckCircle className="w-5 h-5" /> },
  ],
};

const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  detailer: 'Detailer',
  owner: 'Business Owner',
  admin: 'Super Admin',
};

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  userName?: string;
}

export default function DashboardLayout({ children, role, userName = 'User' }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const items = navItems[role];
  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <Droplets className="w-7 h-7 text-sidebar-primary" />
              <span className="font-display text-xl text-sidebar-foreground">AutoFlow</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-5 py-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground">
              {roleLabels[role]}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-sidebar-border space-y-1">
            <Link to={`/${role}/settings`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button onClick={() => navigate('/login')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-16 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground/60 hover:text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-display text-lg md:text-xl text-foreground truncate">
              {items.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-foreground/60" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-card-hover overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-border">
                      <h3 className="font-display text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {mockNotifications.slice(0, 5).map((n) => (
                        <div key={n.id} className={`p-3 border-b border-border last:border-0 ${!n.isRead ? 'bg-muted/50' : ''}`}>
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {userName.charAt(0)}
              </div>
              <span className="hidden md:block text-sm font-medium text-foreground">{userName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
