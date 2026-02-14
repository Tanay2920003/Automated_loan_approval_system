"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

type HistoryItem = {
     timestamp: string;
     loan_approval: string;
     approval_probability: number;
     input_data: any;
     risk_drivers: any[];
};

export default function ProfilePage() {
     const [profile, setProfile] = useState<any>(null);
     const [loading, setLoading] = useState(true);
     const router = useRouter();

     useEffect(() => {
          const fetchProfile = async () => {
               const token = localStorage.getItem('token');
               if (!token) {
                    router.push('/login');
                    return;
               }

               try {
                    const res = await fetch('/api/v1/user/profile', {
                         headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('Failed to fetch profile');
                    const data = await res.json();
                    setProfile(data);
               } catch (err) {
                    localStorage.removeItem('token');
                    router.push('/login');
               } finally {
                    setLoading(false);
               }
          };

          fetchProfile();
     }, [router]);

     if (loading) return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
     );

     return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-6 py-12">
               <div className="max-w-5xl mx-auto">
                    <header className="flex justify-between items-end mb-12 border-b border-gray-200 dark:border-gray-800 pb-8">
                         <div>
                              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                   Financial Profile
                              </h1>
                              <p className="text-gray-500 dark:text-gray-400">
                                   Welcome back, <span className="text-blue-600 font-semibold">{profile.user.full_name}</span>
                              </p>
                         </div>
                         <button
                              onClick={() => router.push('/')}
                              className="bg-white dark:bg-gray-800 px-6 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                         >
                              New Application
                         </button>
                    </header>

                    <section>
                         <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                              📜 Application History
                              <span className="text-sm font-normal bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                   {profile.application_history.length} total
                              </span>
                         </h2>

                         <div className="space-y-4">
                              {profile.application_history.map((item: HistoryItem, idx: number) => (
                                   <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                   >
                                        <div>
                                             <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest font-bold">
                                                  {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                             </p>
                                             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                                  Loan for ₹{item.input_data.loan_amount.toLocaleString()}
                                             </h3>
                                             <p className="text-sm opacity-70">Term: {item.input_data.loan_term} years | CIBIL: {item.input_data.cibil_score}</p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                             <div className="text-right">
                                                  <p className="text-xs opacity-60 mb-1 leading-none">Status</p>
                                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.loan_approval === 'Approved'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                                       }`}>
                                                       {item.loan_approval.toUpperCase()}
                                                  </span>
                                             </div>

                                             <div className="text-right">
                                                  <p className="text-xs opacity-60 mb-1 leading-none">Confidence</p>
                                                  <span className="text-lg font-bold">{(item.approval_probability * 100).toFixed(0)}%</span>
                                             </div>
                                        </div>
                                   </motion.div>
                              ))}

                              {profile.application_history.length === 0 && (
                                   <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                                        <p className="text-gray-400">No applications found yet.</p>
                                        <button
                                             onClick={() => router.push('/')}
                                             className="mt-4 text-blue-600 font-bold hover:underline"
                                        >
                                             Start your first prediction →
                                        </button>
                                   </div>
                              )}
                         </div>
                    </section>

                    <footer className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500">
                         <button
                              onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                              className="text-red-500 font-bold hover:underline"
                         >
                              Logout session
                         </button>
                    </footer>
               </div>
          </div>
     );
}
