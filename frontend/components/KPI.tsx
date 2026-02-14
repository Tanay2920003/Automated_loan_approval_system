"use client";
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPIProps {
     title: string;
     value: string | number;
     delta: string;
     isPositive?: boolean;
     icon: React.ReactNode;
}

export function KPI({ title, value, delta, isPositive = true, icon }: KPIProps) {
     return (
          <div className="glass-card p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
               <div className="flex justify-between items-start">
                    <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
                         <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                         <div className="flex items-center gap-1 mt-2">
                              {isPositive ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                              <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                   {delta}
                              </span>
                              <span className="text-[10px] text-gray-500 font-medium ml-1">since last month</span>
                         </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                         {icon}
                    </div>
               </div>

               {/* Background Decorative Element */}
               <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600/5 blur-3xl rounded-full" />
          </div>
     );
}
