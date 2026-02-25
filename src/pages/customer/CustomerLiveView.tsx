import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Maximize2, Camera, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function CustomerLiveView() {
  const { toast } = useToast();
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { from: 'detailer', text: 'Hi! I\'m starting on your Toyota Prado now. Will show you the progress.', time: '10:02 AM' },
    { from: 'customer', text: 'Great, thanks Peter!', time: '10:03 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const activeBooking = {
    service: 'Full Detail',
    vehicle: 'Toyota Prado - KDA 123A',
    detailer: 'Peter Ochieng',
    location: 'AutoFlow Westlands',
    startedAt: '10:00 AM',
  };

  const startCall = () => {
    setIsInCall(true);
    toast({ title: 'Connecting...', description: 'Establishing live video via Agora RTC on Avalanche.' });
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
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Live View" subtitle="Watch your car being serviced in real-time • Powered by Agora" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video area */}
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden border border-border shadow-card bg-card">
            {/* Video feed */}
            <div className="relative aspect-video bg-foreground/5 flex items-center justify-center">
              {isInCall ? (
                <div className="relative w-full h-full">
                  {/* Simulated video feed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                        <Video className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Live Feed — {activeBooking.detailer}</p>
                      <p className="text-xs text-muted-foreground">{activeBooking.service} • {activeBooking.vehicle}</p>
                    </div>
                  </div>
                  {/* Self view pip */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg bg-muted border-2 border-border flex items-center justify-center">
                    {isVideoOn ? (
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mx-auto text-primary-foreground text-xs font-bold">JM</div>
                        <p className="text-[10px] text-muted-foreground mt-1">You</p>
                      </div>
                    ) : (
                      <VideoOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  {/* Live badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" /> LIVE
                    </span>
                    <span className="px-2 py-1 rounded-full bg-foreground/50 text-background text-[10px] backdrop-blur-sm">HD</span>
                  </div>
                  {/* Duration */}
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 rounded-full bg-foreground/50 text-background text-[10px] backdrop-blur-sm">12:34</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Video className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-foreground mb-1">Live Video Check-In</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Start a live video call with your detailer to see your car being serviced in real time.</p>
                  <Button onClick={startCall}><Video className="w-4 h-4 mr-2" /> Start Live View</Button>
                </div>
              )}
            </div>

            {/* Controls */}
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

        {/* Chat + Info sidebar */}
        <div className="space-y-4">
          {/* Active booking info */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-card">
            <h4 className="font-display text-foreground text-sm mb-3">Active Service</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="text-foreground font-medium">{activeBooking.service}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="text-foreground font-medium">{activeBooking.vehicle}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Detailer</span><span className="text-foreground font-medium">{activeBooking.detailer}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="text-foreground font-medium">{activeBooking.location}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="text-foreground font-medium">{activeBooking.startedAt}</span></div>
            </div>
          </div>

          {/* Chat */}
          <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden flex flex-col" style={{ height: '340px' }}>
            <div className="p-3 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Chat with Detailer</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
              <Input placeholder="Message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} className="text-xs" />
              <Button size="sm" onClick={sendChat} disabled={!chatInput.trim()}><Send className="w-3 h-3" /></Button>
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
