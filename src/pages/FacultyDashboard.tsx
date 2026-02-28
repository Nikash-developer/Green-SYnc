import React, { useState, useEffect, ReactNode } from 'react';
import { motion } from 'motion/react';
import { 
  Leaf, Search, Bell, LayoutDashboard, BookOpen, 
  TreePine, Settings, LogOut, FileText, CloudOff, 
  Zap, Plus, Download, ChevronRight, Users,
  CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { calculateImpact } from '../lib/utils';
import { Assignment } from '../types';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [impact, setImpact] = useState({ total_pages: 225 });

  useEffect(() => {
    fetch(`/api/assignments?faculty_id=${user?.id}`).then(res => res.json()).then(setAssignments);
  }, [user]);

  const stats = calculateImpact(impact.total_pages);

  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-20">
        <div className="p-8 flex items-center gap-2 text-slate-900">
          <Leaf className="text-primary w-8 h-8" />
          <span className="text-xl font-bold">Green-Sync</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Menu</p>
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<BookOpen size={20} />} label="Assignments" />
          <NavItem icon={<Users size={20} />} label="Courses" />
          <NavItem icon={<Bell size={20} />} label="Reports" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-bg-light transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
              <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Courses</span>
              <ChevronRight size={12} />
              <span>Env Science 101</span>
              <ChevronRight size={12} />
              <span className="text-primary">ASG 3: Urban Sustainability</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Assignment Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
              <Download size={18} /> Export Report
            </button>
            <button className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <Plus size={18} /> New Assignment
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard icon={<Users className="text-slate-400" />} label="Total Submissions" value="45" subValue="/ 50 Students" />
          <StatCard icon={<Clock className="text-orange-400" />} label="Pending Grading" value="12" subValue="High Priority" badge="High Priority" />
          <StatCard icon={<Leaf className="text-primary" />} label="Paper Saved" value="225" subValue="sheets" />
          <StatCard icon={<Zap className="text-blue-400" />} label="Water Saved" value="2,250 L" subValue="Equivalent to 45 showers" />
        </div>

        {/* Submissions Table */}
        <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-black">Submissions</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Search size={20} /></button>
              <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Settings size={20} /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-light/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Student</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { name: "Alice Johnson", date: "Oct 24, 2:30 PM", status: "Pending", grade: "-" },
                  { name: "Bob Smith", date: "Oct 24, 4:15 PM", status: "Graded", grade: "92 / 100" },
                  { name: "Charlie Brown", date: "Oct 25, 9:00 AM", status: "Late", grade: "-" },
                  { name: "Diana Prince", date: "Oct 24, 1:00 PM", status: "Graded", grade: "88 / 100" }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-bg-light/30 transition-colors cursor-pointer group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.name}`} alt="Avatar" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{row.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{row.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        row.status === 'Graded' ? 'bg-green-50 text-green-600' : 
                        row.status === 'Late' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-slate-900">
                      {row.grade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
      active ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-bg-light hover:text-slate-600'
    }`}>
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, subValue, badge }: { icon: React.ReactNode, label: string, value: string, subValue: string, badge?: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-primary/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {badge && <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900">{value}</h3>
          <span className="text-[10px] font-medium text-slate-400">{subValue}</span>
        </div>
      </div>
    </div>
  );
}
