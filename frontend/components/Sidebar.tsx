"use client";
import React from "react";
import { LayoutDashboard, FileText, BarChart3, MessageSquare, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
     { name: "Dashboard", icon: LayoutDashboard, href: "/" },
     { name: "Applications", icon: FileText, href: "/profile" },
     { name: "Analytics", icon: BarChart3, href: "/analytics" },
     { name: "AI Financial Advisor", icon: MessageSquare, href: "/chat" },
     { name: "Admin Stats", icon: ShieldCheck, href: "/admin" },
     { name: "Help & Docs", icon: HelpCircle, href: "/docs" },
];

export default function Sidebar() {
     const pathname = usePathname();

     return (
          <aside className="fixed left-0 top-0 h-screen w-64 bg-base border-r border-stroke hidden md:flex flex-col p-6 z-50">
               <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                         <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                         FinTech-Approve
                    </h1>
               </div>

               <nav className="flex-1 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Main Menu</p>
                    {navLinks.map((link) => {
                         const Icon = link.icon;
                         const isActive = pathname === link.href;
                         return (
                              <Link
                                   key={link.name}
                                   href={link.href}
                                   className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                                             ? "bg-glass-strong text-white shadow-soft border border-stroke"
                                             : "text-gray-400 hover:text-white hover:bg-glass"
                                        }`}
                              >
                                   <div className={`p-2 rounded-lg transition-colors ${isActive ? "bg-blue-600 text-white" : "bg-glass text-gray-400 group-hover:text-white"
                                        }`}>
                                        <Icon size={18} />
                                   </div>
                                   <span className="text-sm font-medium">{link.name}</span>
                              </Link>
                         );
                    })}
               </nav>

               <div className="mt-auto">
                    <div className="glass-card p-4 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                         <p className="text-xs font-bold text-gray-400 mb-1">Need help?</p>
                         <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">Check our API docs or ask the AI.</p>
                         <button className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/40">
                              Documentation
                         </button>
                    </div>
               </div>
          </aside>
     );
}
