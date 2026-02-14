"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type StatCardProps = {
     title: string;
     value: string | number;
     subtitle?: string;
     color: string;
};

const StatCard = ({ title, value, subtitle, color }: StatCardProps) => (
     <div className={`p-6 rounded-2xl bg-white dark:bg-gray-800 border-l-4 ${color} shadow-lg shadow-gray-200/50 dark:shadow-black/20`}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-gray-800 dark:text-white">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
     </div>
);

export default function AdminDashboard() {
     const [stats, setStats] = useState<any>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          async function fetchStats() {
               try {
                    const res = await fetch("/api/v1/admin/stats");
                    const data = await res.json();
                    setStats(data);
               } catch (err) {
                    console.error("Failed to fetch admin stats:", err);
               } finally {
                    setLoading(false);
               }
          }
          fetchStats();
     }, []);

     if (loading) return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
               <div className="animate-pulse text-blue-600 font-bold">Loading Intelligence Dashboard...</div>
          </div>
     );

     return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
               <div className="max-w-6xl mx-auto">
                    <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                         <div>
                              <h1 className="text-3xl font-black text-blue-900 dark:text-blue-400">Lender Analytics</h1>
                              <p className="text-gray-500 dark:text-gray-400 font-medium font-mono text-sm uppercase tracking-tighter">Aggregate Model Performance HUD</p>
                         </div>
                         <div className="text-right">
                              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-green-200">System Healthy</span>
                         </div>
                    </header>

                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                         <StatCard
                              title="Total Applications"
                              value={stats?.total_applications || 0}
                              subtitle="Analyzed by AI Engine"
                              color="border-blue-500"
                         />
                         <StatCard
                              title="Approval Rate"
                              value={`${stats?.approval_rate || 0}%`}
                              subtitle="Of successful predictions"
                              color="border-green-500"
                         />
                         <StatCard
                              title="Avg Risk Score"
                              value="3.2/10"
                              subtitle="Consolidated portfolio risk"
                              color="border-amber-500"
                         />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Risk Band Table */}
                         <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700">
                              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                                   📊 Risk Band Distribution
                              </h2>
                              <div className="space-y-4">
                                   {['Low', 'Medium', 'High'].map((band) => {
                                        const count = stats?.risk_distribution?.[band] || 0;
                                        const percent = (count / (stats?.total_applications || 1)) * 100;
                                        const colors = {
                                             Low: "bg-green-500",
                                             Medium: "bg-amber-500",
                                             High: "bg-red-500"
                                        };
                                        return (
                                             <div key={band}>
                                                  <div className="flex justify-between text-xs font-bold uppercase mb-1 opacity-70">
                                                       <span>{band} Risk</span>
                                                       <span>{count} Applications</span>
                                                  </div>
                                                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                       <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percent}%` }}
                                                            className={`h-full ${colors[band as keyof typeof colors]}`}
                                                       />
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>
                         </section>

                         {/* Recent Activity */}
                         <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700">
                              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                                   ⏱️ Live Feed
                              </h2>
                              <div className="space-y-3">
                                   {(stats?.recent_activity || []).map((log: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-transparent hover:border-blue-100 transition-all">
                                             <div className="flex items-center gap-4">
                                                  <div className={`w-2 h-2 rounded-full ${log.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                  <div>
                                                       <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{log.status}</p>
                                                       <p className="text-[10px] opacity-40 font-mono tracking-tighter uppercase">{new Date(log.time).toLocaleTimeString()}</p>
                                                  </div>
                                             </div>
                                             <div className="text-right">
                                                  <p className="text-xs font-black text-blue-600 dark:text-blue-400">Score: {log.score.toFixed(2)}</p>
                                                  <p className="text-[10px] opacity-60 uppercase font-bold">{log.band} RISK</p>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </section>
                    </div>
               </div>
          </div>
     );
}
