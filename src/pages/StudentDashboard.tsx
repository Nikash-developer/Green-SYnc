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
  Sun, Moon, Trash2, Eye, RefreshCcw
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
  syllabusUrl?: string;
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

          {(notice.attachment_url || notice.id === 2) && (
            <motion.div
              whileHover={{ x: 5 }}
              onClick={(e) => {
                e.stopPropagation();
                window.open(notice.attachment_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
              }}
              className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 group/file transition-all hover:bg-primary/5 hover:border-primary/20 mt-3 cursor-pointer shadow-sm"
            >
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500 group-hover/file:bg-primary/10 group-hover/file:text-primary transition-colors">
                <FileDown size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 group-hover/file:text-primary transition-colors truncate">
                  {notice.attachment_url ? notice.attachment_url.split('/').pop() : 'Recycling_Drive_Info_Packet.pdf'}
                </p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">PDF Attachment • Click to view</p>
              </div>
            </motion.div>
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
  onDeleteUpload: () => void,
  isActive: boolean,
  timeLeft?: string
}> = ({ assignment, onRemind, onAction, onDetails, onUpload, onDeleteUpload, isActive, timeLeft }) => {
  const isSubmitted = assignment.status === 'submitted';
  const isInProgress = assignment.status === 'in-progress';
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getTimeLeftString = () => {
    if (isSubmitted) return 'Done';
    const deadlineDate = new Date(assignment.deadline).getTime();
    const now = Date.now();
    const diff = deadlineDate - now;
    if (diff < 0) return 'Exp';

    const hours = diff / (1000 * 60 * 60);
    if (hours > 24) return `${Math.ceil(hours / 24)}\nDays`;
    if (hours > 1) return `${Math.ceil(hours)}\nHrs`;
    return '<1\nHr';
  };

  const isUrgent = !isSubmitted && (new Date(assignment.deadline).getTime() - Date.now()) < (24 * 60 * 60000);

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01 }}
      className={`flex items-center gap-5 p-6 rounded-2xl border transition-[transform,shadow] duration-300 group ${isSubmitted ? 'bg-green-50/50 border-green-100 opacity-80 hover:opacity-100' : 'bg-[#F8F9FA] border-slate-100 hover:shadow-md hover:border-slate-200'
        }`}
    >
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200" />
          <motion.circle
            initial={false}
            animate={{ strokeDashoffset: isSubmitted ? 0 : 75 }}
            cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray="100, 100"
            className={isSubmitted ? "text-green-500" : isUrgent ? "text-red-500" : "text-primary"}
          />
        </svg>
        <div className="absolute text-[10px] font-black text-slate-700 text-center leading-tight">
          {getTimeLeftString()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold truncate group-hover:text-primary transition-colors ${isSubmitted ? 'text-green-700 decoration-green-300/50 line-through' : 'text-slate-900'}`}>{assignment.title}</h4>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {assignment.subject} • {assignment.department}
            {isActive && <span className="ml-2 text-primary animate-pulse font-black">({timeLeft})</span>}
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {assignment.topic && (
              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest border border-slate-200/50">
                {assignment.topic}
              </span>
            )}
            {assignment.uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mt-2 p-3 bg-primary/5 rounded-2xl border border-primary/10 group/file w-fit"
              >
                <div className="bg-white p-2 rounded-xl text-primary shadow-sm group-hover/file:scale-110 transition-transform">
                  <FileText size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-700 max-w-[150px] truncate">{assignment.uploadedFile.name}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = URL.createObjectURL(assignment.uploadedFile!);
                        window.open(url, '_blank');
                      }}
                      className="flex items-center gap-1 text-[9px] font-black text-primary hover:text-primary-dark uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg shadow-sm border border-primary/10 transition-all hover:scale-105"
                    >
                      <Eye size={10} /> View PDF
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1 text-[9px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg shadow-sm border border-blue-100 transition-all hover:scale-105"
                    >
                      <RefreshCcw size={10} /> Change
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteUpload(); }}
                      className="flex items-center gap-1 text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg shadow-sm border border-red-100 transition-all hover:scale-105"
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
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
            onDetails();
          }}
          className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
        >
          Details
        </button>
        {!isSubmitted && (
          <>
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
              className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-primary hover:border-primary/30 transition-all font-sans"
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
            onAction((isInProgress || assignment.id === 1) ? 'submit' : 'start');
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
    </motion.div >
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
    const token = localStorage.getItem('token');
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await response.json();

      if (data.response) {
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my brain right now. Please check your internet or try again in a moment!" }]);
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

const LeaderboardItem: React.FC<{ rank: number, name: string, score: string, icon: React.ReactNode, active?: boolean, onClick?: () => void }> = ({ rank, name, score, icon, active = false, onClick }) => (
  <motion.div
    whileHover={{ x: 5, backgroundColor: active ? '#E7F5ED' : '#F1F5F9' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer border ${active ? 'bg-[#E7F5ED] border-[#D1EAD9]' : 'bg-transparent border-transparent hover:border-slate-100'
      }`}
  >
    <div className={`font-black text-lg w-6 text-center ${active ? 'text-[#2B8A3E]' : 'text-slate-300'}`}>{rank}</div>
    <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-50 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-bold text-sm text-slate-900 leading-tight">{name}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{score}</p>
    </div>
    {active ? <Trophy className="text-[#2B8A3E] w-5 h-5 animate-pulse" /> : <ChevronRight className="text-slate-300 w-4 h-4" />}
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
  const [selectedLeaderboardDept, setSelectedLeaderboardDept] = useState<{ name: string, rank: number, pages: string, icon: any } | null>(null);
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
  const [assignments, setAssignments] = useState<AssignmentWithFile[]>(() => {
    const saved = localStorage.getItem('greensync_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a: any) => ({
            ...a,
            uploadedFile: a.uploadedFileMeta ? new File([], a.uploadedFileMeta.name, { type: 'application/pdf' }) : undefined
          }));
        }
      } catch (e) {
        console.error("Failed to parse saved assignments", e);
      }
    }
    return [];
  });
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
    const dataToSave = assignments.map(a => ({
      ...a,
      uploadedFile: undefined,
      uploadedFileMeta: a.uploadedFile ? { name: a.uploadedFile.name, lastModified: a.uploadedFile.lastModified } : undefined
    }));
    localStorage.setItem('greensync_assignments', JSON.stringify(dataToSave));
  }, [assignments]);

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
      },
      {
        id: 2,
        title: 'Green Council Announcement',
        content: 'Campus-wide recycling drive starts tomorrow at the Student Center. Bring your e-waste!',
        publish_date: new Date(Date.now() - 60 * 60000).toISOString(),
        is_emergency: false,
        target_department: 'General',
        author_id: 1,
      },
      {
        id: 3,
        title: 'New Eco-Study Material Uploaded',
        content: 'Prof. Wilson has uploaded new reading material for the Environmental Ethics module. Access it via the Courses tab.',
        publish_date: new Date(Date.now() - 120 * 60000).toISOString(),
        is_emergency: false,
        target_department: 'CS',
        author_id: 2,
      },
      {
        id: 4,
        title: 'System Maintenance: ID Verification',
        content: 'Student portal login will be down for 30 minutes tonight at 11 PM for security upgrades. Plan your submissions accordingly.',
        publish_date: new Date(Date.now() - 180 * 60000).toISOString(),
        is_emergency: true,
        target_department: 'General',
        author_id: 3,
      },
      {
        id: 5,
        title: 'Hackathon Registration Open!',
        content: 'Green-Sync Dev Hack is now accepting registrations. Build sustainable solutions and win eco-friendly prizes.',
        publish_date: new Date(Date.now() - 240 * 60000).toISOString(),
        is_emergency: false,
        target_department: 'CS',
        author_id: 1,
      },
      {
        id: 6,
        title: 'Guest Lecture: Renewable Energy',
        content: 'Join us for a virtual seminar by Dr. Clara Oswald on the future of solar grid integration this Friday at 2 PM.',
        publish_date: new Date(Date.now() - 300 * 60000).toISOString(),
        is_emergency: false,
        target_department: 'General',
        author_id: 4,
      }
    ];

    const mockAssignments: AssignmentWithFile[] = [
      {
        id: 1,
        title: 'Sustainable Architecture Essay',
        description: 'Write a comprehensive essay on the principles of sustainable architecture.',
        long_description: 'Write a comprehensive essay on the principles of sustainable architecture and its impact on modern urban planning. Focus on renewable materials, energy efficiency, and community well-being. This assignment requires at least 3 primary sources.',
        subject: 'Environmental Science 204',
        department: 'Prof. Miller',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60000).toISOString(),
        max_marks: 100,
        faculty_id: 1,
        status: 'pending',
        topic: 'Urban Planning',
        tags: ['Eco-Design', 'Sustainability', 'Architecture']
      },
      {
        id: 2,
        title: 'Calculus Midterm Prep',
        description: 'Solve the practice set for the upcoming midterm covering integration.',
        long_description: 'Solve the practice set for the upcoming midterm covering integration and series. This includes definite and indefinite integrals, volume by shells, and Taylor series expansions. Show all step-by-step working.',
        subject: 'Math 101',
        department: 'Prof. Davis',
        deadline: new Date(Date.now() + 4 * 60 * 60000).toISOString(),
        max_marks: 100,
        faculty_id: 1,
        status: 'pending',
        topic: 'Integration',
        tags: ['Derivatives', 'Series', 'Calculus']
      },
      {
        id: 3,
        title: 'History Research Paper',
        description: 'Research the impact of the Industrial Revolution on social structures.',
        long_description: 'Research and write about the impact of the Industrial Revolution on social structures, laborers, and the emergence of the middle class in 19th-century Europe. Minimum 1500 words.',
        subject: 'History 304',
        department: 'Dr. Evans',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60000).toISOString(),
        max_marks: 100,
        faculty_id: 1,
        status: 'pending',
        topic: 'Modern History',
        tags: ['Society', 'Industry', 'Revolution']
      },
      {
        id: 4,
        title: 'Database Schema Design',
        description: 'Create an ER diagram for a university management system.',
        long_description: 'Create an ER diagram and normalized schema for a university management system. Ensure 3NF compliance and include all primary and foreign key constraints. Use Mermaid or MySQL Workbench for the diagram.',
        subject: 'DBMS 202',
        department: 'Prof. Wilson',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60000).toISOString(),
        max_marks: 50,
        faculty_id: 2,
        status: 'pending',
        topic: 'Normalization',
        tags: ['SQL', 'Database', 'ERD']
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
      // Semester 1
      { id: 101, title: "Applied Mathematics I", instructor: "Dr. A. Sharma", progress: 100, color: "blue", icon: <Calculator size={24} />, semester: 1, syllabus: ["Matrices", "Complex Numbers", "Integration Basics"], syllabusUrl: "https://mu.ac.in/syllabus/math1.pdf" },
      { id: 102, title: "Engineering Physics I", instructor: "Prof. R. Mehta", progress: 100, color: "purple", icon: <Zap size={24} />, semester: 1, syllabus: ["Quantum Mechanics", "Crystallography", "Semiconductors"], syllabusUrl: "#" },
      { id: 103, title: "Basic Electronics", instructor: "Dr. K. Patel", progress: 100, color: "orange", icon: <Zap size={24} />, semester: 1, syllabus: ["Diodes", "BJTs", "Digital Circuits"], syllabusUrl: "#" },
      { id: 104, title: "Eng. Mechanics", instructor: "Prof. S. Gupta", progress: 100, color: "pink", icon: <Settings size={24} />, semester: 1, syllabus: ["Statics", "Kinematics", "Friction"], syllabusUrl: "#" },
      { id: 105, title: "Intro. to Computing", instructor: "Dr. V. Shah", progress: 100, color: "green", icon: <Code size={24} />, semester: 1, syllabus: ["Algorithms", "C Basics", "Flowcharts"], syllabusUrl: "#" },

      // Semester 2
      { id: 201, title: "Applied Mathematics II", instructor: "Dr. A. Sharma", progress: 100, color: "blue", icon: <Calculator size={24} />, semester: 2, syllabus: ["Diff. Equations", "Beta-Gamma", "Numerical Methods"], syllabusUrl: "#" },
      { id: 202, title: "Engineering Chemistry", instructor: "Dr. P. Desai", progress: 100, color: "green", icon: <Search size={24} />, semester: 2, syllabus: ["Water Tech", "Corrosion", "Nanomaterials"], syllabusUrl: "#" },
      { id: 203, title: "Structured Prog.", instructor: "Prof. V. Shah", progress: 100, color: "blue", icon: <Code size={24} />, semester: 2, syllabus: ["Pointers", "Structures", "File Handling"], syllabusUrl: "#" },
      { id: 204, title: "Eng. Graphics", instructor: "Mr. A. Kulkarni", progress: 100, color: "purple", icon: <Palette size={24} />, semester: 2, syllabus: ["Orthographic", "Projections", "CAD"], syllabusUrl: "#" },
      { id: 205, title: "Env. Studies", instructor: "Dr. L. Green", progress: 100, color: "green", icon: <Leaf size={24} />, semester: 2, syllabus: ["Ecosystems", "Biodiversity", "Pollution"], syllabusUrl: "#" },

      // Semester 3
      { id: 1, title: "Biology 101", instructor: "Dr. Sarah Miller", progress: 85, color: "blue", icon: <Leaf size={24} />, semester: 3, syllabus: ["Cell Biology", "Genetics", "Plant Physiology"], syllabusUrl: "https://www.biology-online.org/syllabus.pdf" },
      { id: 2, title: "Calculus II", instructor: "Prof. James Davis", progress: 45, color: "purple", icon: <Calculator size={24} />, semester: 3, syllabus: ["Techniques of Integration", "Sequences & Series", "Taylor Series"], syllabusUrl: "#" },
      { id: 3, title: "World History", instructor: "Dr. Robert Evans", progress: 92, color: "orange", icon: <GraduationCap size={24} />, semester: 3, syllabus: ["Ancient Civilizations", "Renaissance", "Revolutions"], syllabusUrl: "#" },
      { id: 304, title: "Data Structures", instructor: "Dr. N. Kumar", progress: 10, color: "blue", icon: <Code size={24} />, semester: 3, syllabus: ["Linked Lists", "Trees", "Sorting Algos"], syllabusUrl: "#" },
      { id: 305, title: "Digital Logic Design", instructor: "Prof. M. Rao", progress: 5, color: "pink", icon: <Zap size={24} />, semester: 3, syllabus: ["Logic Minimalism", "Sequential Circuits", "FSMs"], syllabusUrl: "#" },

      // Semester 4
      { id: 4, title: "Environmental Science", instructor: "Prof. Lisa Green", progress: 0, color: "green", icon: <TreePine size={24} />, semester: 4, syllabus: ["Sustainable Dev", "Ecosystems", "Global Policy"], syllabusUrl: "#" },
      { id: 5, title: "English Literature", instructor: "Dr. Emily White", progress: 0, color: "pink", icon: <BookOpen size={24} />, semester: 4, syllabus: ["Poetry", "Prose", "Literary Theory"], syllabusUrl: "#" },
      { id: 403, title: "Operating Systems", instructor: "Dr. S. Nadar", progress: 0, color: "blue", icon: <LayoutDashboard size={24} />, semester: 4, syllabus: ["Process Mgmt", "Memory Mgmt", "Storage"], syllabusUrl: "#" },
      { id: 404, title: "Comp. Architecture", instructor: "Prof. D. Joshi", progress: 0, color: "purple", icon: <Settings size={24} />, semester: 4, syllabus: ["CPU Design", "Control Units", "Pipelining"], syllabusUrl: "#" },
      { id: 405, title: "Discrete Structures", instructor: "Dr. H. Iyer", progress: 0, color: "orange", icon: <Calculator size={24} />, semester: 4, syllabus: ["Graph Theory", "Logic", "Combinatorics"], syllabusUrl: "#" },

      // Semester 5-8
      { id: 501, title: "Database Systems", instructor: "Dr. Y. Rao", progress: 0, color: "blue", icon: <FileText size={24} />, semester: 5, syllabus: ["RDBMS", "NoSQL", "Query Opt"], syllabusUrl: "#" },
      { id: 502, title: "Microprocessors", instructor: "Prof. S. Sen", progress: 0, color: "purple", icon: <Zap size={24} />, semester: 5, syllabus: ["Intel 8085", "8051 Micro", "Assembly"], syllabusUrl: "#" },
      { id: 601, title: "Software Engineering", instructor: "Dr. A. Paul", progress: 0, color: "green", icon: <Sparkles size={24} />, semester: 6, syllabus: ["SDLC", "Agile", "Testing"], syllabusUrl: "#" },
      { id: 701, title: "Art. Intelligence", instructor: "Dr. P. Mani", progress: 0, color: "blue", icon: <Sparkles size={24} />, semester: 7, syllabus: ["Heuristics", "ML", "Expert Sys"], syllabusUrl: "#" },
      { id: 801, title: "Project Phase II", instructor: "Dept. Head", progress: 0, color: "orange", icon: <GraduationCap size={24} />, semester: 8, syllabus: ["Thesis", "Implementation", "Viva"], syllabusUrl: "#" }
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
    // Only set assignments if none are saved or the saved list is empty
    const saved = localStorage.getItem('greensync_assignments');
    let hasSavedAssignments = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        hasSavedAssignments = Array.isArray(parsed) && parsed.length > 0;
      } catch (e) { }
    }

    if (!hasSavedAssignments) {
      setAssignments(mockAssignments);
    }
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

      // alert(`Successfully submitted the assignment!`);
    } else {
      // alert(`Successfully started the assignment!`);
    }
  };

  const handleFileUpload = (id: number, file: File) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, uploadedFile: file };
      }
      return a;
    }));
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

  const handleDeleteUpload = (id: number) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        const { uploadedFile, ...rest } = a;
        return { ...rest, status: 'in-progress' } as AssignmentWithFile;
      }
      return a;
    }));
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
                        .sort((a, b) => (b.is_emergency ? 1 : 0) - (a.is_emergency ? 1 : 0))
                        .slice(0, 3)
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
                        .sort((a, b) => {
                          const subA = a.status === 'submitted' ? 1 : 0;
                          const subB = b.status === 'submitted' ? 1 : 0;
                          if (subA !== subB) return subA - subB;
                          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                        })
                        .map((assignment: AssignmentWithFile) => (
                          <AssignmentItem
                            key={assignment.id}
                            assignment={assignment}
                            onRemind={() => setReminderModal({ isOpen: true, assignmentId: assignment.id })}
                            onAction={(action) => handleAssignmentAction(assignment.id, action)}
                            onDetails={() => setSelectedAssignment(assignment)}
                            onUpload={(file) => handleFileUpload(assignment.id, file)}
                            onDeleteUpload={() => handleDeleteUpload(assignment.id)}
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
                      {[
                        { rank: 1, name: "Biology Dept", score: "24k pages saved", icon: <GraduationCap /> },
                        { rank: 2, name: "History Dept", score: "18k pages saved", icon: <BookOpen /> },
                        { rank: 3, name: "Math Dept", score: "15k pages saved", icon: <Calculator /> },
                        { rank: 4, name: "CS Dept", score: "12k pages saved", icon: <Code /> }
                      ].map((dept) => (
                        <LeaderboardItem
                          key={dept.rank}
                          rank={dept.rank}
                          name={dept.name}
                          score={dept.score}
                          icon={dept.icon}
                          active={user?.department === dept.name.split(' ')[0]}
                          onClick={() => setSelectedLeaderboardDept({ ...dept, pages: dept.score.split(' ')[0] })}
                        />
                      ))}
                    </div>
                    <div className="mt-10 pt-8 border-t border-slate-50">
                      <div className="bg-primary/5 p-8 rounded-[2rem] text-center border border-primary/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Department Rank</p>
                        <p className="text-5xl font-black text-primary mb-2">#{(user?.department === 'Biology' || user?.department === 'History' || user?.department === 'Math' || user?.department === 'CS') ? '1-4' : '5'}</p>
                        <p className="text-xs font-bold text-slate-500">{user?.department || 'Computer Engineering'}</p>
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

              {/* Enhanced Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Monthly Contribution Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-8 z-10 relative">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Projected Carbon Savings</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">6-Month Trend Analysis</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 text-slate-400 hover:text-primary transition-colors border border-slate-100">Export PDF</button>
                      <select className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 focus:ring-0 text-slate-600 outline-none cursor-pointer">
                        <option>Last 6 Months</option>
                        <option>This Year</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between px-4 z-10 relative gap-3">
                    {[
                      { m: 'Jan', v: 45, co2: '2.1kg' }, { m: 'Feb', v: 62, co2: '3.0kg' }, { m: 'Mar', v: 85, co2: '4.2kg' },
                      { m: 'Apr', v: 48, co2: '2.4kg' }, { m: 'May', v: 92, co2: '4.6kg' }, { m: 'Jun', v: 75, co2: '3.8kg' }
                    ].map((d, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 flex-1 group/bar">
                        <div className="w-full relative flex flex-col justify-end h-48">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${d.v}%` }}
                            transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                            className={`w-full rounded-t-2xl transition-all duration-500 overflow-hidden relative ${i === 4 ? 'bg-gradient-to-t from-[#1e612c] to-[#2B8A3E] shadow-lg shadow-[#2B8A3E]/30' : 'bg-slate-100 group-hover/bar:bg-[#E7F5ED]'}`}
                          >
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"
                            />
                          </motion.div>
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-3 py-2 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none mb-2 font-black transform -translate-y-2 group-hover/bar:translate-y-0 shadow-xl z-20 whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span>{d.v} Pages</span>
                              <span className="text-primary text-[8px]">{d.co2} CO2 Saving</span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.m}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-between pt-32 pb-16 px-8">
                    {[1, 2, 3, 4].map(l => <div key={l} className="border-b border-slate-50 w-full" />)}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Detailed Analysis Card */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Impact Composition</h3>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" /> Assignments
                          </span>
                          <span className="text-sm font-black text-slate-900">820 pgs</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-primary" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" /> Test Papers
                          </span>
                          <span className="text-sm font-black text-slate-900">310 pgs</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '25%' }} className="h-full bg-blue-500" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" /> Misc Docs
                          </span>
                          <span className="text-sm font-black text-slate-900">110 pgs</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '10%' }} className="h-full bg-orange-500" />
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-8 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all">
                      View Comprehensive Report
                    </button>
                  </div>

                  {/* Dynamic Tip */}
                  <div className="bg-gradient-to-br from-[#1e612c] via-[#2B8A3E] to-[#37b24d] p-8 rounded-[2rem] shadow-xl shadow-[#2B8A3E]/20 text-white relative overflow-hidden group">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Zap size={24} className="text-yellow-300" />
                      </div>
                      <h4 className="font-black text-lg">Environmental Score</h4>
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                      <span className="text-5xl font-black">A+</span>
                      <span className="text-xs font-bold opacity-80 mb-2">Top 5% Eco-Users</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-white/90 relative z-10">
                      Your digital-first approach in <span className="text-yellow-200">Biology 101</span> has saved more CO2 than 85% of your peers. Keep leading!
                    </p>
                  </div>
                </div>
              </div>

              {/* Weekly Performance Benchmarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Weekly Carbon Output - FIXED */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-slate-900">Weekly Carbon Shield</h3>
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <Shield size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">Daily Prevention (g CO2)</p>

                  <div className="flex-1 flex items-end gap-3 h-48 px-2 mt-auto">
                    {[
                      { d: 'M', v: 65 }, { d: 'T', v: 45 }, { d: 'W', v: 82 },
                      { d: 'T', v: 56 }, { d: 'F', v: 95 }, { d: 'S', v: 30 }, { d: 'S', v: 20 }
                    ].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group/wbar">
                        <div className="w-full relative h-[140px] flex flex-col justify-end">
                          <motion.div
                            className={`w-full rounded-t-xl transition-all duration-300 relative ${i === 4 ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-100 group-hover/wbar:bg-[#8CE09F]'}`}
                            initial={{ height: 0 }}
                            animate={{ height: `${h.v}%` }}
                            transition={{ delay: 0.3 + (i * 0.05), duration: 0.8, type: "spring" }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded-lg opacity-0 group-hover/wbar:opacity-100 transition-all font-bold">
                              {h.v}g
                            </div>
                          </motion.div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 mt-2">{h.d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Efficiency Analytics */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 mb-8">Efficiency Benchmarks</h3>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Submission Speed</p>
                        <p className="text-xs font-black text-primary">Fast (+15%)</p>
                      </div>
                      <div className="h-6 bg-slate-50 rounded-xl flex items-center px-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '85%' }}
                          className="h-4 bg-primary rounded-lg flex items-center justify-end pr-2 text-[8px] font-black text-white"
                        >85%</motion.div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Retention</p>
                        <p className="text-xs font-black text-blue-500">Peak</p>
                      </div>
                      <div className="h-6 bg-slate-50 rounded-xl flex items-center px-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '92%' }}
                          className="h-4 bg-blue-500 rounded-lg flex items-center justify-end pr-2 text-[8px] font-black text-white"
                        >92%</motion.div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-[10px] text-slate-400 font-medium italic">Based on your last 10 digital submissions compared to physical printing offsets.</p>
                    </div>
                  </div>
                </div>

                {/* Departmental Carbon Leader */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Dept. Achievement</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Computer Engineering</p>

                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl">
                        <span className="text-2xl font-black">#3</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-center">In Univ</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">Sustainability Excellence</p>
                        <p className="text-xs font-medium text-slate-500">Your department has saved over 12,000kg of CO2 this year.</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                    Explore Dept Leaderboard
                  </button>
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
        {showAllNotices && (
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
                {notices
                  .sort((a, b) => (b.is_emergency ? 1 : 0) - (a.is_emergency ? 1 : 0))
                  .map((notice) => (
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
        {reminderModal.isOpen && (
          <ReminderModal
            onClose={() => setReminderModal({ isOpen: false, assignmentId: null })}
            onSet={(time) => {
              alert(`Reminder set for ${time}!`);
              setReminderModal({ isOpen: false, assignmentId: null });
            }}
          />
        )}
      </AnimatePresence>

      {/* Assignment Details Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAssignment(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedAssignment.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-primary font-black uppercase tracking-widest text-[10px] bg-primary/5 px-3 py-1 rounded-full border border-primary/10">{selectedAssignment.subject}</span>
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{selectedAssignment.department}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedAssignment(null)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Assignment Mission</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">{selectedAssignment.long_description || selectedAssignment.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4 text-left">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Key Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-[10pt] font-black text-slate-900">{new Date(selectedAssignment.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Submission Window</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                          <Trophy size={16} />
                        </div>
                        <div>
                          <p className="text-[10pt] font-black text-slate-900">{selectedAssignment.max_marks} Points</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Weightage</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-left">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Focus Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedAssignment.tags || ['Sustainable Living', 'Modern Ethics', 'Case Study']).map((tag: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl shadow-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#E7F5ED]/30 p-6 rounded-[2rem] border border-[#8CE09F]/20">
                  <h4 className="text-[10px] font-black text-[#2B8A3E] mb-3 uppercase tracking-widest">Environment Impact Checklist</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 size={14} className="text-[#2B8A3E]" />
                      <span>Digital-only submission (Required)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 size={14} className="text-[#2B8A3E]" />
                      <span>Referenced peer-reviewed e-papers</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Back to Grid
                </button>
                <button
                  onClick={() => {
                    handleAssignmentAction(selectedAssignment.id, selectedAssignment.status === 'in-progress' ? 'submit' : 'start');
                    setSelectedAssignment(null);
                  }}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transform transition-all active:scale-95"
                >
                  {selectedAssignment.status === 'submitted' ? 'Resubmit' : selectedAssignment.status === 'in-progress' ? 'Submit Mission' : 'Accept Assignment'}
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
                  <button
                    onClick={() => {
                      if (selectedCourse.syllabusUrl) {
                        window.open(selectedCourse.syllabusUrl, '_blank');
                      } else {
                        alert("Syllabus PDF is currently being digitized. Please check back later!");
                      }
                    }}
                    className="w-full py-4 border-2 border-primary text-primary rounded-2xl font-black hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
                  >
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
      {/* Dept Leaderboard Modal */}
      <AnimatePresence>
        {
          selectedLeaderboardDept && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLeaderboardDept(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                      {selectedLeaderboardDept.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black">{selectedLeaderboardDept.name} Overview</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Rank #{selectedLeaderboardDept.rank} Global Leaderboard</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLeaderboardDept(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Impact</h4>
                    <div className="p-6 bg-[#E7F5ED] rounded-[2rem] border border-[#8CE09F]/20 relative overflow-hidden group">
                      <TreePine className="absolute -right-4 -bottom-4 w-24 h-24 text-[#2B8A3E]/10 group-hover:scale-110 transition-transform" />
                      <p className="text-4xl font-black text-[#2B8A3E]">{selectedLeaderboardDept.pages}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Pages Digitized</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Engagement</h4>
                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform" />
                      <p className="text-4xl font-black text-blue-600">92%</p>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Active Participation</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Recent Dept. Announcements</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                    {notices
                      .filter(n => n.target_department === selectedLeaderboardDept.name.split(' ')[0] || n.target_department === 'General')
                      .slice(0, 3)
                      .map((notice, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white transition-all group">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-xl shrink-0 ${notice.is_emergency ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-primary'}`}>
                              {notice.is_emergency ? <AlertCircle size={16} /> : <Megaphone size={16} />}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 group-hover:text-primary transition-colors">{notice.title}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">{notice.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    {notices.filter(n => n.target_department === selectedLeaderboardDept.name.split(' ')[0]).length === 0 && (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-400">No specific assignment notices for this department yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLeaderboardDept(null)}
                  className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  Return to Dashboard
                </button>
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
              {(() => {
                const pending = [...assignments]
                  .filter(a => a.status === 'pending')
                  .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
                const target = pending[0];
                return target ? (
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                    Target: {target.title}
                  </p>
                ) : (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    No pending assignments found
                  </p>
                );
              })()}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Fast submission portal</p>

              <div className="space-y-3">
                <label className="block w-full py-4 bg-[#22C55E] text-white rounded-2xl font-black cursor-pointer hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20">
                  Select Assignment File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        const pending = [...assignments]
                          .filter(a => a.status === 'pending')
                          .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
                        const target = pending[0] || assignments[0];

                        if (target) {
                          handleFileUpload(target.id, file);
                          // Force its status to submitted since this is an "Instant Upload"
                          handleAssignmentAction(target.id, 'submit');
                        }

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
    </div >
  );
}
