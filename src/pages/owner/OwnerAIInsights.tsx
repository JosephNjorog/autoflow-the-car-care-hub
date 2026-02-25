import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Brain, TrendingUp, Users, Zap, MessageSquare, Send, BarChart3, Lightbulb, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const mockInsights = [
  { id: 1, type: 'pricing', icon: <TrendingUp className="w-4 h-4" />, title: 'Dynamic Pricing Opportunity', description: 'Demand for Express Wash peaks on Saturdays 9-11 AM. Consider a 15% surge pricing during this window — projected revenue uplift: KES 8,500/month.', confidence: 92, action: 'Apply Pricing' },
  { id: 2, type: 'booking', icon: <Users className="w-4 h-4" />, title: 'Customer Retention Risk', description: 'Grace Wanjiku hasn\'t booked in 5 days (avg interval: 3 days). Send a personalized 10% discount offer to re-engage.', confidence: 85, action: 'Send Offer' },
  { id: 3, type: 'operations', icon: <Clock className="w-4 h-4" />, title: 'Staff Optimization', description: 'Tuesday afternoons are consistently under-booked. Consider reassigning one detailer to marketing outreach during 2-5 PM slots.', confidence: 78, action: 'View Schedule' },
  { id: 4, type: 'upsell', icon: <Lightbulb className="w-4 h-4" />, title: 'Upsell Recommendation', description: 'Customers who book Interior Clean have a 65% likelihood of adding Upholstery Steam. Suggest bundling at a 10% discount.', confidence: 88, action: 'Create Bundle' },
];

const mockChatMessages = [
  { role: 'assistant' as const, content: 'Hello! I\'m your Kite AI business assistant. I can help you analyze trends, suggest pricing strategies, and optimize operations. What would you like to know?' },
];

export default function OwnerAIInsights() {
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const [messages, setMessages] = useState(mockChatMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'assistant' as const, content: '' }, { role: 'assistant' as const, content: userMsg }]);
    // Fix: properly add user then simulate AI response
    setMessages(prev => {
      const updated = [...prev.slice(0, -2)];
      updated.push({ role: 'assistant' as const, content: userMsg });
      return updated;
    });
    setMessages(prev => [...prev.slice(0, -1), { role: 'assistant' as const, content: userMsg }]);
    // Simplified:
    setMessages(prev => [...prev, { role: 'assistant', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        default: `Based on your analytics data, here's what I see:\n\n📊 **Revenue Trend**: Your revenue has grown 18% month-over-month, with February tracking to hit KES 53K.\n\n🔥 **Top Performer**: Express Wash generates the most bookings (68), but Full Detail drives the highest revenue per booking.\n\n💡 **Recommendation**: Consider a loyalty bundle — customers who get 5 Express Washes get a Full Detail at 20% off. This could increase your average ticket by ~KES 400.`,
      };
      setMessages(prev => [...prev, { role: 'assistant', content: responses.default }]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="AI Insights" subtitle="Smart analytics powered by Kite AI on Avalanche" />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6 w-fit">
        {[
          { id: 'insights' as const, label: 'Smart Insights', icon: <Brain className="w-4 h-4" /> },
          { id: 'chat' as const, label: 'AI Assistant', icon: <MessageSquare className="w-4 h-4" /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'insights' && (
          <motion.div key="insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* AI status bar */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Kite AI Engine Active</p>
                <p className="text-xs text-muted-foreground">Analyzing 156 bookings, 6 services, 142 customers • Last scan: 2 min ago</p>
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-success/15 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
              </span>
            </div>

            {/* Insights cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {mockInsights.map((insight, i) => (
                <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">{insight.icon}</div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">{insight.type}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-primary">{insight.confidence}%</span>
                    </div>
                  </div>
                  <h4 className="font-display text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                  <Button size="sm" variant="outline">{insight.action}</Button>
                </motion.div>
              ))}
            </div>

            {/* How it works */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground"><strong className="text-foreground">Powered by Kite AI:</strong> Our AI engine runs on the Kite AI blockchain network, providing decentralized, verifiable inference. Insights are generated from your booking history, revenue data, and customer behavior patterns.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden flex flex-col" style={{ height: '60vh' }}>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-display text-foreground">Kite AI Assistant</p>
                  <p className="text-xs text-muted-foreground">Ask about your business data, trends, and recommendations</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'assistant' && i > 0 && messages[i-1]?.role !== 'assistant' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${i === 0 || msg.role === 'assistant' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-3 rounded-xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input placeholder="Ask about revenue, bookings, pricing..." value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                  <Button onClick={sendMessage} disabled={!input.trim() || isTyping}><Send className="w-4 h-4" /></Button>
                </div>
                <div className="flex gap-2 mt-2">
                  {['Revenue this month?', 'Top service by profit?', 'Suggest pricing changes'].map(q => (
                    <button key={q} onClick={() => { setInput(q); }} className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
