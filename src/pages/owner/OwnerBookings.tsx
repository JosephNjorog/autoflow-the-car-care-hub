import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatusBadge } from '@/components/shared/SharedComponents';
import { mockBookings, mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 border-warning/40 text-warning',
  confirmed: 'bg-primary/20 border-primary/40 text-primary',
  in_progress: 'bg-accent/20 border-accent/40 text-accent',
  completed: 'bg-success/20 border-success/40 text-success',
  cancelled: 'bg-destructive/20 border-destructive/40 text-destructive',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarView({ bookings }: { bookings: Booking[] }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectedDateStr = selectedDay;
  const selectedBookings = selectedDateStr ? (bookingsByDate[selectedDateStr] || []) : [];

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="font-display text-lg text-foreground">{monthNames[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-border">
          {dayLabels.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="p-2 min-h-[80px] md:min-h-[100px] border-b border-r border-border bg-muted/20" />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBookings = bookingsByDate[dateStr] || [];
            const isSelected = selectedDay === dateStr;
            const isToday = dateStr === '2026-02-25';

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`p-1.5 md:p-2 min-h-[80px] md:min-h-[100px] border-b border-r border-border text-left transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5 ring-1 ring-primary' : ''}`}
              >
                <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 3).map(b => (
                    <div key={b.id} className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded border truncate ${statusColors[b.status]}`}>
                      <span className="hidden md:inline">{b.time} </span>{b.serviceName}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">+{dayBookings.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="font-display text-foreground mb-4">
            Bookings for {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No bookings on this date.</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map(b => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
                  <div>
                    <p className="font-medium text-foreground text-sm">{b.time} — {b.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{b.customerName} · {b.vehicleName}</p>
                    <p className="text-xs text-muted-foreground">{b.locationName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={b.status} />
                    <span className="font-display text-sm text-foreground">KES {b.servicePrice.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OwnerBookings() {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const { toast } = useToast();
  const bookings = mockBookings
    .filter(b => filter === 'all' || b.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const detailers = mockUsers.filter(u => u.role === 'detailer');

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="All Bookings" subtitle="Manage bookings across all locations" />
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView bookings={bookings} />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-display text-foreground">{b.serviceName} — {b.customerName}</p>
                  <p className="text-sm text-muted-foreground">{b.vehicleName} · {b.locationName}</p>
                  <p className="text-sm text-muted-foreground">{b.date} at {b.time}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={b.status} />
                  <span className="font-display text-foreground">KES {b.servicePrice.toLocaleString()}</span>
                  {!b.detailerId && b.status !== 'cancelled' && b.status !== 'completed' && (
                    <Dialog>
                      <DialogTrigger asChild><Button size="sm" variant="outline">Assign</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle className="font-display">Assign Detailer</DialogTitle></DialogHeader>
                        <div className="space-y-3 pt-2">
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Select detailer" /></SelectTrigger>
                            <SelectContent>
                              {detailers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button className="w-full" onClick={() => toast({ title: 'Detailer Assigned', description: `Detailer has been assigned to ${b.serviceName}.` })}>Assign Detailer</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {b.detailerName && <span className="text-xs text-muted-foreground">Detailer: {b.detailerName}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
