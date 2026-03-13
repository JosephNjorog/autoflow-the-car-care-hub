import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Brain, TrendingUp, Users, Zap, MessageSquare, BarChart3, Lightbulb, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OwnerAIInsights() {
  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="AI Insights" subtitle="Smart analytics powered by Kite AI on Avalanche" />

      {/* Coming Soon banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-primary/5 border border-primary/20 mb-8 flex items-start gap-4"
      >
        <div className="p-3 rounded-lg bg-primary/10 shrink-0">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-foreground mb-1">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered business insights via Kite AI are on the roadmap. Once live, the engine will analyse your booking history, revenue data, and customer patterns to surface actionable recommendations — directly inside AutoPayKe.
          </p>
        </div>
      </motion.div>

      {/* What's planned */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            icon: <TrendingUp className="w-4 h-4" />,
            type: 'pricing',
            title: 'Dynamic Pricing Insights',
            desc: 'Detect demand spikes and recommend surge pricing windows to maximise revenue per time slot.',
          },
          {
            icon: <Users className="w-4 h-4" />,
            type: 'retention',
            title: 'Customer Retention Alerts',
            desc: 'Spot customers at risk of churning before they leave and surface personalised re-engagement offers.',
          },
          {
            icon: <Clock className="w-4 h-4" />,
            type: 'operations',
            title: 'Staff Optimisation',
            desc: 'Identify under-booked slots and suggest how to redeploy staff for better throughput.',
          },
          {
            icon: <Lightbulb className="w-4 h-4" />,
            type: 'upsell',
            title: 'Upsell Recommendations',
            desc: 'Learn which service combinations convert best and auto-suggest bundles to increase average ticket size.',
          },
          {
            icon: <MessageSquare className="w-4 h-4" />,
            type: 'assistant',
            title: 'AI Chat Assistant',
            desc: 'Ask plain-English questions about your business — revenue trends, top services, pricing advice — and get instant answers.',
          },
          {
            icon: <BarChart3 className="w-4 h-4" />,
            type: 'forecasting',
            title: 'Revenue Forecasting',
            desc: 'Predictive models trained on your historical data to forecast bookings and revenue week-by-week.',
          },
        ].map(item => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl bg-card border border-border shadow-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">{item.icon}</div>
              <span className="text-xs font-medium text-muted-foreground uppercase">{item.type}</span>
            </div>
            <h4 className="font-display text-foreground mb-2">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Powered by Kite AI:</strong> Our AI engine will run on the Kite AI blockchain network, providing decentralised, verifiable inference generated from your real booking and revenue data.
          </span>
        </p>
      </div>
    </DashboardLayout>
  );
}
