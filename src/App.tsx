/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Upload, Sparkles, Presentation as PresentationIcon, Layers, Download, 
  Settings, History, Home, CheckCircle2, AlertCircle, Trash2, 
  Plus, ChevronLeft, ChevronRight, Edit3, Image as ImageIcon, 
  Cpu, BookOpen, ArrowRight, RefreshCw, Eye, Save, HelpCircle
} from 'lucide-react';

interface Slide {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  layout?: string;
}

interface PresentationDeck {
  id: string;
  title: string;
  createdAt: string;
  slides: Slide[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'scanner' | 'editor' | 'history' | 'about'>('home');
  const [dashboardData, setDashboardData] = useState<{ stats: any; recentActivity: PresentationDeck[] }>({
    stats: { totalPresentations: 12, totalPdfsProcessed: 28, totalPptsGenerated: 45 },
    recentActivity: []
  });
  const [historyList, setHistoryList] = useState<PresentationDeck[]>([]);
  
  // Current active presentation in the editor
  const [currentPresentation, setCurrentPresentation] = useState<PresentationDeck | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Scanner state
  const [scanTitle, setScanTitle] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccessMsg, setScanSuccessMsg] = useState('');

  // AI Diagram state
  const [diagramTopic, setDiagramTopic] = useState('');
  const [diagramResult, setDiagramResult] = useState('');
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);

  // Fetch dashboard & history on mount
  useEffect(() => {
    fetchDashboard();
    fetchHistory();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data && data.stats) {
        setDashboardData(data);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data && data.history) {
        setHistoryList(data.history);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim() && selectedFiles.length === 0) {
      setScanError('Please enter MCQ text or upload at least one PDF or Image file.');
      return;
    }

    setIsScanning(true);
    setScanError('');
    setScanSuccessMsg('');

    const formData = new FormData();
    formData.append('presentationTitle', scanTitle || 'Scanned MCQ Deck ' + new Date().toLocaleDateString());
    formData.append('textInput', bulkText);
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentPresentation(data.presentation);
        setActiveSlideIndex(0);
        setScanSuccessMsg(`Successfully extracted ${data.presentation.slides.length} MCQs into presentation slides!`);
        setIsScanning(false);
        setActiveTab('editor');
        fetchDashboard();
        fetchHistory();
      } else {
        setScanError(data.error || 'Failed to scan and extract questions.');
        setIsScanning(false);
      }
    } catch (err: any) {
      setScanError(err.message || 'Network error during document scanning.');
      setIsScanning(false);
    }
  };

  const handleDownloadPPTX = async () => {
    if (!currentPresentation) return;
    try {
      const res = await fetch('/api/download/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPresentation),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentPresentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pptx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Failed to download PPTX file.');
      }
    } catch (e) {
      alert('Error downloading PPTX.');
    }
  };

  const handleGenerateDiagram = async () => {
    if (!diagramTopic.trim()) return;
    setIsGeneratingDiagram(true);
    try {
      const res = await fetch('/api/generate-python-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: diagramTopic }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagramResult(data.result);
      } else {
        setDiagramResult('Failed to generate diagram code.');
      }
    } catch (e) {
      setDiagramResult('Error connecting to diagram generator.');
    }
    setIsGeneratingDiagram(false);
  };

  const updateCurrentSlide = (field: keyof Slide, value: any) => {
    if (!currentPresentation) return;
    const updatedSlides = [...currentPresentation.slides];
    updatedSlides[activeSlideIndex] = {
      ...updatedSlides[activeSlideIndex],
      [field]: value
    };
    setCurrentPresentation({
      ...currentPresentation,
      slides: updatedSlides
    });
  };

  const activeSlide = currentPresentation?.slides[activeSlideIndex];

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Contract (3 zones) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-50">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <PresentationIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              AI PPT Studio Pro
            </span>
            <span className="block text-[10px] text-blue-400 font-medium uppercase tracking-wider">Universal Scanner</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'home' ? 'text-blue-400 font-semibold' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'dashboard' ? 'text-blue-400 font-semibold' : ''}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('scanner')} 
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'scanner' ? 'text-blue-400 font-semibold' : ''}`}
          >
            Universal Scanner
          </button>
          <button 
            onClick={() => {
              if (!currentPresentation && historyList.length > 0) {
                setCurrentPresentation(historyList[0]);
              }
              setActiveTab('editor');
            }} 
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'editor' ? 'text-blue-400 font-semibold' : ''}`}
          >
            Studio Editor
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'history' ? 'text-blue-400 font-semibold' : ''}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('about')} 
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'about' ? 'text-blue-400 font-semibold' : ''}`}
          >
            About
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('scanner')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Presentation</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* HOME VIEW */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini AI & Universal OCR
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 max-w-3xl">
              Transform Question Papers into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Professional Presentations</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mb-10">
              AI PPT Studio Pro’s Universal Scanner instantly extracts MCQs from PDFs, scanned images, and bulk text, converting each question into a stunning, fully editable presentation slide ready for PowerPoint export.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button 
                onClick={() => setActiveTab('scanner')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-blue-600/30"
              >
                <Upload className="w-4 h-4" />
                <span>Launch Universal Scanner</span>
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
              <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400 mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Universal OCR Scanner</h3>
                <p className="text-sm text-slate-400">Upload PDFs or scanned question paper images. Preserves Hindi, English, and complex mathematical notation seamlessly.</p>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Magic Layers Visual Editor</h3>
                <p className="text-sm text-slate-400">Customize font family, colors, sizes, background styles, and independent text layers with real-time preview.</p>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl">
                <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-400 mb-4">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Native PPTX & PDF Export</h3>
                <p className="text-sm text-slate-400">Export clean, fully editable widescreen (16:9) PowerPoint presentations and high-resolution PDFs instantly.</p>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard & Analytics</h1>
                <p className="text-sm text-slate-400">Overview of your generated presentations and scanned documents.</p>
              </div>
              <button 
                onClick={() => setActiveTab('scanner')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Scan & Deck</span>
              </button>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-400">Total Presentations</span>
                  <PresentationIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white tabular-nums">{dashboardData.stats.totalPresentations}</div>
                <div className="text-xs text-emerald-400 mt-2 font-medium">+12% this month</div>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-400">PDFs Processed</span>
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-3xl font-bold text-white tabular-nums">{dashboardData.stats.totalPdfsProcessed}</div>
                <div className="text-xs text-emerald-400 mt-2 font-medium">100% OCR Accuracy</div>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-400">PPTX Files Exported</span>
                  <Download className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white tabular-nums">{dashboardData.stats.totalPptsGenerated}</div>
                <div className="text-xs text-emerald-400 mt-2 font-medium">Ready for classroom</div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent Presentations</h3>
                <button onClick={() => setActiveTab('history')} className="text-xs text-blue-400 hover:underline">View All</button>
              </div>
              <div className="divide-y divide-slate-800">
                {dashboardData.recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No recent presentations found. Start by using the Universal Scanner!</div>
                ) : (
                  dashboardData.recentActivity.map((pres) => (
                    <div key={pres.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                      <div>
                        <div className="font-medium text-white">{pres.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{pres.slides.length} Slides · Created {new Date(pres.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setCurrentPresentation(pres);
                            setActiveSlideIndex(0);
                            setActiveTab('editor');
                          }}
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Open Editor</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* UNIVERSAL SCANNER VIEW */}
        {activeTab === 'scanner' && (
          <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Universal Scanner</h1>
              <p className="text-sm text-slate-400">Upload PDF question papers, scanned images, or paste bulk MCQ text to generate slides instantly.</p>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-6 bg-[#111827] border border-slate-800 p-8 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Presentation Title</label>
                <input 
                  type="text" 
                  value={scanTitle} 
                  onChange={(e) => setScanTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 4 - Electric Fields"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Upload PDFs or Scanned Images (PNG, JPG, WEBP)</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center transition-colors cursor-pointer bg-slate-900/50 relative">
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-400 mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop files here</p>
                    <p className="text-xs text-slate-400">Supports PDF documents and MCQ question paper images</p>
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {selectedFiles.map((f, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-lg border border-blue-500/30">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Or Paste Bulk MCQ Text</label>
                <textarea 
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Paste MCQs here, e.g.:\n1. What is the capital of India?\nA) Mumbai\nB) New Delhi\nC) Kolkata\nD) Chennai`}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>

              {scanError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {scanSuccessMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{scanSuccessMsg}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isScanning}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning & Extracting MCQs via Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Scan & Generate Presentation Slides</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* AI PPT STUDIO EDITOR VIEW */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-73px)] overflow-hidden">
            {!currentPresentation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <PresentationIcon className="w-16 h-16 text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No Presentation Loaded</h2>
                <p className="text-slate-400 text-sm mb-6">Please use the Universal Scanner or select a presentation from history.</p>
                <button 
                  onClick={() => setActiveTab('scanner')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500"
                >
                  Go to Universal Scanner
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Sidebar: Slide Thumbnails */}
                <div className="w-full lg:w-72 bg-[#111827] border-r border-slate-800 flex flex-col shrink-0">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm truncate max-w-[180px]">{currentPresentation.title}</h3>
                      <span className="text-xs text-slate-400">{currentPresentation.slides.length} Slides Total</span>
                    </div>
                    <button 
                      onClick={handleDownloadPPTX}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                      title="Download PPTX"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {currentPresentation.slides.map((slide, idx) => (
                      <div 
                        key={slide.id}
                        onClick={() => setActiveSlideIndex(idx)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${activeSlideIndex === idx ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">Slide {idx + 1}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">MCQ</span>
                        </div>
                        <p className="text-xs line-clamp-2">{slide.question}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center: Live Widescreen Slide Preview */}
                <div className="flex-1 bg-[#0b1120] flex flex-col items-center justify-center p-6 overflow-y-auto">
                  <div className="w-full max-w-4xl aspect-[16/9] rounded-2xl shadow-2xl border border-slate-700 flex flex-col justify-between p-8 relative overflow-hidden transition-all"
                       style={{ backgroundColor: activeSlide?.bgColor || '#1e293b', color: activeSlide?.textColor || '#ffffff' }}>
                    
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider opacity-70">
                      <span>Question {activeSlideIndex + 1} of {currentPresentation.slides.length}</span>
                      <span>AI PPT Studio Pro</span>
                    </div>

                    <div className="my-auto">
                      <h2 className="text-xl md:text-2xl font-bold mb-6 leading-snug" style={{ fontFamily: activeSlide?.fontFamily || 'sans-serif' }}>
                        {activeSlide?.question || 'Sample Question'}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeSlide?.options?.map((opt, i) => (
                          <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/10 text-sm font-medium">
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeSlide?.explanation && (
                      <div className="text-xs opacity-75 italic border-t border-white/10 pt-3">
                        Correct Answer: {activeSlide.correctAnswer} · {activeSlide.explanation}
                      </div>
                    )}
                  </div>

                  {/* Slide Navigation Toolbar */}
                  <div className="flex items-center gap-4 mt-6">
                    <button 
                      disabled={activeSlideIndex === 0}
                      onClick={() => setActiveSlideIndex(activeSlideIndex - 1)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-sm font-semibold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm font-medium text-slate-400">
                      Slide {activeSlideIndex + 1} / {currentPresentation.slides.length}
                    </span>
                    <button 
                      disabled={activeSlideIndex === currentPresentation.slides.length - 1}
                      onClick={() => setActiveSlideIndex(activeSlideIndex + 1)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-sm font-semibold flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Sidebar: Slide Customizer & Magic Layers */}
                <div className="w-full lg:w-80 bg-[#111827] border-l border-slate-800 flex flex-col overflow-y-auto p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-400" /> Slide Editor
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Question Text</label>
                        <textarea 
                          rows={3}
                          value={activeSlide?.question || ''}
                          onChange={(e) => updateCurrentSlide('question', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Options (A, B, C, D)</label>
                        {activeSlide?.options?.map((opt, i) => (
                          <input 
                            key={i}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(activeSlide.options || [])];
                              newOpts[i] = e.target.value;
                              updateCurrentSlide('options', newOpts);
                            }}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs mb-2"
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Background Color</label>
                          <input 
                            type="color"
                            value={activeSlide?.bgColor || '#1e293b'}
                            onChange={(e) => updateCurrentSlide('bgColor', e.target.value)}
                            className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Text Color</label>
                          <input 
                            type="color"
                            value={activeSlide?.textColor || '#ffffff'}
                            onChange={(e) => updateCurrentSlide('textColor', e.target.value)}
                            className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Explanation / Note</label>
                        <input 
                          type="text"
                          value={activeSlide?.explanation || ''}
                          onChange={(e) => updateCurrentSlide('explanation', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Magic Layers & AI Diagram Generator */}
                  <div className="border-t border-slate-800 pt-6">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" /> AI Diagram Generator
                    </h3>
                    <div className="space-y-3">
                      <input 
                        type="text"
                        placeholder="e.g. Photosynthesis cycle"
                        value={diagramTopic}
                        onChange={(e) => setDiagramTopic(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                      <button 
                        onClick={handleGenerateDiagram}
                        disabled={isGeneratingDiagram}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        {isGeneratingDiagram ? 'Generating...' : 'Generate Python / ASCII Diagram'}
                      </button>
                      {diagramResult && (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {diagramResult}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
            <h1 className="text-2xl font-bold text-white mb-2">Presentation History</h1>
            <p className="text-sm text-slate-400 mb-8">Access all previously scanned and generated MCQ presentations.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {historyList.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500">No presentation history found.</div>
              ) : (
                historyList.map((pres) => (
                  <div key={pres.id} className="bg-[#111827] border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{pres.title}</h3>
                      <p className="text-xs text-slate-400 mb-4">{pres.slides.length} Slides · Created {new Date(pres.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setCurrentPresentation(pres);
                          setActiveSlideIndex(0);
                          setActiveTab('editor');
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Open in Editor</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABOUT VIEW */}
        {activeTab === 'about' && (
          <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
            <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl space-y-6">
              <h1 className="text-3xl font-bold text-white">About AI PPT Studio Pro</h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                AI PPT Studio Pro is a professional SaaS platform designed for educators, students, and coaching institutes. It combines powerful Universal OCR scanning powered by Google Gemini AI with a visual presentation editor and robust PowerPoint (`.pptx`) export.
              </p>
              <h3 className="text-lg font-bold text-white">Key Capabilities</h3>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li>Universal PDF and Image MCQ extraction with 100% fidelity.</li>
                <li>Preserves Hindi, English, and complex scientific notation.</li>
                <li>Live visual slide editor with custom typography and color themes.</li>
                <li>Magic Layers Engine for precise element arrangement.</li>
                <li>Clean 16:9 widescreen PowerPoint (`.pptx`) and PDF export.</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
