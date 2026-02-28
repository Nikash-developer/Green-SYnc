import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Leaf, Search, Bell, LayoutDashboard, BookOpen,
  TreePine, Settings, LogOut, FileText, CloudOff,
  Zap, Plus, Download, ChevronRight, Users,
  CheckCircle2, Clock, AlertCircle, ArrowLeft, ArrowRight,
  Edit3, MessageSquare, Scissors, Type, Maximize2,
  MoreVertical, Filter, SortDesc, Folder, ClipboardList, Droplets, User, X
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import FacultyNotices from './FacultyNotices';

export default function FacultyDashboard() {
  const { user, logout } = useAuth();

  // Navigation State
  const [activeNav, setActiveNav] = useState("Notices");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Environmental Stats State
  const [stats, setStats] = useState({
    total: 45,
    pending: 12,
    pages: 225,
    water: 2250
  });

  // Students Data State
  const [students, setStudents] = useState([
    { id: 1, name: "Alice Johnson", date: "Oct 24, 2:30 PM", status: "Pending", grade: "- / 100", rubric: { research: 28, clarity: 25, grammar: 18, relevance: 20 }, feedback: "Excellent work on integrating the sustainability concepts. Your analysis of urban density could be expanded slightly in the next assignment." },
    { id: 2, name: "Bob Smith", date: "Oct 24, 4:15 PM", status: "Graded", grade: "92 / 100", rubric: { research: 29, clarity: 26, grammar: 17, relevance: 20 }, feedback: "Great points made." },
    { id: 3, name: "Charlie Brown", date: "Oct 25, 9:00 AM", status: "Late", grade: "- / 100", rubric: { research: 20, clarity: 20, grammar: 15, relevance: 15 }, feedback: "" },
    { id: 4, name: "Diana Prince", date: "Oct 24, 1:00 PM", status: "Graded", grade: "88 / 100", rubric: { research: 26, clarity: 25, grammar: 18, relevance: 19 }, feedback: "Solid arguments." },
    { id: 5, name: "Evan Wright", date: "Oct 24, 3:45 PM", status: "Pending", grade: "- / 100", rubric: { research: 0, clarity: 0, grammar: 0, relevance: 0 }, feedback: "" },
    { id: 6, name: "Fiona Gallagher", date: "Oct 24, 2:10 PM", status: "Graded", grade: "95 / 100", rubric: { research: 30, clarity: 28, grammar: 19, relevance: 18 }, feedback: "Outstanding." }
  ]);

  const [activeStudentId, setActiveStudentId] = useState(1);
  const activeStudent = students.find(s => s.id === activeStudentId) || students[0];

  // Grading State for active student
  const [rubric, setRubric] = useState(activeStudent.rubric);
  const [feedback, setFeedback] = useState(activeStudent.feedback);
  const totalScore = rubric.research + rubric.clarity + rubric.grammar + rubric.relevance;

  // Document UI State
  const [zoom, setZoom] = useState(100);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [hasHighlight, setHasHighlight] = useState(true);
  const feedbackEditorRef = useRef<HTMLDivElement>(null);

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
    if (feedbackEditorRef.current) {
      setFeedback(feedbackEditorRef.current.innerHTML);
    }
  };

  // Sync grading state when active student changes
  useEffect(() => {
    setRubric(activeStudent.rubric);
    setFeedback(activeStudent.feedback);
    setHasHighlight(activeStudent.status !== 'Pending');
  }, [activeStudentId]);

  // Actions
  const handleShowToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDraft = () => {
    setStudents(prev => prev.map(s => s.id === activeStudentId ? { ...s, rubric, feedback } : s));
    handleShowToast("Draft saved successfully");
  };

  const handleSubmitGrade = () => {
    if (activeStudent.status === 'Graded') return;

    setStudents(prev => prev.map(s =>
      s.id === activeStudentId ? { ...s, status: 'Graded', grade: `${totalScore} / 100`, rubric, feedback } : s
    ));

    setStats(prev => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      pages: prev.pages + 5,
      water: prev.water + 50
    }));

    handleShowToast(`Grade for ${activeStudent.name} submitted successfully!`);
  };

  const handleExport = () => {
    handleShowToast("Exporting report as PDF...");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans"
    >
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-12 flex-1 max-w-4xl">
          <div className="flex items-center gap-2 shrink-0">
            <Leaf className="text-[#22C55E] w-6 h-6" />
            <span className="text-xl font-black text-slate-900">Green-Sync</span>
          </div>
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              onKeyDown={(e) => e.key === 'Enter' && handleShowToast(`Searching for "${(e.target as HTMLInputElement).value}"...`)}
              className="w-full bg-[#F8FAF9] border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#DCFCE7] transition-all"
            />
          </div>
        </div>
        <nav className="flex items-center gap-8 relative">
          {['Notices', 'Assignments'].map(nav => (
            <button
              key={nav}
              onClick={() => setActiveNav(nav)}
              className={`text-sm font-bold transition-colors relative py-1 ${activeNav === nav ? 'text-[#22C55E]' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {nav}
              {activeNav === nav && (
                <motion.div layoutId="navUnderline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#22C55E] rounded-full" />
              )}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#F8FAF9] text-slate-600 border border-[#E5E7EB] text-sm font-bold rounded-xl hover:bg-[#DCFCE7] hover:text-[#22C55E] hover:border-[#DCFCE7] transition-all duration-300">
            <LogOut size={16} /> Log Out
          </button>
          <div className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform flex items-center justify-center relative z-50">
              <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "prof"}`} alt="Avatar" />
            </div>
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="font-bold text-slate-900">{user?.name || "Professor"}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user?.role || "Faculty"}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button onClick={() => { setShowProfileMenu(false); handleShowToast("Profile context opened"); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-sm font-bold text-slate-700">
                        <User size={16} /> Edit Profile
                      </button>
                      <button onClick={() => { setShowProfileMenu(false); handleShowToast("Settings context opened"); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-sm font-bold text-slate-700">
                        <Settings size={16} /> Settings
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Conditional Content rendering */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeNav === 'Assignments' ? (
            <motion.main
              key="assignments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 max-w-[1600px] w-full mx-auto p-8 flex flex-col gap-8 pb-12 overflow-y-auto h-full styled-scrollbar"
            >
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="cursor-pointer hover:text-slate-600 transition-colors">Courses</span>
                  <ChevronRight size={12} />
                  <span className="cursor-pointer hover:text-slate-600 transition-colors">Env Science 101</span>
                  <ChevronRight size={12} />
                  <span className="text-slate-900">ASG 3: Urban Sustainability</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Assignment Management</h1>
                    <p className="text-slate-500 font-medium">Manage submissions, grade papers, and track the environmental impact of digital submissions for "Introduction to Environmental Science".</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 mt-2 md:mt-0">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E7EB] text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm group">
                      <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Export Report
                    </button>
                    <button
                      onClick={() => setShowNewAssignmentModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-[#22C55E] hover:bg-[#16a34a] text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-[#22C55E]/20 group">
                      <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Assignment
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<FileText className="text-blue-500" />} title="Total Submissions" value={stats.total} suffix="Target: 50" progress={90} delay={0.1} />
                <StatCard icon={<Clock className="text-amber-500" />} title="Pending Grading" value={stats.pending} badge="Urgent" delay={0.2} suffixColor="text-amber-600" />
                <StatCard icon={<TreePine className="text-[#22C55E]" />} title="Paper Saved" value={stats.pages} suffix="sheets" progress={75} delay={0.3} />
                <StatCard icon={<Droplets className="text-cyan-500" />} title="Water Saved" value={stats.water} suffix="liters" progress={60} delay={0.4} />
              </div>

              <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Panel: Submissions List */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="xl:col-span-3 bg-white rounded-[2.5rem] border border-[#E5E7EB] flex flex-col shadow-sm overflow-hidden h-[calc(100vh-420px)] min-h-[500px]"
                >
                  <div className="p-6 border-b border-slate-100 bg-white z-10 sticky top-0">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-black text-slate-900">Submissions</h2>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleShowToast("Filter options coming soon")} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"><Filter size={16} /></button>
                        <button onClick={() => handleShowToast("Sorting options coming soon")} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"><SortDesc size={16} /></button>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" placeholder="Search student..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#DCFCE7] transition-all" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto styled-scrollbar">
                    {students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setActiveStudentId(student.id)}
                        className={`w-full p-5 flex items-start gap-4 transition-all border-b border-slate-50 last:border-none relative group ${activeStudentId === student.id ? 'bg-[#F0FDF4]' : 'hover:bg-slate-50'}`}
                      >
                        {activeStudentId === student.id && (
                          <motion.div layoutId="activeStudentHighlight" className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#22C55E] rounded-r-full" />
                        )}
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt="Avatar" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className={`text-sm font-bold truncate ${activeStudentId === student.id ? 'text-[#166534]' : 'text-slate-900'}`}>{student.name}</p>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${student.status === 'Graded' ? 'bg-green-100 text-green-700' : student.status === 'Late' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                              {student.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mb-2">{student.date}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600">{student.grade}</span>
                            {student.status === 'Graded' && <CheckCircle2 size={12} className="text-[#22C55E]" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Center Panel: Document Viewer */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="xl:col-span-6 bg-white rounded-[2.5rem] border border-[#E5E7EB] shadow-sm flex flex-col h-[calc(100vh-420px)] min-h-[500px] overflow-hidden"
                >
                  <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setZoom(prev => Math.max(50, prev - 10))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><Scissors size={16} className="text-slate-400" /></button>
                        <span className="text-xs font-black text-slate-900 tabular-nums w-10 text-center">{zoom}%</span>
                        <button onClick={() => setZoom(prev => Math.min(200, prev + 10))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><Maximize2 size={16} className="text-slate-400" /></button>
                      </div>
                      <div className="w-px h-6 bg-slate-100" />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsHighlighting(!isHighlighting)}
                          className={`p-2 rounded-xl transition-all flex items-center gap-2 px-3 ${isHighlighting ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/20' : 'hover:bg-slate-50 text-slate-400'}`}
                        >
                          <Type size={16} />
                          <span className="text-xs font-bold">Highlight</span>
                        </button>
                        <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all flex items-center gap-2 px-3">
                          <MessageSquare size={16} />
                          <span className="text-xs font-bold">Comment</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Plus size={16} className="text-slate-300 cursor-pointer hover:text-slate-600" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 flex justify-center styled-scrollbar">
                    <motion.div
                      key={activeStudentId}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-16 shadow-2xl rounded-sm w-full max-w-[800px] min-h-[1000px] h-fit relative transform-gpu origin-top"
                      style={{ scale: zoom / 100 }}
                    >
                      <div className="mb-12 border-b border-slate-100 pb-8">
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Urban Sustainability & Green Spaces</h2>
                        <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeStudent.name}`} alt="sc" />
                          </div>
                          <span>{activeStudent.name}</span>
                          <span className="text-slate-300">•</span>
                          <span>ENV-101 Section B</span>
                        </div>
                      </div>

                      <div className="space-y-6 text-slate-700 leading-relaxed text-lg font-medium selection:bg-[#DCFCE7] selection:text-[#166534]">
                        <p>Building sustainable urban environments requires a multi-faceted approach to resource management and community engagement. Traditional urban planning often neglects the critical role that biodiversified green corridors play in mitigating the "urban heat island" effect.</p>

                        <p className={hasHighlight ? "bg-yellow-100/60 rounded px-1 transition-colors" : ""}>
                          Our research indicates that cities with at least 30% canopy cover experience average summer temperatures 4.5 degrees lower than their less-vegetated counterparts. This reduction in temperature directly leads to lower energy demands for cooling systems, primarily HVAC units.
                        </p>

                        <p>Furthermore, the integration of permeable surfaces in urban design significantly reduces storm-water runoff, which in metropolitan areas frequently leads to localized flooding and the contamination of local water bodies with untreated urban pollutants.</p>

                        <div className="my-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm"><FileText size={20} className="text-[#22C55E]" /></div>
                            <div>
                              <p className="text-xs font-black text-slate-900">dataset_urban_emissions.csv</p>
                              <p className="text-[10px] text-slate-400 font-bold">Attached Analysis Target</p>
                            </div>
                          </div>
                          <button className="text-xs font-black text-slate-400 hover:text-[#22C55E] transition-colors uppercase tracking-widest">View Data</button>
                        </div>

                        <p>Community gardens and localized urban agriculture represent another tier of the green revolution. These initiatives don't just provide fresh produce to "food deserts", but also act as social focal points that strengthen community bonds and resilience.</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Right Panel: Grading & Rubric */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="xl:col-span-3 space-y-8 h-[calc(100vh-420px)] min-h-[500px] overflow-y-auto styled-scrollbar pr-2"
                >
                  <div className="bg-white rounded-[2.5rem] border border-[#E5E7EB] shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-lg font-black text-slate-900">Grading</h2>
                      <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-slate-900 tabular-nums">{totalScore}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Score</span>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <InteractiveRubricSlider label="Research Quality" val={rubric.research} max={30} onChange={(v) => setRubric({ ...rubric, research: v })} />
                      <InteractiveRubricSlider label="Clarity & Logic" val={rubric.clarity} max={30} onChange={(v) => setRubric({ ...rubric, clarity: v })} />
                      <InteractiveRubricSlider label="Grammar & Style" val={rubric.grammar} max={20} onChange={(v) => setRubric({ ...rubric, grammar: v })} />
                      <InteractiveRubricSlider label="Topic Relevance" val={rubric.relevance} max={20} onChange={(v) => setRubric({ ...rubric, relevance: v })} />
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Feedback Note</label>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleFormat('bold')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Bold"><Edit3 size={14} /></button>
                          <button onClick={() => handleFormat('italic')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Italic"><Type size={14} /></button>
                        </div>
                      </div>
                      <div
                        ref={feedbackEditorRef}
                        contentEditable
                        onInput={(e) => setFeedback(e.currentTarget.innerHTML)}
                        placeholder="Type your final feedback here..."
                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#DCFCE7] transition-all text-sm font-medium text-slate-700 min-h-[120px] max-h-[120px] overflow-y-auto styled-scrollbar empty:before:content-[attr(placeholder)] empty:before:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: feedback }}
                      />
                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={handleSaveDraft}
                          className="flex-1 py-3.5 bg-white border border-[#E5E7EB] text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                          Save Draft
                        </button>
                        <button
                          onClick={handleSubmitGrade}
                          disabled={activeStudent.status === 'Graded' && totalScore === parseInt(activeStudent.grade)}
                          className="flex-1 py-3.5 bg-[#22C55E] hover:bg-[#16a34a] disabled:bg-[#A7F3D0] disabled:cursor-not-allowed text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-[#22C55E]/30 active:scale-95 group relative overflow-hidden"
                        >
                          <span className="relative z-10 transition-transform block group-active:translate-y-0.5">
                            {activeStudent.status === 'Graded' ? 'Update Grade' : 'Submit Grade'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.main>
          ) : activeNav === 'Notices' ? (
            <motion.div
              key="notices"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 h-full overflow-hidden"
            >
              <FacultyNotices />
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                key="other-module"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-[#DCFCE7] text-[#22C55E] mx-auto rounded-3xl flex items-center justify-center mb-6">
                  <Settings size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">{activeNav} Module</h2>
                <p className="text-slate-500 font-medium">This module is currently being optimized for your experience.</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Global CSS injected components styling */}
      <style>{`
        .styled-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .styled-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .styled-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        
        /* Custom Range Slider */
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: white; border: 3px solid #22C55E; cursor: pointer; margin-top: -6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); transition: transform 0.1s, box-shadow 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.15); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: #F1F5F9; border-radius: 10px; }
      `}</style>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] bg-white text-slate-900 border border-[#E5E7EB] shadow-2xl px-6 py-4 rounded-xl flex items-center gap-3 font-bold text-sm"
          >
            <div className="w-6 h-6 bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center rounded-full shrink-0">
              <CheckCircle2 size={14} />
            </div>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Assignment Modal */}
      <AnimatePresence>
        {showNewAssignmentModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowNewAssignmentModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900">Create New Assignment</h2>
                <button onClick={() => setShowNewAssignmentModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Assignment Title</label>
                  <input type="text" placeholder="e.g. Midterm Report" className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#DCFCE7] focus:border-[#22C55E] font-bold text-slate-900 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Course</label>
                    <select className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#DCFCE7] focus:border-[#22C55E] font-bold text-slate-900 transition-all appearance-none">
                      <option>Env Science 101</option>
                      <option>Geology 201</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Due Date</label>
                    <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#DCFCE7] focus:border-[#22C55E] font-bold text-slate-900 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                  <textarea placeholder="Describe the assignment details..." className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#DCFCE7] focus:border-[#22C55E] font-medium text-slate-700 h-28 resize-none transition-all" />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button onClick={() => setShowNewAssignmentModal(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button onClick={() => { setShowNewAssignmentModal(false); handleShowToast("New Assignment Created Successfully!"); }} className="px-6 py-3 bg-[#22C55E] text-white font-black rounded-xl hover:bg-[#16a34a] shadow-lg shadow-[#22C55E]/30 transition-all">Publish Assignment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <LogOut size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Log Out?</h2>
              <p className="text-slate-500 font-medium mb-8">Are you sure you want to end your session?</p>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3.5 font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={logout} className="flex-1 py-3.5 bg-red-500 text-white font-black hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition-all">Log Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Sub-components
function StatCard({ icon, title, value, suffix, badge, progress, delay, suffixColor = "text-slate-500" }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" }}
      className="bg-white p-6 rounded-[2rem] border border-[#E5E7EB] flex flex-col gap-3 shadow-sm transition-all relative h-[160px] group overflow-hidden"
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <motion.h3
              key={value}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl leading-none font-black text-slate-900 tracking-tight"
            >
              {value}
            </motion.h3>
          </div>
        </div>
        <div className="shrink-0 bg-slate-50 p-2.5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>

      <div className="flex justify-between items-center mt-auto relative z-10">
        <span className={`text-xs font-bold ${suffixColor} ${badge ? 'bg-amber-100/50 text-amber-700 px-3 py-1 rounded-full text-[10px] animate-pulse border border-amber-200/50' : ''}`}>
          {badge || suffix}
        </span>
      </div>
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden relative z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeOut" }}
            className="h-full bg-[#22C55E] rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
}

function InteractiveRubricSlider({ label, val, max, onChange }: { label: string, val: number, max: number, onChange: (v: number) => void }) {
  const percent = (val / max) * 100;

  return (
    <div className="space-y-3 group">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-700 transition-colors group-hover:text-slate-900">{label}</span>
        <span className="text-[#22C55E] tabular-nums bg-[#DCFCE7] px-2 py-0.5 rounded-md">{val} <span className="text-slate-400 font-medium">/ {max}</span></span>
      </div>
      <div className="relative">
        <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full pointer-events-none" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#22C55E] rounded-full pointer-events-none transition-all duration-75"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min="0"
          max={max}
          value={val}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full relative z-10 opacity-0 cursor-pointer h-6"
        />
      </div>
    </div>
  );
}
