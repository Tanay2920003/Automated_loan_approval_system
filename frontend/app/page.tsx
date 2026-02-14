"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Activity,
  BrainCircuit,
  Lightbulb,
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  Plus
} from "lucide-react";
import { LoanChart } from "@/components/LoanChart";
import { KPI } from "@/components/KPI";

// --- Types ---
type RiskDriver = {
  feature: string;
  impact_on_probability: number;
};

type PredictResult = {
  loan_approval?: string;
  approval_probability?: number;
  confidence?: number;
  risk_band?: string;
  risk_score?: number;
  risk_drivers?: RiskDriver[];
  financial_metrics?: {
    dti_ratio: number;
    asset_coverage: number;
    total_assets: number;
  };
  actionable_steps?: string[];
};

type FormState = {
  no_of_dependents: number | null;
  education: string;
  self_employed: string;
  income_annum: number | null;
  loan_amount: number | null;
  loan_term: number | null;
  cibil_score: number | null;
  residential_assets_value: number | null;
  commercial_assets_value: number | null;
  luxury_assets_value: number | null;
  bank_asset_value: number | null;
};

// --- Custom Sub-Components ---

const StatItem = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="p-4 rounded-2xl bg-glass border border-stroke">
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-bold text-white mb-1">{value}</p>
    <p className="text-[10px] text-emerald-400 font-bold">{sub}</p>
  </div>
);

export default function Home() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [form, setForm] = useState<FormState>({
    no_of_dependents: null,
    education: "",
    self_employed: "",
    income_annum: null,
    loan_amount: null,
    loan_term: null,
    cibil_score: null,
    residential_assets_value: null,
    commercial_assets_value: null,
    luxury_assets_value: null,
    bank_asset_value: null,
  });

  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hi! I am your Financial Copilot. Ask me anything about your credit health.' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationForm, setSimulationForm] = useState<FormState | null>(null);
  const [isKnowledgeHubOpen, setIsKnowledgeHubOpen] = useState(false);
  const [knowledgeTerm, setKnowledgeTerm] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/user/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const fetchKnowledge = useCallback(async (term: string) => {
    try {
      const res = await fetch(`/api/v1/knowledge/${term}`);
      const data = await res.json();
      setKnowledgeTerm(data);
    } catch (err) {
      console.error("Knowledge error:", err);
    }
  }, []);

  const chartData = useMemo(() => {
    if (!analytics?.score_trend || analytics.score_trend.length === 0) {
      return [{ time: "Base", prob: 0.5 }, { time: "Now", prob: 0.5 }];
    }
    return analytics.score_trend.map((r: any) => ({
      time: new Date(r.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      prob: r.prob
    }));
  }, [analytics]);

  useEffect(() => {
    if (!isSimulationMode || !simulationForm) return;
    const delayDebounceFn = setTimeout(async () => {
      const submissionData = Object.entries(simulationForm).reduce((acc: any, [key, val]) => {
        acc[key] = (typeof val === 'string' && !isNaN(Number(val)) && val !== "") ? Number(val) : val;
        if (key === 'education' || key === 'self_employed') acc[key] = val;
        return acc;
      }, {});
      try {
        const res = await fetch("/api/v1/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        });
        const data = await res.json();
        setResult(data);
        fetchAnalytics();
      } catch (err) { console.error(err); }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [simulationForm, isSimulationMode, fetchAnalytics]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // For Synthetic platform, we handle numbers and strings explicitly
    const isCategorical = name === "education" || name === "self_employed";
    const val = isCategorical ? value : (value === "" ? null : Number(value));

    const newForm = { ...form, [name]: val };
    setForm(newForm);
    if (isSimulationMode) setSimulationForm(newForm);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: result ? { loan_approval: result.loan_approval, risk_band: result.risk_band, risk_score: result.risk_score } : {}
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) { console.error(error); }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submissionData = Object.entries(form).reduce((acc: any, [key, val]) => {
        acc[key] = val;
        return acc;
      }, {});
      const res = await fetch("/api/v1/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      const data = await res.json();
      setResult(data);
      fetchAnalytics();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 space-y-10 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Intelligence <span className="text-blue-500">Dashboard</span>
          </h1>
          <p className="text-gray-400 font-medium">Real-time simulation and financial credit audit platform.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSimulationMode(!isSimulationMode)}
            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${isSimulationMode
                ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/40"
                : "bg-glass border-stroke text-gray-400 hover:text-white"
              }`}
          >
            {isSimulationMode ? <Activity size={16} /> : <Plus size={16} />}
            {isSimulationMode ? "Simulation Active" : "New Simulation"}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI
          title="Synthetic Score"
          value={analytics?.synthetic_score || 720}
          delta="+14%"
          icon={<BrainCircuit size={20} />}
        />
        <KPI
          title="Approval Likelihood"
          value={result?.approval_probability ? `${Math.round(result.approval_probability * 100)}%` : "84%"}
          delta="+2.4%"
          icon={<Activity size={20} />}
        />
        <KPI
          title="DTI Balance"
          value={analytics?.behavioral_metrics?.dti ? `${(analytics.behavioral_metrics.dti * 100).toFixed(1)}%` : "32%"}
          delta="-0.5%"
          isPositive={true}
          icon={<TrendingDown size={20} />}
        />
        <KPI
          title="Asset Coverage"
          value={analytics?.behavioral_metrics?.asset_coverage ? `${analytics.behavioral_metrics.asset_coverage}x` : "1.8x"}
          delta="+0.1x"
          icon={<BarChart3 size={20} />}
        />
      </div>

      {/* Main Grid: Charts & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <LoanChart data={chartData} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatItem label="Active Users" value="2,340" sub="+12% from last week" />
            <StatItem label="Avg Approval" value="78%" sub="Stable trend" />
            <StatItem label="Global Rank" value="#42" sub="Top 5% financial health" />
          </div>
        </div>

        <div className="space-y-8">
          {/* Action Plan */}
          <div className="glass-card p-6 border-l-4 border-l-blue-600">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-blue-500" /> Improvement Plan
            </h3>
            {result?.actionable_steps ? (
              <div className="space-y-4">
                {result.actionable_steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition-colors">{step}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Adjust values in simulation mode to see live improvement strategies.</p>
            )}
          </div>

          {/* Behavioral Radar (Simulated) */}
          <div className="glass-card p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Behavioral Audit
            </h3>
            <div className="space-y-6">
              {[
                { label: "Payment Consistency", val: 92, color: "bg-blue-600" },
                { label: "Credit Depth", val: 74, color: "bg-cyan-500" },
                { label: "Asset Stability", val: 81, color: "bg-indigo-600" }
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-2 opacity-50">
                    <span>{stat.label}</span>
                    <span>{stat.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-glass-strong rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${stat.val}%` }} className={`h-full ${stat.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Simulator / Form Section */}
      <div className="glass-card p-8 bg-gradient-to-br from-glass to-base relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck size={200} />
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Financial <span className="text-gray-500">Simulator</span></h2>
            <p className="text-xs text-gray-400">Tweak parameters to see immediate impact on scores.</p>
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1 tracking-widest">Income (Annual)</label>
            <input name="income_annum" type="number" value={form.income_annum || ""} onChange={handleChange} className="w-full bg-glass p-4 rounded-xl border border-stroke text-sm focus:border-blue-500 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1 tracking-widest">Loan Amount</label>
            <input name="loan_amount" type="number" value={form.loan_amount || ""} onChange={handleChange} className="w-full bg-glass p-4 rounded-xl border border-stroke text-sm focus:border-blue-500 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1 tracking-widest">CIBIL Score</label>
            <input name="cibil_score" type="number" value={form.cibil_score || ""} onChange={handleChange} className="w-full bg-glass p-4 rounded-xl border border-stroke text-sm focus:border-blue-500 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1 tracking-widest">Bank Assets</label>
            <input name="bank_asset_value" type="number" value={form.bank_asset_value || ""} onChange={handleChange} className="w-full bg-glass p-4 rounded-xl border border-stroke text-sm focus:border-blue-500 outline-none transition-all" />
          </div>

          <div className="lg:col-span-4 pt-4">
            <button type="submit" className="w-full py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/30">
              {loading ? "Processing..." : "Generate Intelligence Audit"}
            </button>
          </div>
        </form>
      </div>

      {/* AI Sidebar Toggle */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
      >
        <motion.div animate={{ rotate: isChatOpen ? 90 : 0 }}>
          {isChatOpen ? <Plus className="rotate-45" /> : <BrainCircuit />}
        </motion.div>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
      </button>

      {/* Floating Chat UI */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 right-10 w-80 md:w-96 glass-card h-[500px] flex flex-col z-50 shadow-2xl border-blue-500/20"
          >
            <div className="p-4 bg-blue-600 flex justify-between items-center rounded-t-[23px]">
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} />
                <span className="font-bold text-sm text-white">Financial Copilot</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/60 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-medium ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-glass-strong text-gray-200 rounded-tl-none border border-stroke'
                    }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 border-t border-stroke flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-glass p-4 rounded-xl text-xs outline-none focus:border-blue-500 border border-transparent transition-all"
              />
              <button type="submit" className="p-4 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                <ArrowUpRight size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glossary Hub */}
      <div className="flex flex-wrap gap-4 items-center justify-center pt-10 border-t border-stroke">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-4">Financial Glossary</p>
        {['CIBIL', 'Debt-to-Income', 'Credit-Utilization'].map(t => (
          <button
            key={t}
            onClick={() => { fetchKnowledge(t); setIsKnowledgeHubOpen(true); }}
            className="px-5 py-2.5 bg-glass border border-stroke rounded-xl text-[10px] font-bold hover:border-blue-500/50 hover:bg-blue-600/5 transition-all text-gray-300 hover:text-white"
          >
            {t}
          </button>
        ))}
      </div>

      {/* Knowledge Popup Modal */}
      <AnimatePresence>
        {isKnowledgeHubOpen && knowledgeTerm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-base/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 lg:p-0"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass-card max-w-xl w-full p-10 relative border-blue-500/20 shadow-2xl"
            >
              <button onClick={() => setIsKnowledgeHubOpen(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-colors">✕</button>
              <h2 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">{knowledgeTerm.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">{knowledgeTerm.definition}</p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/10 text-center">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Target</p>
                  <p className="text-2xl font-black text-white">{knowledgeTerm.ideal_range}</p>
                </div>
                <div className="bg-cyan-600/5 p-6 rounded-3xl border border-cyan-500/10 text-center">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-2xl font-black text-white">Recommended</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowUpRight size={14} className="text-blue-500" /> Best Practices
                </p>
                {(Array.isArray(knowledgeTerm.how_to_improve) ? knowledgeTerm.how_to_improve : [knowledgeTerm.how_to_improve]).map((tip: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-glass border border-stroke rounded-2xl text-xs font-semibold hover:border-blue-500/30 transition-all cursor-default">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" /> {tip}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
