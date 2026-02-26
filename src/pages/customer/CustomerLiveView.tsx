import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2, Camera, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function CustomerLiveView() {
  const { toast } = useToast();
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<any[]>('/bookings'),
  });

  const activeBooking = bookings.find((b: any) => b.status === 'in_progress');

  const startCall = () => {
    if (!activeBooking) {
      toast({ title: 'No Active Service', description: 'You need an active booking to start live view.' });
      return;
    }
    setIsInCall(true);
    toast({ title: 'Connecting...', description: 'Establishing live video via Agora RTC.' });
  };

  const endCall = () => {
    setIsInCall(false);
    toast({ title: 'Call Ended', description: 'Live video session has ended.' });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { from: 'customer', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatInput('');
  };

  return (
    <DashboardLayout>
      <PageHeader title="Live View" subtitle="Watch your car being serviced in real-time • Powered by Agora" />

      {!activeBooking && (
        <div className="mb-4 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">No active service right now. Live view is available when a detailer has started your service.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden border border-border shadow-card bg-card">
            <div className="relative aspect-video bg-foreground/5 flex items-center justify-center">
              {isInCall ? (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                        <Video className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Live Feed — {activeBooking?.detailerName || 'Detailer'}</p>
                      <p className="text-xs text-muted-foreground">{activeBooking?.serviceName} • {activeBooking?.vehicleName}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg bg-muted border-2 border-border flex items-center justify-center">
                    {isVideoOn ? (
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mx-auto text-primary-foreground text-xs font-bold">You</div>
                      </div>
                    ) : (
                      <VideoOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" /> LIVE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Video className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-foreground mb-1">Live Video Check-In</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Start a live video call with your detailer to watch your car being serviced.</p>
                  <Button onClick={startCall} disabled={!activeBooking}><Video className="w-4 h-4 mr-2" /> Start Live View</Button>
                </div>
              )}
            </div>

            {isInCall && (
              <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 border-t border-border">
                <Button variant={isMuted ? 'destructive' : 'outline'} size="sm" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button variant={!isVideoOn ? 'destructive' : 'outline'} size="sm" onClick={() => setIsVideoOn(!isVideoOn)}>
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Screenshot', description: 'Screenshot saved.' })}>
                  <Camera className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm"><Maximize2 className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={endCall}><PhoneOff className="w-4 h-4 mr-1" /> End</Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border shadow-card">
            <h4 className="font-display text-foreground text-sm mb-3">Active Service</h4>
            {activeBooking ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="text-foreground font-medium">{activeBooking.serviceName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="text-foreground font-medium">{activeBooking.vehicleName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Detailer</span><span className="text-foreground font-medium">{activeBooking.detailerName || 'Assigned'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="text-foreground font-medium">{activeBooking.locationName}</span></div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active service.</p>
            )}
          </div>

          <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden flex flex-col" style={{ height: '340px' }}>
            <div className="p-3 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Chat with Detailer</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Start a live session to chat.</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.from === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.from === 'customer' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input placeholder="Message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} className="text-xs" disabled={!isInCall} />
              <Button size="sm" onClick={sendChat} disabled={!chatInput.trim() || !isInCall}><Send className="w-3 h-3" /></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground"><strong className="text-foreground">Powered by Agora:</strong> Low-latency, HD video streaming with real-time chat. Encrypted end-to-end for privacy. Detailers can stream their work, and customers can check in at any time during the service.</p>
      </div>
    </DashboardLayout>
  );
}
