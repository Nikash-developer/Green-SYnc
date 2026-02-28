import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Leaf, Clock, Upload, FileText, CheckCircle2,
    AlertCircle, Shield, TreePine, ChevronRight,
    User, MessageSquare, X, Loader2
} from 'lucide-react';

interface Feedback {
    id: number;
    assignmentName: string;
    timeAgo: string;
    quote: string;
    instructor: {
        name: string;
        avatar: string;
    };
}

const mockFeedback: Feedback[] = [
    {
        id: 1,
        assignmentName: "Week 3 Essay",
        timeAgo: "2 days ago",
        quote: "Great analysis of the carbon cycle. Consider expanding on the oceanic impact next time.",
        instructor: {
            name: "Dr. Sarah Jenkins",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
        }
    },
    {
        id: 2,
        assignmentName: "Lab Report 2",
        timeAgo: "1 week ago",
        quote: "Solid data collection. Your graphs need better labeling.",
        instructor: {
            name: "Dr. Sarah Jenkins",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
        }
    }
];

interface UpcomingAssignment {
    id: number;
    title: string;
    course: string;
    courseCode: string;
    deadline: Date;
    color: string;
    description: string;
}

const mockUpcoming: UpcomingAssignment[] = [
    {
        id: 1,
        title: "Biodiversity Research Paper",
        course: "Ecosystems & Conservation",
        courseCode: "BIO-101",
        deadline: new Date(Date.now() + 2 * 24 * 3600000 + 4 * 3600000 + 15 * 60000),
        color: "#22C55E",
        description: "Upload your research paper on local biodiversity and its conservation strategies."
    },
    {
        id: 2,
        title: "Database Normalization Lab",
        course: "Database Systems",
        courseCode: "CS-202",
        deadline: new Date(Date.now() + 5 * 24 * 3600000),
        color: "#3B82F6",
        description: "Submit your normalized schema (up to 3NF) for the provided case study."
    },
    {
        id: 3,
        title: "Modern History Essay",
        course: "World History",
        courseCode: "HIS-105",
        deadline: new Date(Date.now() + 22 * 3600000), // Less than 24h
        color: "#F59E0B",
        description: "Analyzation of the post-war industrial boom and its long-term effects."
    }
];

export const AssignmentSubmissionView: React.FC = () => {
    const [selectedAssignment, setSelectedAssignment] = useState<UpcomingAssignment>(mockUpcoming[0]);
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [plagiarismStatus, setPlagiarismStatus] = useState<'ready' | 'scanning' | 'completed'>('ready');
    const [plagiarismPercent, setPlagiarismPercent] = useState(0);
    const [co2Saved, setCo2Saved] = useState(0);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });
    const [isDragOver, setIsDragOver] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState<Feedback | null>(null);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = selectedAssignment.deadline.getTime() - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hrs: 0, min: 0, sec: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hrs: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                min: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                sec: Math.floor((diff % (1000 * 60)) / 1000)
            });
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [selectedAssignment]);

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const validateAndSetFile = (selectedFile: File) => {
        if (!selectedFile) return;
        const allowedFormats = ['.pdf', '.docx'];
        const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
        if (!allowedFormats.includes(extension)) {
            alert("Only PDF and DOCX files are supported.");
            return;
        }
        if (selectedFile.size > 25 * 1024 * 1024) {
            alert("File size exceeds 25MB limit.");
            return;
        }
        setFile(selectedFile);
        simulateUpload(selectedFile);
    };

    const simulateUpload = (selectedFile: File) => {
        setUploadStatus('uploading');
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setUploadStatus('success');
                    triggerPlagiarismScan();
                    calculateEcoImpact(selectedFile);
                    return 100;
                }
                return prev + 5;
            });
        }, 150);
    };

    const triggerPlagiarismScan = () => {
        setPlagiarismStatus('scanning');
        setPlagiarismPercent(0);
        setTimeout(() => {
            const interval = setInterval(() => {
                setPlagiarismPercent(prev => {
                    const target = Math.floor(Math.random() * 15) + 2; // Random safe %
                    if (prev >= target) {
                        clearInterval(interval);
                        setPlagiarismStatus('completed');
                        return target;
                    }
                    return prev + 1;
                });
            }, 100);
        }, 1000);
    };

    const calculateEcoImpact = (selectedFile: File) => {
        const estimatedPages = Math.max(1, Math.ceil(selectedFile.size / 51200));
        const co2PerSheet = 0.5;
        const totalSaved = estimatedPages * co2PerSheet;
        let current = 0;
        const interval = setInterval(() => {
            current += 0.5;
            if (current >= totalSaved) {
                setCo2Saved(totalSaved);
                clearInterval(interval);
            } else {
                setCo2Saved(current);
            }
        }, 50);
    };

    const formatNumber = (n: number) => n.toString().padStart(2, '0');

    const handleAssignmentSwitch = (assignment: UpcomingAssignment) => {
        setFile(null);
        setUploadStatus('idle');
        setPlagiarismStatus('ready');
        setPlagiarismPercent(0);
        setCo2Saved(0);
        setSelectedAssignment(assignment);
    };

    return (
        <div className="flex gap-8 animate-in fade-in duration-500">
            {/* Left Sidebar - Upcoming & Feedback */}
            <aside className="w-80 space-y-8 flex-shrink-0">
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upcoming Tasks</h3>
                    <div className="space-y-3">
                        {mockUpcoming.map((item) => (
                            <motion.button
                                key={item.id}
                                whileHover={{ x: 4 }}
                                onClick={() => handleAssignmentSwitch(item)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedAssignment.id === item.id
                                        ? 'bg-white border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20'
                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {item.courseCode}
                                    </span>
                                </div>
                                <h4 className={`text-sm font-bold leading-tight ${selectedAssignment.id === item.id ? 'text-primary' : 'text-slate-700'
                                    }`}>
                                    {item.title}
                                </h4>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                        <Clock size={12} />
                                        <span>{new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <ChevronRight size={14} className={selectedAssignment.id === item.id ? 'text-primary' : 'text-slate-300'} />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recent Feedback</h3>
                    <div className="space-y-3">
                        {mockFeedback.map((fb) => (
                            <motion.div
                                key={fb.id}
                                whileHover={{ y: -4, scale: 1.02 }}
                                onClick={() => setShowFeedbackModal(fb)}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer transition-all hover:shadow-lg hover:border-primary/20 group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">{fb.assignmentName}</span>
                                    <span className="text-[10px] font-bold text-slate-300">{fb.timeAgo}</span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 italic mb-4 leading-relaxed transition-colors group-hover:text-slate-900">
                                    "{fb.quote}"
                                </p>
                                <div className="flex items-center gap-2">
                                    <img src={fb.instructor.avatar} alt={fb.instructor.name} className="w-6 h-6 rounded-full border border-slate-100" />
                                    <span className="text-[10px] font-bold text-slate-500">{fb.instructor.name}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </aside>

            {/* Main Submission Area */}
            <div className="flex-1 space-y-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedAssignment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <span
                                    className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full"
                                    style={{ backgroundColor: `${selectedAssignment.color}15`, color: selectedAssignment.color }}
                                >
                                    {selectedAssignment.courseCode} • {selectedAssignment.course}
                                </span>
                                <h1 className="text-4xl font-black text-slate-900 leading-tight">
                                    {selectedAssignment.title}
                                </h1>
                                <p className="text-slate-500 font-medium max-w-2xl">{selectedAssignment.description}</p>
                            </div>

                            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 px-8">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-900 tabular-nums">{formatNumber(timeLeft.days)}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Days</p>
                                </div>
                                <span className="text-slate-200 font-black mb-4">:</span>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-900 tabular-nums">{formatNumber(timeLeft.hrs)}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Hrs</p>
                                </div>
                                <span className="text-slate-200 font-black mb-4">:</span>
                                <div className="text-center">
                                    <p className={`text-2xl font-black tabular-nums ${timeLeft.days === 0 && timeLeft.hrs < 24 ? 'text-red-500' : 'text-slate-900'}`}>
                                        {formatNumber(timeLeft.min)}
                                    </p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Min</p>
                                </div>
                            </div>
                        </div>

                        <section
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleFileDrop}
                            className={`relative h-96 rounded-[3rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm overflow-hidden ${isDragOver ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-slate-200 hover:border-primary/30'
                                }`}
                        >
                            {uploadStatus === 'idle' ? (
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform">
                                        <Leaf size={40} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">Upload your assignment</h3>
                                        <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">
                                            Drag & drop your PDF or DOCX file here to save a tree.<br />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 block">Maximum file size: 25MB</span>
                                        </p>
                                    </div>
                                    <label className="cursor-pointer bg-primary text-white px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-primary/20 inline-block">
                                        Browse Files
                                        <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])} />
                                    </label>
                                </div>
                            ) : (
                                <div className="w-full max-w-sm space-y-8">
                                    <AnimatePresence mode="wait">
                                        {uploadStatus === 'uploading' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
                                                        <FileText size={24} />
                                                    </div>
                                                    <div className="text-left flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 truncate">{file?.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <button onClick={() => { setUploadStatus('idle'); setFile(null); }} className="p-2 hover:bg-white rounded-full text-slate-300 hover:text-red-500 transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <p className="text-xs font-black text-slate-900 flex items-center gap-2">
                                                            <Loader2 size={14} className="animate-spin text-primary" />
                                                            Uploading...
                                                        </p>
                                                        <p className="text-xs font-black text-primary">{uploadProgress}%</p>
                                                    </div>
                                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-primary"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {uploadStatus === 'success' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="space-y-6 text-center"
                                            >
                                                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/40">
                                                    <CheckCircle2 size={40} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900 mb-1">Upload Successful!</h3>
                                                    <p className="text-slate-500 text-sm font-bold">{file?.name}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setUploadStatus('idle'); setFile(null); }}
                                                    className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                                >
                                                    Upload another file
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </section>

                        <div className="grid grid-cols-2 gap-8">
                            <motion.div
                                initial={false}
                                animate={{ borderColor: plagiarismStatus === 'completed' ? (plagiarismPercent > 15 ? '#FCA5A5' : '#818CF8') : '#E5E7EB' }}
                                className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 transition-colors space-y-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${plagiarismStatus === 'completed' ? (plagiarismPercent > 15 ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500') : 'bg-slate-50 text-slate-400'}`}>
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900">Plagiarism Check</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {plagiarismStatus === 'ready' && 'Ready to scan'}
                                                {plagiarismStatus === 'scanning' && 'Scanning content...'}
                                                {plagiarismStatus === 'completed' && 'Analysis complete'}
                                            </p>
                                        </div>
                                    </div>
                                    {plagiarismStatus === 'completed' && (
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${plagiarismPercent > 15 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {plagiarismPercent > 15 ? 'Warning' : 'Safe'}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${plagiarismStatus === 'completed' ? (plagiarismPercent > 15 ? 'bg-red-500' : 'bg-indigo-500') : 'bg-primary'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: plagiarismStatus === 'scanning' ? '70%' : (plagiarismStatus === 'completed' ? '100%' : '0%') }}
                                            transition={{ duration: plagiarismStatus === 'scanning' ? 2 : 0.5 }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500 font-medium">
                                            {plagiarismStatus === 'ready' && 'Automatic scan will start after upload.'}
                                            {plagiarismStatus === 'scanning' && 'Comparing with global database...'}
                                            {plagiarismStatus === 'completed' && `${plagiarismPercent}% similarity detected.`}
                                        </p>
                                        {plagiarismStatus === 'completed' && (
                                            <p className={`text-xl font-black ${plagiarismPercent > 15 ? 'text-red-500' : 'text-indigo-500'}`}>
                                                {plagiarismPercent}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-green-50 text-green-500 rounded-2xl">
                                            <TreePine size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900">Eco Impact</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Digital Submission</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                                        Level 4
                                    </span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex-1">
                                        <div className="text-3xl font-black text-slate-900 mb-1">
                                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                {co2Saved.toFixed(1)}g
                                            </motion.span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
                                            CO2 saved by submitting this assignment digitally instead of printing.
                                        </p>
                                    </div>
                                    <div className="w-20 h-20 rounded-full border-4 border-slate-50 flex items-center justify-center relative">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="40" cy="40" r="34" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                                            <motion.circle
                                                cx="40" cy="40" r="34" fill="none" stroke="#primary" strokeWidth="8"
                                                strokeDasharray="213"
                                                initial={{ strokeDashoffset: 213 }}
                                                animate={{ strokeDashoffset: 213 - (213 * (co2Saved / 25)) }}
                                                style={{ stroke: 'var(--primary)' }}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Leaf className="text-primary" size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showFeedbackModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFeedbackModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-8 overflow-hidden">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <img src={showFeedbackModal.instructor.avatar} alt="" className="w-12 h-12 rounded-2xl shadow-sm" />
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{showFeedbackModal.instructor.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{showFeedbackModal.assignmentName} • {showFeedbackModal.timeAgo}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowFeedbackModal(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-900 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <MessageSquare className="text-primary" size={24} />
                                    <p className="text-slate-700 font-medium leading-relaxed italic">"{showFeedbackModal.quote}"</p>
                                </div>
                                <button onClick={() => setShowFeedbackModal(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                                    Close Review
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

