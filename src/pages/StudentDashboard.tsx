import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Leaf, Search, Bell, LayoutDashboard, BookOpen,
  TreePine, Settings, LogOut, FileText, CloudOff,
  Zap, AlertCircle, Megaphone, Trophy,
  GraduationCap, Calculator, Code, FileDown,
  User, Shield, BellRing, Palette, HelpCircle,
  Clock, CheckCircle2, ChevronRight, MessageSquare,
  Send, X, Sparkles, FileQuestion, ExternalLink,
  Upload, File, ChevronLeft, Camera, ShieldAlert,
  Sun, Moon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import confetti from 'canvas-confetti';
import CountUp from 'react-countup';
import { useAuth } from '../AuthContext';
import { calculateImpact } from '../lib/utils';
import { Notice, Assignment } from '../types';

import { AssignmentSubmissionView } from '../components/AssignmentSubmissionView';

type Tab = 'dashboard' | 'courses' | 'eco-tracker' | 'settings' | 'papers' | 'assignment-submission';

interface QuestionPaper {
  id: number;
  subject: string;
  year: string;
  semester: string;
  type: 'Regular' | 'KT';
  url: string;
}

interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  color: string;
  icon: React.ReactNode;
  syllabus: string[];
  semester: number;
}

interface AssignmentWithFile extends Assignment {
  uploadedFile?: File;
}

// Sub-components
const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, trend: string, color: string, isNumeric?: boolean }> = ({ icon, label, value, trend, color, isNumeric }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-slate-200/50"
  >
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-[#E7F5ED] rounded-2xl text-[#2B8A3E] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] font-bold bg-[#E7F5ED] text-[#2B8A3E] px-3 py-1 rounded-full">{trend}</span>
    </div>
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-4xl font-black text-slate-900">
        {isNumeric && typeof value === 'number' ? <CountUp end={value} duration={2.5} separator="," /> : value}
      </h3>
    </div>
  </motion.div>
);

const NoticeItem: React.FC<{ notice: Notice & { read?: boolean } }> = ({ notice }) => (
  <div className="relative">
    {!notice.read && !notice.is_emergency && (
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} className="absolute -left-px top-6 bottom-6 w-1.5 bg-[#2B8A3E] rounded-r-full z-10" />
    )}
    <motion.div
      className={`p-6 rounded-2xl border transition-[transform,shadow,border-color,background-color] duration-500 cursor-pointer overflow-hidden relative ${notice.is_emergency
        ? 'bg-red-50 border-red-100'
        : !notice.read ? 'bg-[#E7F5ED] border-[#8CE09F]/50' : 'bg-[#F8F9FA] border-slate-100 hover:border-[#8CE09F]/50'
        }`}
    >
      <div className={`flex gap-5 ${notice.is_emergency ? 'mt-4' : ''}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notice.is_emergency ? 'bg-red-100 text-red-600' : 'bg-white text-[#2B8A3E] shadow-sm'
          }`}>
          {notice.is_emergency ? <AlertCircle size={24} /> : <Megaphone size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`font-bold truncate ${!notice.read ? 'text-slate-900' : 'text-slate-700'}`}>{notice.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold whitespace-nowrap ml-2 ${notice.is_emergency ? 'text-red-500' : 'text-slate-400'}`}>
                {notice.is_emergency ? '10 mins ago' : '1 hour ago'}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mb-3">{notice.content}</p>
          {notice.id === 2 && (
            <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 group/file transition-all hover:bg-slate-50">
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
                <FileDown size={16} />
              </div>
              <span className="text-xs font-bold text-slate-600 group-hover/file:text-[#2B8A3E] transition-colors">Recycling_Drive_Info_Packet.pdf</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </div>
);

const AssignmentItem: React.FC<{
  assignment: AssignmentWithFile,
  onRemind: () => void,
  onAction: (action: 'submit' | 'start') => void,
  onDetails: () => void,
  onUpload: (file: File) => void,
  isActive: boolean,
  timeLeft?: string
}> = ({ assignment, onRemind, onAction, onDetails, onUpload, isActive, timeLeft }) => {
  const isUrgent = assignment.id === 2;
  const isSubmitted = assignment.status === 'submitted';
  const isInProgress = assignment.status === 'in-progress';
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onDetails}
      className={`flex items-center gap-5 p-6 rounded-2xl border transition-[transform,shadow] duration-300 group cursor-pointer ${isSubmitted ? 'bg-green-50/50 border-green-100' : 'bg-[#F8F9FA] border-slate-100 hover:shadow-md hover:border-slate-200'
        }`}
    >
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200" />
          <circle
            cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={isSubmitted ? "100, 100" : isUrgent ? "25, 100" : "75, 100"}
            className={isSubmitted ? "text-green-500" : isUrgent ? "text-red-500" : "text-primary"}
          />
        </svg>
        <div className="absolute text-[10px] font-black text-slate-700 text-center leading-tight">
          {isSubmitted ? 'Done' : assignment.id === 1 ? '2\nDays' : assignment.id === 2 ? '4\nHrs' : '5\nDays'}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold truncate group-hover:text-primary transition-colors ${isSubmitted ? 'text-green-700' : 'text-slate-900'}`}>{assignment.title}</h4>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {assignment.subject} • {assignment.department}
            {isActive && <span className="ml-2 text-primary animate-pulse font-black">({timeLeft})</span>}
          </p>
          {assignment.uploadedFile && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md w-fit">
              <File size={10} />
              <span>{assignment.uploadedFile.name}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}
          className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
        >
          Details
        </button>
        {!isSubmitted && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className={`p-2.5 rounded-xl border transition-all ${assignment.uploadedFile
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-white border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30'
                }`}
              title="Upload PDF"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemind();
              }}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-primary hover:border-primary/30 transition-all"
              title="Remind me later"
            >
              <Clock size={18} />
            </button>
          </>
        )}
        <button
          disabled={isSubmitted || (assignment.id === 1 && !assignment.uploadedFile)}
          onClick={(e) => {
            e.stopPropagation();
            if (isSubmitted) return;
            onAction(assignment.id === 1 ? 'submit' : 'start');
          }}
          className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg ${isSubmitted
            ? 'bg-green-100 text-green-600 shadow-none cursor-default'
            : isInProgress
              ? 'bg-primary text-white shadow-primary/20'
              : assignment.id === 1
                ? 'bg-[#82C91E] hover:bg-[#74B816] text-white shadow-[#82C91E]/20 disabled:opacity-50 disabled:cursor-not-allowed'
                : assignment.id === 2
                  ? 'bg-[#51CF66] hover:bg-[#40C057] text-white shadow-[#51CF66]/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-none'
            }`}
        >
          {isSubmitted ? 'Submitted' : isInProgress ? 'In Progress' : assignment.id === 1 ? 'Submit' : assignment.id === 2 ? 'Start' : 'Submit'}
        </button>
      </div>
    </motion.div>
  );
};

const ReminderModal: React.FC<{ onClose: () => void, onSet: (time: string) => void }> = ({ onClose, onSet }) => {
  const [customTime, setCustomTime] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8"
      >
        <h3 className="text-xl font-black mb-2">Set Reminder</h3>
        <p className="text-sm text-slate-500 mb-6">When should we remind you about this assignment?</p>

        <div className="space-y-3">
          {!showCustom ? (
            <>
              {['In 1 hour', 'In 4 hours', 'Tomorrow morning'].map((time) => (
                <button
                  key={time}
                  onClick={() => onSet(time)}
                  className="w-full p-4 text-left font-bold text-slate-700 bg-slate-50 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all border border-transparent hover:border-primary/20"
                >
                  {time}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(true)}
                className="w-full p-4 text-left font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-dashed border-slate-200"
              >
                Custom time...
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600"
                >
                  Back
                </button>
                <button
                  disabled={!customTime}
                  onClick={() => onSet(new Date(customTime).toLocaleString())}
                  className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Set Custom Reminder
                </button>
              </div>
            </div>
          )}
        </div>

        {!showCustom && (
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </motion.div>
    </div>
  );
};

const AIAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hi there! I'm your Green-Sync assistant. I can help you find courses, check your eco-impact, or find question papers. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model,
        contents: `You are a helpful assistant for a student dashboard called Green-Sync. 
        The site has these tabs: Dashboard (overview), Courses (enrolled classes), Eco-Impact (environmental stats), Question Papers (MU previous papers), and Settings.
        The user says: ${userMsg}`,
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now. Try navigating using the top menu!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-end p-8 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden pointer-events-auto h-[600px]"
      >
        <div className="p-6 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm">Green-Sync AI</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Always Online</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${msg.role === 'user'
                ? 'bg-primary text-white rounded-tr-none'
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const LeaderboardItem: React.FC<{ rank: number, name: string, score: string, icon: React.ReactNode, active?: boolean }> = ({ rank, name, score, icon, active = false }) => (
  <motion.div
    whileHover={{ x: 5 }}
    className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${active ? 'bg-[#E7F5ED] border border-[#D1EAD9]' : 'hover:bg-[#F8F9FA]'
      }`}
  >
    <div className={`font-black text-lg w-6 text-center ${active ? 'text-[#2B8A3E]' : 'text-slate-300'}`}>{rank}</div>
    <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-50">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-bold text-sm text-slate-900">{name}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{score}</p>
    </div>
    {active && <Trophy className="text-[#2B8A3E] w-5 h-5" />}
  </motion.div>
);

const CustomDropdown: React.FC<{
  options: string[],
  value: string,
  onChange: (val: string) => void,
  label?: string
}> = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative min-w-[160px]">
      {label && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</p>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center justify-between hover:border-primary/30 transition-all shadow-sm"
      >
        <span className="truncate">{value}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={16} className="rotate-90 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 z-[70] bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto scrollbar-hide"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-slate-50 ${value === opt ? 'text-primary bg-primary/5' : 'text-slate-600'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const CourseCard: React.FC<{ course: Course, onClick: () => void }> = ({ course, onClick }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    pink: 'bg-pink-500'
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group cursor-pointer hover:shadow-xl transition-all"
    >
      <div className={`w-12 h-12 ${colors[course.color]} rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg shadow-${course.color}-500/20`}>
        {course.icon}
      </div>
      <h3 className="text-xl font-black mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
      <p className="text-sm text-slate-400 font-bold mb-6">{course.instructor}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Progress</span>
          <span>{course.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full ${colors[course.color]}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const ImpactMetric: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => {
  const colors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <p className="text-sm font-bold text-slate-600">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full`} style={{ width: value }} />
      </div>
    </div>
  );
};

const SettingsOption: React.FC<{
  icon: React.ReactNode,
  label: string,
  description: string,
  onClick?: () => void
}> = ({ icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-6 hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-0"
  >
    <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:scale-110">
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    </div>
    <div className="text-left flex-1">
      <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{label}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
    <ChevronRight className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" size={20} />
  </button>
);

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [impact, setImpact] = useState({ total_pages: 1240 });
  const [showAllNotices, setShowAllNotices] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [reminderModal, setReminderModal] = useState<{ isOpen: boolean, assignmentId: number | null }>({ isOpen: false, assignmentId: null });
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithFile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSemesters, setShowSemesters] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showUploadPaper, setShowUploadPaper] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [selectedPaperSemester, setSelectedPaperSemester] = useState<string>('All Semesters');
  const [selectedPaperYear, setSelectedPaperYear] = useState<string>('All Years');
  const [searchQuery, setSearchQuery] = useState('');
  const [paperSearchQuery, setPaperSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithFile[]>([]);
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'main' | 'profile' | 'notifications' | 'security' | 'appearance' | 'help'>('main');

  const [studentProfile, setStudentProfile] = useState({
    name: user?.name || 'Nikash Developer',
    email: user?.email || 'student@greensync.edu',
    phone: '+91 98765 43210',
    dept: 'Computer Engineering',
    year: 'TE-Sem 6',
    avatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikash'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    assignmentAlerts: true,
    ecoMilestones: true,
    paperUploads: false,
    securityAlerts: true,
    emailBriefing: true
  });

  const [themeMode, setThemeMode] = useState<'Light' | 'Dark' | 'Eco'>('Light');
  const [saveStatus, setSaveStatus] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number>(0);

  useEffect(() => {
    // Reset settings sub-tab when leaving settings tab
    if (activeTab !== 'settings') {
      setSettingsSubTab('main');
    }
  }, [activeTab]);

  useEffect(() => {
    if (themeMode === 'Eco' || themeMode === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeAssignmentId && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setActiveAssignmentId(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeAssignmentId, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    // Simulated API calls
    const mockNotices: Notice[] = [
      {
        id: 1,
        title: 'Urgent: Biology 101 Deadline Extended',
        content: 'Paperless submission deadline extended by 2 hours due to server maintenance. Please submit by 4:00 PM.',
        publish_date: new Date(Date.now() - 10 * 60000).toISOString(),
        is_emergency: true,
        target_department: 'Biology',
        author_id: 1,
        image_url: 'https://picsum.photos/seed/biology/800/400'
      },
      {
        id: 2,
        title: 'Green Council Announcement',
        content: 'Campus-wide recycling drive starts tomorrow at the Student Center. Bring your e-waste!',
        publish_date: new Date(Date.now() - 60 * 60000).toISOString(),
        is_emergency: false,
        target_department: 'General',
        author_id: 1,
        image_url: 'https://picsum.photos/seed/recycle/800/400'
      }
    ];

    const mockAssignments: AssignmentWithFile[] = [
      {
        id: 1,
        title: 'Sustainable Architecture Essay',
        description: 'Write a comprehensive essay on the principles of sustainable architecture and its impact on modern urban planning.',
        subject: 'Environmental Science 204',
        department: 'Prof. Miller',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60000).toISOString(),
        max_marks: 100,
        faculty_id: 1,
        status: 'pending'
      },
      {
        id: 2,
        title: 'Calculus Midterm Prep',
        description: 'Solve the practice set for the upcoming midterm covering integration and series.',
        subject: 'Math 101',
        department: 'Prof. Davis',
        deadline: new Date(Date.now() + 4 * 60 * 60000).toISOString(),
        max_marks: 100,
        faculty_id: 1,
        status: 'pending'
      },
      {
        id: 3,
        title: 'History Research Paper',
        description: 'Research and write about the impact of the Industrial Revolution on social structures.',
        subject: 'History 304',
        department: 'Dr. Evans',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60000).toISOString(),
        max_marks: 100,
        faculty_id: 1,
        status: 'pending'
      },
      {
        id: 4,
        title: 'Database Schema Design',
        description: 'Create an ER diagram and normalized schema for a university management system.',
        subject: 'DBMS 202',
        department: 'Prof. Wilson',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60000).toISOString(),
        max_marks: 50,
        faculty_id: 2,
        status: 'pending'
      },
      {
        id: 5,
        title: 'React Component Lifecycle',
        description: 'Implement a complex dashboard using React hooks and lifecycle methods.',
        subject: 'Web Dev 301',
        department: 'Dr. Smith',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60000).toISOString(),
        max_marks: 75,
        faculty_id: 3,
        status: 'pending'
      }
    ];

    const mockPapers: QuestionPaper[] = [
      { id: 1, subject: 'Applied Mathematics-III', year: '2023', semester: 'Semester 3', type: 'Regular', url: 'https://muquestionpapers.com/FE/Sem1/Applied_Mathematics_1_Dec_2023.pdf' },
      { id: 2, subject: 'Data Structures & Algorithms', year: '2023', semester: 'Semester 3', type: 'Regular', url: 'https://muquestionpapers.com/SE/COMP/Sem3/Data_Structures_Dec_2023.pdf' },
      { id: 3, subject: 'Digital Logic & Computer Architecture', year: '2022', semester: 'Semester 3', type: 'Regular', url: 'https://muquestionpapers.com/SE/COMP/Sem3/Digital_Logic_Computer_Architecture_May_2022.pdf' },
      { id: 4, subject: 'Database Management Systems', year: '2023', semester: 'Semester 4', type: 'Regular', url: 'https://muquestionpapers.com/SE/COMP/Sem4/Database_Management_System_Dec_2023.pdf' },
      { id: 5, subject: 'Operating Systems', year: '2022', semester: 'Semester 4', type: 'KT', url: 'https://muquestionpapers.com/SE/COMP/Sem4/Operating_System_May_2022.pdf' },
      { id: 6, subject: 'Computer Networks', year: '2023', semester: 'Semester 5', type: 'Regular', url: 'https://muquestionpapers.com/TE/COMP/Sem5/Computer_Network_Dec_2023.pdf' },
      { id: 7, subject: 'Artificial Intelligence', year: '2023', semester: 'Semester 6', type: 'Regular', url: 'https://muquestionpapers.com/TE/COMP/Sem6/Artificial_Intelligence_Dec_2023.pdf' },
      { id: 8, subject: 'Software Engineering', year: '2022', semester: 'Semester 6', type: 'Regular', url: 'https://muquestionpapers.com/TE/COMP/Sem6/Software_Engineering_May_2022.pdf' },
      { id: 9, subject: 'Cloud Computing', year: '2023', semester: 'Semester 7', type: 'Regular', url: 'https://muquestionpapers.com/BE/COMP/Sem7/Cloud_Computing_Dec_2023.pdf' },
      { id: 10, subject: 'Big Data Analytics', year: '2023', semester: 'Semester 7', type: 'Regular', url: 'https://muquestionpapers.com/BE/COMP/Sem7/Big_Data_Analytics_Dec_2023.pdf' },
    ];

    const mockCourses: Course[] = [
      {
        id: 1,
        title: "Biology 101",
        instructor: "Dr. Sarah Miller",
        progress: 85,
        color: "blue",
        icon: <Leaf size={24} />,
        semester: 3,
        syllabus: [
          "Introduction to Cell Biology: Structure and Function",
          "Molecular Genetics: DNA Replication and Protein Synthesis",
          "Evolutionary Biology: Natural Selection and Adaptation",
          "Ecology and Ecosystems: Energy Flow and Nutrient Cycles",
          "Human Anatomy: Systems and Physiology",
          "Plant Biology: Photosynthesis and Growth"
        ]
      },
      {
        id: 2,
        title: "Calculus II",
        instructor: "Prof. James Davis",
        progress: 45,
        color: "purple",
        icon: <Calculator size={24} />,
        semester: 3,
        syllabus: [
          "Techniques of Integration: Substitution and Parts",
          "Applications of Integration: Area and Volume",
          "Infinite Sequences and Series: Convergence Tests",
          "Power Series and Taylor Series",
          "Parametric Equations and Polar Coordinates",
          "Vector Calculus Basics"
        ]
      },
      {
        id: 3,
        title: "World History",
        instructor: "Dr. Robert Evans",
        progress: 92,
        color: "orange",
        icon: <GraduationCap size={24} />,
        semester: 3,
        syllabus: [
          "Ancient Civilizations: Mesopotamia and Egypt",
          "Classical Greece and Rome: Politics and Culture",
          "The Middle Ages: Feudalism and the Church",
          "The Renaissance and Reformation",
          "The Age of Exploration and Colonialism",
          "The Industrial Revolution and Global Impact",
          "World Wars and the Modern Era"
        ]
      },
      {
        id: 4,
        title: "Env. Science",
        instructor: "Prof. Lisa Green",
        progress: 60,
        color: "green",
        icon: <TreePine size={24} />,
        semester: 4,
        syllabus: [
          "Environmental Ethics and Policy",
          "Ecosystem Dynamics and Biodiversity",
          "Climate Change: Causes and Mitigation",
          "Sustainable Resource Management",
          "Pollution Control and Waste Management",
          "Renewable Energy Technologies"
        ]
      },
      {
        id: 5,
        title: "English Lit",
        instructor: "Dr. Emily White",
        progress: 30,
        color: "pink",
        icon: <BookOpen size={24} />,
        semester: 4,
        syllabus: [
          "Shakespearean Drama: Tragedy and Comedy",
          "Victorian Poetry: Themes of Industry and Faith",
          "Modernist Fiction: Stream of Consciousness",
          "Post-colonial Literature: Identity and Power",
          "Contemporary Global Fiction",
          "Literary Criticism and Theory"
        ]
      },
      {
        id: 6,
        title: "Introduction to Psychology",
        instructor: "Dr. Mark Sloan",
        progress: 10,
        color: "blue",
        icon: <User size={24} />,
        semester: 1,
        syllabus: ["Basics of Psychology", "Cognitive Processes", "Social Behavior"]
      },
      {
        id: 7,
        title: "Physics I",
        instructor: "Prof. Alan Grant",
        progress: 0,
        color: "purple",
        icon: <Zap size={24} />,
        semester: 1,
        syllabus: ["Mechanics", "Thermodynamics", "Waves"]
      }
    ];

    const fetchPapers = async () => {
      try {
        const res = await fetch('/api/question-papers');
        if (res.ok) {
          const data = await res.json();
          setPapers(data);
        }
      } catch (err) {
        console.error('Failed to fetch papers', err);
      }
    };

    setNotices(mockNotices);
    setAssignments(mockAssignments);
    setCourses(mockCourses);

    // Fetch real papers from DB instead of mocks
    fetchPapers();
  }, []);

  const handleAssignmentAction = (id: number, action: 'submit' | 'start') => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        if (action === 'start') {
          setActiveAssignmentId(id);
          const deadlineDate = new Date(a.deadline).getTime();
          const now = Date.now();
          const diffInSeconds = Math.max(0, Math.floor((deadlineDate - now) / 1000));
          setTimeLeft(diffInSeconds);
        }
        if (action === 'submit' && a.id === 1 && !a.uploadedFile) {
          alert('Please upload a PDF file before submitting.');
          return a;
        }
        return { ...a, status: action === 'submit' ? 'submitted' : 'in-progress' };
      }
      return a;
    }));

    if (action === 'submit') {
      const assignment = assignments.find(a => a.id === id);
      if (id === 1 && !assignment?.uploadedFile) return;

      setSubmissionCount(prev => prev + 1);

      // Eco Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#16A34A', '#86EFAC', '#4ADE80'],
        shapes: ['circle', 'square']
      });

      alert(`Successfully submitted the assignment!`);
    } else {
      alert(`Successfully started the assignment!`);
    }
  };

  const handleFileUpload = (id: number, file: File) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, uploadedFile: file };
      }
      return a;
    }));
    alert(`File "${file.name}" uploaded successfully!`);
  };

  const [uploadPaperForm, setUploadPaperForm] = useState({
    year: '2024',
    semester: 'Semester 1',
    type: 'Regular' as 'Regular' | 'KT'
  });
  const [uploadPaperFile, setUploadPaperFile] = useState<File | null>(null);
  const [isUploadingPaper, setIsUploadingPaper] = useState(false);

  const handlePaperUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const file = formData.get('file') as File;

    if (!subject || !file || !file.name) {
      alert("Please provide the subject and a valid PDF file.");
      return;
    }

    try {
      setIsUploadingPaper(true);
      formData.append('year', uploadPaperForm.year);
      formData.append('semester', uploadPaperForm.semester);
      formData.append('examType', uploadPaperForm.type);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload-paper', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      if (res.ok) {
        const newPaper = await res.json();
        setPapers(prev => [newPaper, ...prev]);

        // Eco Confetti on Upload Success
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#22C55E', '#3B82F6', '#86EFAC'],
        });

        alert(`Question paper for "${subject}" uploaded successfully!`);
        setShowUploadPaper(false);
        setUploadPaperForm({ year: '2024', semester: 'Semester 1', type: 'Regular' });
        setUploadPaperFile(null);
      } else {
        const err = await res.json();
        alert(`Upload Failed: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    } finally {
      setIsUploadingPaper(false);
    }
  };

  const handleViewPaper = (paper: QuestionPaper) => {
    window.open(paper.url, '_blank', 'noopener,noreferrer');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-primary p-2.5 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform">
              <Leaf size={28} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-800 italic">Green-Sync</span>
          </div>

          <div className="relative w-80 hidden lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, docs..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#F1F3F5] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
        </div>

        <nav className="flex items-center gap-6 lg:gap-8">
          {['dashboard', 'courses', 'papers', 'assignment-submission', 'eco-tracker', 'settings'].map((tab) => {
            const labels: Record<string, string> = {
              'dashboard': 'Dashboard',
              'courses': 'Courses',
              'papers': 'Question Papers',
              'assignment-submission': 'Assignments',
              'eco-tracker': 'Eco-Tracker',
              'settings': 'Settings'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                className="relative py-2 group whitespace-nowrap"
              >
                <span className={`text-sm font-bold transition-all ${activeTab === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {labels[tab]}
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22C55E] rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-6">
          <button
            onClick={() => { setActiveTab('assignment-submission'); setShowQuickUpload(true); }}
            className="flex items-center gap-2 bg-[#22C55E] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-[#22C55E]/20 group"
          >
            <Upload size={16} />
            Quick Upload
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="p-2 text-slate-400 hover:text-[#22C55E] transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
            >
              <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Notice Feed */}
                  <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-black flex items-center gap-3">
                        <BellRing className="text-primary" />
                        Live Notice Feed
                      </h2>
                      <button
                        onClick={() => setShowAllNotices(true)}
                        className="text-sm font-bold text-primary hover:underline transition-all"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {notices
                        .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((notice: Notice) => (
                          <NoticeItem key={notice.id} notice={notice} />
                        ))}
                    </div>
                  </section>

                  {/* Assignments */}
                  <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-black flex items-center gap-3">
                        <CheckCircle2 className="text-primary" />
                        Upcoming Assignments
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {assignments
                        .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.subject.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((assignment: AssignmentWithFile) => (
                          <AssignmentItem
                            key={assignment.id}
                            assignment={assignment}
                            onRemind={() => setReminderModal({ isOpen: true, assignmentId: assignment.id })}
                            onAction={(action) => handleAssignmentAction(assignment.id, action)}
                            onDetails={() => setSelectedAssignment(assignment)}
                            onUpload={(file) => handleFileUpload(assignment.id, file)}
                            isActive={activeAssignmentId === assignment.id}
                            timeLeft={activeAssignmentId === assignment.id ? formatTime(timeLeft) : undefined}
                          />
                        ))}
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Leaderboard */}
                  <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-black flex items-center gap-3">
                        <Trophy className="text-primary" />
                        Dept. Eco-Leaderboard
                      </h2>
                      <LayoutDashboard className="text-slate-300" size={20} />
                    </div>
                    <div className="space-y-4">
                      <LeaderboardItem rank={1} name="Biology Dept" score="24k pages saved" icon={<GraduationCap />} active />
                      <LeaderboardItem rank={2} name="History Dept" score="18k pages saved" icon={<BookOpen />} />
                      <LeaderboardItem rank={3} name="Math Dept" score="15k pages saved" icon={<Calculator />} />
                      <LeaderboardItem rank={4} name="CS Dept" score="12k pages saved" icon={<Code />} />
                    </div>
                    <div className="mt-10 pt-8 border-t border-slate-50">
                      <div className="bg-[#F8F9FA] p-8 rounded-[2rem] text-center border border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Department Rank</p>
                        <p className="text-5xl font-black text-primary mb-2">#5</p>
                        <p className="text-xs font-bold text-slate-500">Arts & Humanities</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assignment-submission' && (
            <motion.div
              key="assignment-submission"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AssignmentSubmissionView />
            </motion.div>
          )}

          {activeTab === 'grades' && (
            <motion.div
              key="grades"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 text-center"
            >
              <div className="w-20 h-20 bg-[#22C55E]/5 rounded-3xl flex items-center justify-center text-[#22C55E] mx-auto mb-6">
                <Trophy size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Academic Grades</h2>
              <p className="text-slate-500 font-medium">Your semester performance reports will appear here.</p>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black">My Courses</h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSemesters(true)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    All Semesters
                  </button>
                  <button
                    onClick={() => setShowEnroll(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    Enroll New
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter(c => c.semester === selectedSemester)
                  .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.instructor.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onClick={() => setSelectedCourse(course)}
                    />
                  ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'eco-tracker' && (
            <motion.div
              key="eco-tracker"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <h1 className="text-3xl font-black">Eco-Impact Analysis</h1>

              {/* Weekly Goal Area */}
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 blur-3xl group-hover:bg-primary/10 transition-colors" />

                <div className="relative w-48 h-48 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="88" fill="none" stroke="#F1F5F9" strokeWidth="16" />
                    <motion.circle
                      cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="16"
                      strokeDasharray="552.92"
                      initial={{ strokeDashoffset: 552.92 }}
                      animate={{ strokeDashoffset: 552.92 - (552.92 * 0.72) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900 leading-none">72%</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Goal Progress</span>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Excellent Progress, {studentProfile.name.split(' ')[0]}!</h2>
                    <p className="text-slate-500 font-medium max-w-lg">You've saved 4kg of CO2 this month. That's equivalent to planting 12 new saplings in our virtual forest.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Projected Saving</p>
                      <p className="text-xl font-bold text-slate-900">12.5 kg/yr</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paper Equivalent</p>
                      <p className="text-xl font-bold text-slate-900">2.4 Reams</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  icon={<FileText className="text-[#2B8A3E]" />}
                  label="Pages Saved"
                  value="1,240"
                  trend="+12% this week"
                  color="green"
                />
                <StatCard
                  icon={<TreePine className="text-[#2B8A3E]" />}
                  label="Trees Saved"
                  value="0.5"
                  trend="+5% this week"
                  color="green"
                />
                <StatCard
                  icon={<CloudOff className="text-[#2B8A3E]" />}
                  label="Carbon Offset"
                  value="4.2 kg"
                  trend="+8% this week"
                  color="green"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-8 z-10 relative">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Monthly Contribution</h3>
                      <p className="text-xs text-slate-400 font-medium">Tracking paper reduction over 6 months</p>
                    </div>
                    <select className="bg-slate-50 border-none text-xs font-bold rounded-xl px-4 py-2 focus:ring-0 text-slate-600 outline-none">
                      <option>Last 6 Months</option>
                      <option>This Year</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-end justify-between px-4 z-10 relative">
                    {[
                      { m: 'Jan', v: 45 }, { m: 'Feb', v: 62 }, { m: 'Mar', v: 85 },
                      { m: 'Apr', v: 48 }, { m: 'May', v: 92 }, { m: 'Jun', v: 75 }
                    ].map((d, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 flex-1 group/bar">
                        <div className="w-full max-w-[40px] relative flex flex-col justify-end h-48">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${d.v}%` }}
                            transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                            className={`w-full rounded-t-xl transition-colors ${i === 4 ? 'bg-[#2B8A3E] shadow-lg shadow-[#2B8A3E]/20' : 'bg-green-100 group-hover/bar:bg-[#2B8A3E]/70'}`}
                          />
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none mb-2 font-bold transform -translate-y-2 group-hover/bar:translate-y-0">
                            {d.v} pgs
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.m}</span>
                      </div>
                    ))}
                  </div>
                  {/* Background grid lines for chart */}
                  <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-between pt-24 pb-12 px-8">
                    <div className="border-b border-slate-50 w-full"></div>
                    <div className="border-b border-slate-50 w-full"></div>
                    <div className="border-b border-slate-50 w-full"></div>
                    <div className="border-b border-slate-50 w-full"></div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6 text-slate-900">Resource Analysis</h3>
                    <div className="space-y-6">
                      <ImpactMetric label="Paper Reduction" value="85%" color="green" />
                      <ImpactMetric label="Energy Saved" value="42%" color="yellow" />
                      <ImpactMetric label="Water Conserved" value="12%" color="blue" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#2B8A3E] to-[#1e612c] p-8 rounded-[2rem] shadow-xl shadow-[#2B8A3E]/20 text-white relative overflow-hidden group">
                    <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Zap size={24} />
                      </div>
                      <h4 className="font-black text-lg">Green Tip</h4>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-white/90 relative z-10">
                      Digitizing your next 5 assignments will save enough water for a 10-minute shower! Keep up the excellent work.
                    </p>
                  </div>
                </div>
              </div>

              {/* Added deeper analytics graphs area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Weekly Carbon Output</h3>
                  <p className="text-xs text-slate-400 font-medium mb-8">Calculated against traditional paper usage</p>

                  <div className="flex-1 flex items-end gap-2 h-40 px-4 mt-auto">
                    {[34, 45, 23, 56, 12, 60, 20].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                        <motion.div
                          className="w-full bg-[#E7F5ED] rounded-lg group-hover:bg-[#8CE09F] transition-colors relative"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.3 + (i * 0.05), duration: 0.8 }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-300 mt-4 uppercase px-4">
                    <span>Mon</span>
                    <span>Sun</span>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-8">Assignment Category Analytics</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Lab Reports</span>
                        <span className="text-[#2B8A3E]">42%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} transition={{ duration: 1 }} className="h-full bg-[#2B8A3E] rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Research Papers</span>
                        <span className="text-blue-500">35%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} transition={{ duration: 1, delay: 0.1 }} className="h-full bg-blue-500 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Quizzes & Short Answers</span>
                        <span className="text-orange-500">23%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '23%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-orange-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'papers' && (
            <motion.div
              key="papers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-black">Mumbai University Papers</h1>
                  <p className="text-slate-500 font-medium mt-1">Previous year question papers for Engineering</p>
                </div>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={paperSearchQuery}
                      onChange={(e) => setPaperSearchQuery(e.target.value)}
                      placeholder="Search paper subjects..."
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold shadow-sm"
                    />
                  </div>
                  <CustomDropdown
                    label="Semester"
                    options={['All Semesters', ...Array.from(new Set(papers.map(p => p.semester))).sort()]}
                    value={selectedPaperSemester}
                    onChange={setSelectedPaperSemester}
                  />
                  <CustomDropdown
                    label="Year"
                    options={['All Years', ...Array.from(new Set(papers.map(p => p.year))).sort((a, b) => Number(b) - Number(a))]}
                    value={selectedPaperYear}
                    onChange={setSelectedPaperYear}
                  />
                  <div className="pb-0.5">
                    <button
                      onClick={() => setShowUploadPaper(true)}
                      className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2 h-[42px]"
                    >
                      <Upload size={16} />
                      Upload Paper
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Subject</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Year</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Semester</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Type</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {papers
                        .filter(p => selectedPaperSemester === 'All Semesters' || p.semester === selectedPaperSemester)
                        .filter(p => selectedPaperYear === 'All Years' || p.year === selectedPaperYear)
                        .filter(p => p.subject.toLowerCase().includes(searchQuery.toLowerCase()) && p.subject.toLowerCase().includes(paperSearchQuery.toLowerCase()))
                        .map((paper) => (
                          <motion.tr
                            key={paper.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                  <FileQuestion size={18} />
                                </div>
                                <span className="font-bold text-slate-900">{paper.subject}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-500">{paper.year}</td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-500">{paper.semester}</td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${paper.type === 'Regular' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {paper.type}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-primary transition-colors inline-block"
                                title="View/Download Paper"
                              >
                                <FileDown size={20} />
                              </a>
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {papers.filter(p => (selectedPaperSemester === 'All Semesters' || p.semester === selectedPaperSemester) && (selectedPaperYear === 'All Years' || p.year === selectedPaperYear) && p.subject.toLowerCase().includes(searchQuery.toLowerCase()) && p.subject.toLowerCase().includes(paperSearchQuery.toLowerCase())).length === 0 && (
                  <div className="p-20 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <FileQuestion size={40} />
                    </div>
                    <p className="text-slate-500 font-bold">No question papers found for the selected filters.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4 mb-8">
                {settingsSubTab !== 'main' && (
                  <button
                    onClick={() => setSettingsSubTab('main')}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h1 className="text-3xl font-black capitalize">
                  {settingsSubTab === 'main' ? 'Settings' : settingsSubTab}
                </h1>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <AnimatePresence mode="wait">
                  {settingsSubTab === 'main' && (
                    <motion.div
                      key="settings-main"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SettingsOption
                        icon={<User />}
                        label="Profile Information"
                        description="Update your personal details and avatar"
                        onClick={() => setSettingsSubTab('profile')}
                      />
                      <SettingsOption
                        icon={<BellRing />}
                        label="Notifications"
                        description="Manage how you receive alerts and updates"
                        onClick={() => setSettingsSubTab('notifications')}
                      />
                      <SettingsOption
                        icon={<Shield />}
                        label="Security"
                        description="Change password and manage account access"
                        onClick={() => setSettingsSubTab('security')}
                      />
                      <SettingsOption
                        icon={<Palette />}
                        label="Appearance"
                        description="Customize the dashboard theme and layout"
                        onClick={() => setSettingsSubTab('appearance')}
                      />
                      <SettingsOption
                        icon={<HelpCircle />}
                        label="Help & Support"
                        description="Get assistance or report an issue"
                        onClick={() => setSettingsSubTab('help')}
                      />
                    </motion.div>
                  )}

                  {settingsSubTab === 'profile' && (
                    <motion.div
                      key="settings-profile"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-8 space-y-6"
                    >
                      <div className="flex items-center gap-6 mb-8">
                        <div className="relative group">
                          <img src={studentProfile.avatar} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-slate-50" />
                          <button className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={24} />
                          </button>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900">{studentProfile.name}</h4>
                          <p className="text-slate-500 font-medium text-sm">{studentProfile.dept}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</label>
                          <input
                            value={studentProfile.name}
                            onChange={(e) => setStudentProfile(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Address</label>
                          <input
                            value={studentProfile.email}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-slate-400 cursor-not-allowed"
                            readOnly
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone Number</label>
                          <input
                            value={studentProfile.phone}
                            onChange={(e) => setStudentProfile(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Year & Semester</label>
                          <input
                            value={studentProfile.year}
                            onChange={(e) => setStudentProfile(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSaveStatus(true);
                          setTimeout(() => setSaveStatus(false), 3000);
                        }}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 mt-4 active:scale-95"
                      >
                        Save Changes
                      </button>
                    </motion.div>
                  )}

                  {settingsSubTab === 'notifications' && (
                    <motion.div
                      key="settings-notifications"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-8 space-y-4"
                    >
                      {[
                        { id: 'assignmentAlerts', label: 'Assignment Alerts', desc: 'Get notified 24h before submission deadlines' },
                        { id: 'ecoMilestones', label: 'Eco Milestones', desc: 'Alert me when I Reach a new impact level' },
                        { id: 'paperUploads', label: 'Paper Uploads', desc: 'Notify when new papers are added to my semester' },
                        { id: 'securityAlerts', label: 'Security Alerts', desc: 'Immediate notification of login from new devices' },
                        { id: 'emailBriefing', label: 'Email Briefing', desc: 'Receive weekly summary of academic progress' }
                      ].map((pref) => (
                        <div key={pref.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{pref.label}</p>
                            <p className="text-xs text-slate-500 font-medium">{pref.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotificationSettings(prev => ({ ...prev, [pref.id]: !prev[pref.id as keyof typeof prev] }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${notificationSettings[pref.id as keyof typeof notificationSettings] ? 'bg-primary' : 'bg-slate-300'}`}
                          >
                            <motion.div
                              animate={{ x: notificationSettings[pref.id as keyof typeof notificationSettings] ? 24 : 4 }}
                              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {settingsSubTab === 'security' && (
                    <motion.div
                      key="settings-security"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-8 space-y-6"
                    >
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-4 text-orange-700">
                        <ShieldAlert size={20} className="flex-shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">Your last password change was 6 months ago. We recommend updating it for better security.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Current Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">New Password</label>
                          <input type="password" placeholder="Min 8 characters" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Confirm New Password</label>
                          <input type="password" placeholder="Min 8 characters" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold" />
                        </div>
                      </div>

                      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                        Update Password
                      </button>
                    </motion.div>
                  )}

                  {settingsSubTab === 'appearance' && (
                    <motion.div
                      key="settings-appearance"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-8 space-y-8"
                    >
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Dashboard Theme</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {['Light', 'Dark', 'Eco'].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setThemeMode(mode as any)}
                              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${themeMode === mode
                                ? 'bg-primary/5 border-primary'
                                : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mode === 'Light' ? 'bg-orange-100 text-orange-500' :
                                mode === 'Dark' ? 'bg-slate-800 text-white' :
                                  'bg-green-100 text-green-500'
                                }`}>
                                {mode === 'Light' ? <Sun size={24} /> : mode === 'Dark' ? <Moon size={24} /> : <Leaf size={24} />}
                              </div>
                              <span className="text-xs font-black">{mode}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-slate-900">Reduced Motion</p>
                            <p className="text-[10px] text-slate-500 font-medium">Minimize animations for better accessibility</p>
                          </div>
                          <button className="w-12 h-6 bg-slate-300 rounded-full relative">
                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {settingsSubTab === 'help' && (
                    <motion.div
                      key="settings-help"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-8 space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <button className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-3 hover:bg-slate-100 transition-colors group">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                            <HelpCircle size={24} />
                          </div>
                          <p className="font-bold text-slate-900">Knowledge Base</p>
                          <p className="text-[10px] text-slate-500 font-medium">Read guides and common FAQs</p>
                        </button>
                        <button className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-3 hover:bg-slate-100 transition-colors group">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                            <MessageSquare size={24} />
                          </div>
                          <p className="font-bold text-slate-900">Direct Chat</p>
                          <p className="text-[10px] text-slate-500 font-medium">Talk to our support team</p>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2">Feedback</h4>
                        <textarea placeholder="Describe your issue or suggestion..." className="w-full p-4 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-primary/20 font-medium h-32 resize-none" />
                        <button
                          onClick={() => {
                            setSaveStatus(true);
                            setTimeout(() => setSaveStatus(false), 3000);
                          }}
                          className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20"
                        >
                          Submit Feedback
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 border-t border-slate-50">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center gap-4 p-6 hover:bg-red-50 transition-all group"
                  >
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <LogOut size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Sign Out</p>
                      <p className="text-xs text-slate-400">Logout from your current session</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI Assistant Floating Button */}
      <button
        onClick={() => setIsAIChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group pointer-events-auto"
      >
        <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-12 right-0 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-100">
          Need help? Ask AI
        </div>
      </button>

      {/* AI Assistant Chat Modal */}
      <AnimatePresence>
        {isAIChatOpen && (
          <AIAssistant onClose={() => setIsAIChatOpen(false)} />
        )}
      </AnimatePresence>

      {/* Notice View All Modal */}
      <AnimatePresence>
        {
          showAllNotices && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAllNotices(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h2 className="text-2xl font-black">Official Announcements</h2>
                  <button onClick={() => setShowAllNotices(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {notices.map((notice) => (
                    <div key={notice.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${notice.is_emergency ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {notice.is_emergency ? <AlertCircle size={20} /> : <Megaphone size={20} />}
                          </div>
                          <div>
                            <h3 className="font-black text-lg">{notice.title}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                              {notice.target_department} • {new Date(notice.publish_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* notice.image_url && (
                      <img 
                        src={notice.image_url} 
                        alt={notice.title} 
                        className="w-full h-64 object-cover rounded-3xl shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) */}
                      <p className="text-slate-600 leading-relaxed text-lg">{notice.content}</p>
                      <div className="h-px bg-slate-100 w-full" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Reminder Modal */}
      <AnimatePresence>
        {
          reminderModal.isOpen && (
            <ReminderModal
              onClose={() => setReminderModal({ isOpen: false, assignmentId: null })}
              onSet={(time) => {
                alert(`Reminder set for ${time}!`);
                setReminderModal({ isOpen: false, assignmentId: null });
              }}
            />
          )
        }
      </AnimatePresence >

      {/* Assignment Details Modal */}
      <AnimatePresence>
        {
          selectedAssignment && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAssignment(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black">{selectedAssignment.title}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedAssignment.subject}</p>
                  </div>
                  <button onClick={() => setSelectedAssignment(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">Description</h4>
                    <p className="text-slate-600 leading-relaxed">{selectedAssignment.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deadline</p>
                      <p className="font-black text-slate-900">{new Date(selectedAssignment.deadline).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Marks</p>
                      <p className="font-black text-slate-900">{selectedAssignment.max_marks}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleAssignmentAction(selectedAssignment.id, selectedAssignment.status === 'in-progress' ? 'submit' : 'start');
                      setSelectedAssignment(null);
                    }}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                  >
                    {selectedAssignment.status === 'submitted' ? 'Resubmit' : selectedAssignment.status === 'in-progress' ? 'Submit Now' : 'Start Assignment'}
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Course Syllabus Modal */}
      <AnimatePresence>
        {
          selectedCourse && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCourse(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-primary/10 text-primary`}>
                      {selectedCourse.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{selectedCourse.title}</h2>
                      <p className="text-slate-400 font-bold text-xs">{selectedCourse.instructor}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Course Syllabus</h4>
                    <div className="space-y-3">
                      {selectedCourse.syllabus.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                            {i + 1}
                          </div>
                          <span className="font-bold text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full py-4 border-2 border-primary text-primary rounded-2xl font-black hover:bg-primary hover:text-white transition-all">
                    Download Full Syllabus PDF
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Notifications Modal */}
      <AnimatePresence>
        {
          showNotifications && (
            <div className="fixed inset-0 z-[120] flex items-start justify-end p-8 pointer-events-none">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-auto" />
              <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.95 }} className="relative w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 pointer-events-auto overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="font-black">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">New assignment posted in Biology 101</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-4 text-xs font-black text-primary hover:bg-primary/5 transition-colors uppercase tracking-widest">Mark all as read</button>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Profile Modal */}
      <AnimatePresence>
        {
          showProfile && (
            <div className="fixed inset-0 z-[120] flex items-start justify-end p-8 pointer-events-none">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-auto" />
              <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.95 }} className="relative w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 pointer-events-auto overflow-hidden">
                <div className="p-8 text-center bg-slate-50">
                  <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden">
                    <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Avatar" />
                  </div>
                  <h3 className="font-black text-lg">{user?.name || 'Student User'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
                </div>
                <div className="p-4">
                  <button onClick={() => { setActiveTab('settings'); setShowProfile(false); }} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-all font-bold text-slate-700">
                    <User size={18} /> Profile Settings
                  </button>
                  <button onClick={logout} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-2xl transition-all font-bold text-red-600 mt-2">
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Semesters Modal */}
      <AnimatePresence>
        {
          showSemesters && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSemesters(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black">All Semesters</h2>
                  <button onClick={() => setShowSemesters(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <button
                      key={sem}
                      onClick={() => {
                        setSelectedSemester(sem);
                        setShowSemesters(false);
                        setActiveTab('courses');
                      }}
                      className={`p-6 rounded-2xl font-black transition-all border ${selectedSemester === sem
                        ? 'bg-primary text-white border-primary'
                        : 'bg-slate-50 text-slate-700 hover:bg-primary hover:text-white border-transparent hover:border-primary/20'
                        }`}
                    >
                      Semester {sem}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      {/* Upload Paper Modal */}
      <AnimatePresence>
        {
          showUploadPaper && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUploadPaper(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto scrollbar-hide scroll-smooth"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black">Upload Question Paper</h2>
                  <button onClick={() => setShowUploadPaper(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form
                  onSubmit={handlePaperUpload}
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Subject Name</label>
                    <input name="subject" required placeholder="e.g. Applied Mathematics-III" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <CustomDropdown
                      label="Exam Year"
                      options={['2024', '2023', '2022', '2021', '2020']}
                      value={uploadPaperForm.year}
                      onChange={(val) => setUploadPaperForm(prev => ({ ...prev, year: val }))}
                    />
                    <CustomDropdown
                      label="Semester"
                      options={['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']}
                      value={uploadPaperForm.semester}
                      onChange={(val) => setUploadPaperForm(prev => ({ ...prev, semester: val }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <CustomDropdown
                      label="Exam Type"
                      options={['Regular', 'KT']}
                      value={uploadPaperForm.type}
                      onChange={(val) => setUploadPaperForm(prev => ({ ...prev, type: val as 'Regular' | 'KT' }))}
                    />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">File (PDF)</label>
                      <div className="relative border border-transparent rounded-2xl overflow-hidden group/upload transition-all hover:border-primary/20">
                        <input
                          name="file"
                          type="file"
                          accept=".pdf"
                          required
                          onChange={(e) => setUploadPaperFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full p-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 font-bold text-sm h-[42px] transition-colors ${uploadPaperFile ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover/upload:bg-white group-hover/upload:border-primary/30'}`}>
                          <Upload size={16} className={uploadPaperFile ? 'text-primary' : ''} />
                          <span className="truncate max-w-[120px]">{uploadPaperFile ? uploadPaperFile.name : 'Select PDF'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Note</p>
                    <p className="text-xs text-slate-600 leading-relaxed">Your contribution helps other students. Please ensure the paper is clear and complete.</p>
                  </div>

                  <button
                    disabled={isUploadingPaper}
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isUploadingPaper ? (
                      <>
                        <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading to Grid...
                      </>
                    ) : 'Upload & Share'}
                  </button>
                </form>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
      <AnimatePresence>
        {showEnroll && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnroll(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto scrollbar-hide scroll-smooth"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Enroll in New Course</h2>
                <button onClick={() => setShowEnroll(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Available Courses</h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Machine Learning', dept: 'CS Dept', icon: <Code />, semester: 5 },
                      { title: 'Digital Marketing', dept: 'Arts Dept', icon: <Palette />, semester: 2 },
                      { title: 'Quantum Physics', dept: 'Science Dept', icon: <Sparkles />, semester: 6 }
                    ].map((course, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-primary/10 group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform">
                            {course.icon}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{course.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{course.dept} • Sem {course.semester}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newCourse: Course = {
                              id: courses.length + 1,
                              title: course.title,
                              instructor: "Assigned Faculty",
                              progress: 0,
                              color: "blue",
                              icon: course.icon,
                              semester: course.semester,
                              syllabus: ["Introduction", "Core Concepts", "Advanced Topics"]
                            };
                            setCourses(prev => [...prev, newCourse]);
                            alert(`Successfully enrolled in ${course.title}!`);
                            setShowEnroll(false);
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary-dark transition-all"
                        >
                          Enroll
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Add Custom Course</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const title = formData.get('title') as string;
                      const instructor = formData.get('instructor') as string;
                      const semester = parseInt(formData.get('semester') as string);

                      if (title && instructor && semester) {
                        const newCourse: Course = {
                          id: courses.length + 1,
                          title,
                          instructor,
                          progress: 0,
                          color: "green",
                          icon: <BookOpen size={24} />,
                          semester,
                          syllabus: ["Course Overview", "Module 1", "Module 2"]
                        };
                        setCourses(prev => [...prev, newCourse]);
                        alert(`Custom course "${title}" added successfully!`);
                        setShowEnroll(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Course Title</label>
                        <input name="title" required placeholder="e.g. Advanced AI" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Instructor</label>
                        <input name="instructor" required placeholder="e.g. Dr. Strange" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Semester</label>
                      <select name="semester" required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-sm appearance-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                      Add & Enroll
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Upload Modal */}
      <AnimatePresence>
        {showQuickUpload && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickUpload(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#22C55E]" />
              <div className="w-16 h-16 bg-[#DCFCE7] text-[#22C55E] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Instant Upload</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Fast submission portal</p>

              <div className="space-y-3">
                <label className="block w-full py-4 bg-[#22C55E] text-white rounded-2xl font-black cursor-pointer hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20">
                  Select Assignment File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setShowQuickUpload(false);
                        setActiveTab('assignment-submission');
                      }
                    }}
                  />
                </label>
                <button onClick={() => setShowQuickUpload(false)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black hover:bg-slate-100 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modals & Toasts */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Sign Out?</h3>
                <p className="text-slate-500 font-medium mt-2">Are you sure you want to sign out? You will need to login again.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={logout}
                  className="py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[310] bg-slate-900 text-white px-8 py-4 rounded-3xl flex items-center gap-4 shadow-2xl"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <span className="font-bold">Preferences updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
