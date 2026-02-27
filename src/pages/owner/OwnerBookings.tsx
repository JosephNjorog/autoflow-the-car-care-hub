import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { List, CalendarDays, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserCog, Loader2, Bell } from 'lucide-react';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffMember = { id: string; name: string; phone?: string };

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 border-warning/40 text-warning',
  confirmed: 'bg-primary/20 border-primary/40 text-primary',
  in_progress: 'bg-accent/20 border-accent/40 text-accent',
  completed: 'bg-success/20 border-success/40 text-success',
  cancelled: 'bg-destructive/20 border-destructive/40 text-destructive',
};

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── CalendarView ─────────────────────────────────────────────────────────────

function CalendarView({ bookings }: { bookings: any[] }) {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    bookings.forEach(b => {
      const key = b.date || b.scheduledDate;
      if (key) { if (!map[key]) map[key] = []; map[key].push(b); }
    });
    return map;
  }, [bookings]);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
          <h3 className="font-display text-lg text-foreground">{monthNames[month]} {year}</h3>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-border">
          {dayLabels.map(d => <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className="p-2 min-h-[80px] border-b border-r border-border bg-muted/20" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBookings = bookingsByDate[dateStr] || [];
            const isSelected = selectedDay === dateStr;
            const isToday = dateStr === todayStr;
            return (
              <button key={day} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`p-1.5 md:p-2 min-h-[80px] border-b border-r border-border text-left transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5 ring-1 ring-primary' : ''}`}>
                <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 3).map((b: any) => (
                    <div key={b.id} className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded border truncate ${statusColors[b.status]}`}>
                      <span className="hidden md:inline">{b.time} </span>{b.serviceName}
                    </div>
                  ))}
                  {dayBookings.length > 3 && <div className="text-[10px] text-muted-foreground px-1.5">+{dayBookings.length - 3} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {selectedDay && (
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="font-display text-foreground mb-4">
            Bookings for {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          {(bookingsByDate[selectedDay] || []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No bookings on this date.</p>
          ) : (bookingsByDate[selectedDay] || []).map((b: any) => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3 mb-2">
              <div>
                <p className="font-medium text-foreground text-sm">{b.time} — {b.serviceName}</p>
                <p className="text-xs text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                <span className="font-display text-sm text-foreground">KES {(b.servicePrice || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerBookings() {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [assignDialogBooking, setAssignDialogBooking] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  // Offline staff (no app account) + online detailers — combined for assignment
  const { data: ownerStaff = [] } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: () => api.get<StaffMember[]>('/users/staff'),
  });

  const { data: onlineDetailers = [] } = useQuery({
    queryKey: ['owner-detailers'],
    queryFn: () => api.get<any[]>('/users?role=detailer'),
  });

  // Unified list: offline staff + online detailers
  const allAssignable: { id: string; name: string; type: 'staff' | 'detailer' }[] = [
    ...ownerStaff.map(s => ({ id: s.id, name: s.name, type: 'staff' as const })),
    ...onlineDetailers.map((d: any) => ({ id: d.id, name: d.name || `${d.firstName} ${d.lastName}`, type: 'detailer' as const })),
  ];

  const filtered = bookings
    .filter((b: any) => filter === 'all' || b.status === filter)
    .sort((a: any, b: any) => {
      // Pending first, then by date descending
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return (b.date || '').localeCompare(a.date || '');
    });

  const pendingCount = bookings.filter((b: any) => b.status === 'pending').length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });

  // Resolve correct field name for assignment (offline staff → staffId, online detailer → detailerId)
  const buildAssignBody = (assignableId: string): Record<string, unknown> => {
    const person = allAssignable.find(a => a.id === assignableId);
    if (!person) return {};
    return person.type === 'detailer' ? { detailerId: assignableId } : { staffId: assignableId };
  };

  // Accept booking (optionally assign at same time)
  const handleAccept = async (bookingId: string, serviceName: string, assignId?: string) => {
    setActioning(bookingId);
    try {
      const body: Record<string, unknown> = { status: 'confirmed' };
      if (assignId) Object.assign(body, buildAssignBody(assignId));
      await api.patch(`/bookings/${bookingId}`, body);
      invalidate();
      if (assignId) {
        const person = allAssignable.find(a => a.id === assignId);
        toast({ title: 'Accepted & Assigned', description: `${serviceName} confirmed and assigned to ${person?.name ?? 'Staff'}.` });
      } else {
        toast({ title: 'Booking Accepted', description: `${serviceName} has been confirmed.` });
      }
      setAssignDialogBooking(null);
      setSelectedStaff('');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setActioning(null);
    }
  };

  // Decline booking
  const handleDecline = async (bookingId: string, serviceName: string) => {
    setActioning(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}`, { status: 'cancelled' });
      invalidate();
      toast({ title: 'Booking Declined', description: `${serviceName} has been cancelled.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setActioning(null);
    }
  };

  // Assign to an already-accepted booking
  const handleAssignStaff = async () => {
    if (!assignDialogBooking || !selectedStaff) return;
    setActioning(assignDialogBooking.id);
    try {
      await api.patch(`/bookings/${assignDialogBooking.id}`, buildAssignBody(selectedStaff));
      invalidate();
      const person = allAssignable.find(a => a.id === selectedStaff);
      toast({ title: 'Assigned', description: `${assignDialogBooking.serviceName} assigned to ${person?.name ?? 'Staff'}.` });
      setAssignDialogBooking(null);
      setSelectedStaff('');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setActioning(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="All Bookings"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} booking${pendingCount !== 1 ? 's' : ''} awaiting your response`
            : 'Manage bookings across all locations'
        }
      />

      {/* Filter + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}
              className="capitalize text-xs relative">
              {f === 'all' ? 'All' : f.replace('_', ' ')}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning text-warning-foreground text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button onClick={() => setView('calendar')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <CalendarDays className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
      ) : view === 'calendar' ? (
        <CalendarView bookings={filtered} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No bookings found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b: any) => {
            const isPending = b.status === 'pending';
            const isActioning = actioning === b.id;
            const assignedName = b.staffName || b.detailerName;

            return (
              <div key={b.id} className={`p-4 rounded-xl border shadow-card ${isPending ? 'bg-warning/5 border-warning/30' : 'bg-card border-border'}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-display text-foreground">{b.serviceName}</p>
                      <StatusBadge status={b.status} />
                      {isPending && (
                        <Badge variant="outline" className="text-[10px] border-warning/50 text-warning px-1.5 py-0">
                          Action required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{b.customerName} · {b.vehicleName || 'No vehicle'}</p>
                    <p className="text-sm text-muted-foreground">{b.locationName} · {b.date} at {b.time}</p>
                    {assignedName && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <UserCog className="w-3 h-3" /> Assigned to {assignedName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-display text-foreground">KES {(b.servicePrice || 0).toLocaleString()}</span>

                    {isPending ? (
                      /* ── Pending: Accept (optionally assign) or Decline ── */
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-1"
                          disabled={isActioning}
                          onClick={() => handleDecline(b.id, b.serviceName)}
                        >
                          {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Decline
                        </Button>
                        <Button
                          size="sm" className="gap-1"
                          disabled={isActioning}
                          onClick={() => {
                            if (allAssignable.length > 0) {
                              // Open assign dialog; accept happens on confirm
                              setAssignDialogBooking({ ...b, acceptOnAssign: true });
                              setSelectedStaff('');
                            } else {
                              handleAccept(b.id, b.serviceName);
                            }
                          }}
                        >
                          {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Accept
                        </Button>
                      </div>
                    ) : (
                      /* ── Confirmed: optional staff assignment ── */
                      !['cancelled', 'completed'].includes(b.status) && !assignedName && (
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => { setAssignDialogBooking(b); setSelectedStaff(''); }}>
                          <UserCog className="w-3.5 h-3.5" /> Assign Staff
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Staff Dialog */}
      <Dialog
        open={!!assignDialogBooking}
        onOpenChange={o => { if (!o) { setAssignDialogBooking(null); setSelectedStaff(''); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {assignDialogBooking?.acceptOnAssign ? 'Accept & Assign' : 'Assign Staff'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {assignDialogBooking?.acceptOnAssign
              ? 'Optionally assign a team member before accepting. You can also accept without assigning.'
              : 'Choose a team member to handle this booking.'}
          </p>

          {allAssignable.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No staff yet. Add team members from the Staff page.
            </p>
          ) : (
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {ownerStaff.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Team Members</div>
                    {ownerStaff.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}{s.phone ? ` · ${s.phone}` : ''}</SelectItem>
                    ))}
                  </>
                )}
                {onlineDetailers.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-1">App Detailers</div>
                    {onlineDetailers.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name || `${d.firstName} ${d.lastName}`}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-2 mt-2">
            {assignDialogBooking?.acceptOnAssign && (
              <Button variant="outline" className="flex-1"
                disabled={actioning === assignDialogBooking?.id}
                onClick={() => handleAccept(assignDialogBooking.id, assignDialogBooking.serviceName)}>
                Accept without assigning
              </Button>
            )}
            <Button
              className="flex-1"
              disabled={!selectedStaff || actioning === assignDialogBooking?.id}
              onClick={() => {
                if (assignDialogBooking?.acceptOnAssign) {
                  handleAccept(assignDialogBooking.id, assignDialogBooking.serviceName, selectedStaff);
                } else {
                  handleAssignStaff();
                }
              }}
            >
              {actioning === assignDialogBooking?.id
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
                : assignDialogBooking?.acceptOnAssign ? 'Accept & Assign' : 'Assign'
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
