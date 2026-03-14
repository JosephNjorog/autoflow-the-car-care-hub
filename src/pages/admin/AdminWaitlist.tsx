import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { api } from '@/lib/api';
import { Users, Car, Wrench, Code2, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  tier: string | null;
  metadata: { bizName?: string; bizLocation?: string } | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  car_owner: { label: 'Car Owner',      icon: <Car className="w-3.5 h-3.5" />,   color: 'bg-blue-500/15 text-blue-400' },
  owner:     { label: 'Business Owner', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-violet-500/15 text-violet-400' },
  detailer:  { label: 'Detailer',       icon: <Wrench className="w-3.5 h-3.5" />, color: 'bg-amber-500/15 text-amber-400' },
  driver:    { label: 'Driver',         icon: <Car className="w-3.5 h-3.5" />,   color: 'bg-blue-500/15 text-blue-400' },
  developer: { label: 'Developer',      icon: <Code2 className="w-3.5 h-3.5" />, color: 'bg-emerald-500/15 text-emerald-400' },
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  economy:    { label: 'Economy',     color: 'bg-sky-500/15 text-sky-600' },
  first_class: { label: 'First Class', color: 'bg-violet-500/15 text-violet-600' },
  premium:    { label: 'Premium',     color: 'bg-amber-500/15 text-amber-600' },
};

const ROLE_FILTERS = ['all', 'car_owner', 'owner', 'detailer', 'developer'];
const TIER_FILTERS = ['all', 'economy', 'first_class', 'premium', 'none'];

export default function AdminWaitlist() {
  const [roleFilter, setRoleFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: entries = [], isLoading } = useQuery<WaitlistEntry[]>({
    queryKey: ['waitlist'],
    queryFn: () => api.get('/auth/waitlist'),
  });

  const filtered = entries.filter(e => {
    if (roleFilter !== 'all' && e.role !== roleFilter) return false;
    if (tierFilter === 'none' && e.tier) return false;
    if (tierFilter !== 'all' && tierFilter !== 'none' && e.tier !== tierFilter) return false;
    if (search && !e.email.toLowerCase().includes(search.toLowerCase()) && !(e.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const roleCount = (role: string) => entries.filter(e => e.role === role).length;
  const tierCount = (tier: string) => entries.filter(e => e.tier === tier).length;

  const downloadCsv = () => {
    const header = 'Email,Name,Phone,Role,Tier,Joined';
    const rows = filtered.map(e =>
      `${e.email},${e.name || ''},${e.phone || ''},${e.role},${e.tier || ''},${new Date(e.created_at).toLocaleDateString()}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'autopayke-waitlist.csv'; a.click();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Waitlist"
        subtitle={`${entries.length} people waiting for AutoPayKe`}
        action={
          <Button size="sm" variant="outline" onClick={downloadCsv} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card lg:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <p className="font-display text-2xl text-foreground">{entries.length}</p>
        </div>
        {['driver', 'owner', 'detailer', 'developer'].map(role => {
          const r = ROLE_LABELS[role];
          return (
            <div key={role} className="p-4 rounded-xl bg-card border border-border shadow-card">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${r.color}`}>
                {r.icon}{r.label}
              </div>
              <p className="font-display text-2xl text-foreground">{roleCount(role)}</p>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {['economy', 'first_class', 'premium'].map(tier => {
          const t = TIER_LABELS[tier];
          return (
            <div key={tier} className="p-4 rounded-xl bg-card border border-border shadow-card flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${t.color}`}>{t.label}</span>
              <p className="font-display text-xl text-foreground">{tierCount(tier)} <span className="text-sm font-normal text-muted-foreground">signups</span></p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-2 flex-wrap">
          {ROLE_FILTERS.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${roleFilter === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
            >
              {r === 'all' ? 'All Roles' : ROLE_LABELS[r]?.label || r}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {TIER_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${tierFilter === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
            >
              {t === 'all' ? 'All Tiers' : t === 'none' ? 'No Tier' : TIER_LABELS[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading waitlist...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No entries match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => {
                  const roleInfo = ROLE_LABELS[entry.role];
                  const tierInfo = entry.tier ? TIER_LABELS[entry.tier] : null;
                  return (
                    <tr key={entry.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-3 text-foreground font-medium">{entry.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p>{entry.name || '—'}</p>
                        {entry.metadata?.bizName && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{entry.metadata.bizName}{entry.metadata.bizLocation ? ` · ${entry.metadata.bizLocation}` : ''}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {roleInfo ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.icon}{roleInfo.label}
                          </span>
                        ) : <span className="text-muted-foreground">{entry.role}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {tierInfo ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tierInfo.color}`}>
                            {tierInfo.label}
                          </span>
                        ) : <span className="text-muted-foreground/50 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(entry.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-right">Showing {filtered.length} of {entries.length} entries</p>
    </DashboardLayout>
  );
}
