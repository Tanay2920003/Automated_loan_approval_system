"use client";
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartProps {
     data: any[];
}

export function LoanChart({ data }: ChartProps) {
     return (
          <div className="glass-card p-6 h-[400px] w-full">
               <div className="flex justify-between items-center mb-8">
                    <div>
                         <h3 className="text-lg font-bold text-white tracking-tight">Financial Health Trend</h3>
                         <p className="text-xs text-gray-500 font-medium">Approval likelihood over time</p>
                    </div>
                    <div className="flex gap-2">
                         <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Predict Probability</span>
                         </div>
                    </div>
               </div>

               <div className="h-[280px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={data}>
                              <defs>
                                   <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                   </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis
                                   dataKey="time"
                                   axisLine={false}
                                   tickLine={false}
                                   tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                   dy={10}
                              />
                              <YAxis
                                   axisLine={false}
                                   tickLine={false}
                                   tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                   domain={[0, 1]}
                              />
                              <Tooltip
                                   contentStyle={{
                                        backgroundColor: 'rgba(5, 11, 24, 0.95)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        color: '#fff'
                                   }}
                              />
                              <Area
                                   type="monotone"
                                   dataKey="prob"
                                   stroke="#3b82f6"
                                   strokeWidth={3}
                                   fillOpacity={1}
                                   fill="url(#colorProb)"
                              />
                         </AreaChart>
                    </ResponsiveContainer>
               </div>
          </div>
     );
}
