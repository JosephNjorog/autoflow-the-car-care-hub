import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { api } from '@/lib/api';
import { Users, Car, Wrench, Sparkles, Download, Send, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
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
  car_owner: { label: 'Car Owner',      icon: <Car className="w-3.5 h-3.5" />,    color: 'bg-blue-500/15 text-blue-400' },
  owner:     { label: 'Business Owner', icon: <Users className="w-3.5 h-3.5" />,  color: 'bg-violet-500/15 text-violet-400' },
  detailer:  { label: 'Detailer',       icon: <Wrench className="w-3.5 h-3.5" />, color: 'bg-amber-500/15 text-amber-400' },
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  economy:     { label: 'Economy',     color: 'bg-sky-500/15 text-sky-400' },
  first_class: { label: 'First Class', color: 'bg-violet-500/15 text-violet-400' },
  premium:     { label: 'Premium',     color: 'bg-amber-500/15 text-amber-400' },
};

const ROLE_FILTERS = ['all', 'car_owner', 'owner', 'detailer'];
const TIER_FILTERS = ['all', 'economy', 'first_class', 'premium', 'none'];

// Announce role options shown in the dialog
const ANNOUNCE_ROLES = [
  { id: 'car_owner', label: 'Car Owners',      desc: 'Guide: create profile, add vehicle, book a wash' },
  { id: 'owner',     label: 'Business Owners', desc: 'Guide: register car wash, add services, configure payments' },
  { id: 'detailer',  label: 'Detailers',       desc: 'Guide: complete profile, job assignment, M-Pesa payouts' },
];

export default function AdminWaitlist() {
  const [roleFilter, setRoleFilter]   = useState('all');
  const [tierFilter, setTierFilter]   = useState('all');
  const [search, setSearch]           = useState('');
  const [announceOpen, setAnnounceOpen]     = useState(false);
  const [announceRoles, setAnnounceRoles]   = useState<string[]>(['car_owner', 'owner', 'detailer']);
  const [announceResult, setAnnounceResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const { data: entries = [], isLoading } = useQuery<WaitlistEntry[]>({
    queryKey: ['waitlist'],
    queryFn: () => api.get('/auth/waitlist'),
  });

  const announce = useMutation({
    mutationFn: (roles: string[]) => api.post('/auth/waitlist-announce', { roles }),
    onSuccess: (data) => setAnnounceResult(data),
  });

  const filtered = entries.filter(e => {
    if (roleFilter !== 'all' && e.role !== roleFilter) return false;
    if (tierFilter === 'none' && e.tier) return false;
    if (tierFilter !== 'all' && tierFilter !== 'none' && e.tier !== tierFilter) return false;
    if (search && !e.email.toLowerCase().includes(search.toLowerCase()) && !(e.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleCount = (role: string) => entries.filter(e => e.role === role).length;
  const tierCount = (tier: string)  => entries.filter(e => e.tier === tier).length;

  const recipientCount = announceRoles.length === 0 ? 0
    : entries.filter(e => announceRoles.includes(e.role)).length;

  const toggleRole = (id: string) =>
    setAnnounceRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const downloadCsv = () => {
    const header = 'Email,Name,Phone,Role,Tier,Joined';
    const rows = filtered.map(e =>
      `${e.email},${e.name || ''},${e.phone || ''},${e.role},${e.tier || ''},${new Date(e.created_at).toLocaleDateString()}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'autopayke-waitlist.csv'; a.click();
  };

  const openAnnounce = () => {
    setAnnounceResult(null);
    setAnnounceRoles(['car_owner', 'owner', 'detailer']);
    setAnnounceOpen(true);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Waitlist"
        subtitle={`${entries.length} people waiting for AutoPayKe`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadCsv} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
            <Button size="sm" onClick={openAnnounce} disabled={entries.length === 0}>
              <Send className="w-4 h-4 mr-1.5" /> Send Announcement
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <p className="font-display text-2xl text-foreground">{entries.length}</p>
        </div>
        {(['car_owner', 'owner', 'detailer'] as const).map(role => {
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
        {(['economy', 'first_class', 'premium'] as const).map(tier => {
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
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {entry.metadata.bizName}{entry.metadata.bizLocation ? ` · ${entry.metadata.bizLocation}` : ''}
                          </p>
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

      <p className="text-xs text-muted-foreground mt-3 text-right">
        Showing {filtered.length} of {entries.length} entries
      </p>

      {/* ── Announce Dialog ──────────────────────────────────────────────────── */}
      {announceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground">Send Launch Announcement</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Role-specific onboarding emails for each group</p>
              </div>
              <button onClick={() => setAnnounceOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Role selector */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Send to</p>
                <div className="space-y-2">
                  {ANNOUNCE_ROLES.map(ar => {
                    const count  = entries.filter(e => e.role === ar.id).length;
                    const active = announceRoles.includes(ar.id);
                    return (
                      <button
                        key={ar.id}
                        onClick={() => toggleRole(ar.id)}
                        disabled={announce.isPending || announceResult !== null}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${active ? 'border-primary bg-primary/8' : 'border-border hover:border-border/80'}`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${active ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                          {active && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">{ar.label}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">{count}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ar.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview note */}
              {!announceResult && (
                <div className="bg-muted/40 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Each group receives a <strong className="text-foreground">role-specific email</strong> with a step-by-step guide tailored to them — Car Owners get a booking walkthrough, Business Owners get a setup guide, and Detailers get a jobs &amp; earnings guide.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong className="text-foreground">{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}</strong> will receive this email.
                  </p>
                </div>
              )}

              {/* Result */}
              {announceResult && (
                <div className={`rounded-xl p-4 border flex gap-3 items-start ${announceResult.failed > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  {announceResult.failed > 0
                    ? <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    : <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {announceResult.failed > 0 ? 'Sent with some failures' : 'Emails sent successfully!'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {announceResult.sent} sent · {announceResult.failed} failed · {announceResult.total} total
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {announce.isError && (
                <div className="rounded-xl p-4 border bg-red-500/10 border-red-500/30 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">Failed to send. Please try again.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {announceResult ? `Done · ${announceResult.sent}/${announceResult.total} sent` : `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setAnnounceOpen(false)}>
                  {announceResult ? 'Close' : 'Cancel'}
                </Button>
                {!announceResult && (
                  <Button
                    size="sm"
                    onClick={() => announce.mutate(announceRoles)}
                    disabled={announce.isPending || announceRoles.length === 0 || recipientCount === 0}
                  >
                    {announce.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-1.5" /> Send {recipientCount > 0 ? `to ${recipientCount}` : ''}</>
                    )}
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
