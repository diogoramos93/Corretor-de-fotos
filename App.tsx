import React, { useState, useCallback, useEffect } from 'react';
import { ImageJob, JobStatus, SportStyle } from './types';
import { analyzeSportsImage } from './services/geminiService';
import ControlsSidebar from './components/ControlsSidebar';
import ImageCanvas from './components/ImageCanvas';
import { Upload, ImageIcon, Play, Download, CheckCircle, Activity } from './components/Icons';

// Helper to convert blob to base64 for Gemini
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix
      resolve(base64String.split(',')[1]); 
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to generate ID (polyfill for crypto.randomUUID which might be missing in non-secure contexts)
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Simple fallback for environments without randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Load some demo images on mount if empty
  useEffect(() => {
    if (jobs.length === 0) {
      const demoJob: ImageJob = {
        id: 'demo-1',
        filename: 'soccer_match_raw.jpg',
        url: 'https://picsum.photos/id/1055/1200/800', // Soccer-ish generic
        thumbnailUrl: 'https://picsum.photos/id/1055/200/200',
        status: JobStatus.PENDING,
        progress: 0,
        settings: {
          evOffset: 0.3,
          contrast: 10,
          sharpness: 25,
          style: SportStyle.REALISTIC
        },
        analysis: {
            sportType: "Soccer",
            lightingCondition: "OUTDOOR_DAY",
            sceneAttributes: {
                brightness: "HIGH",
                dominantColors: "Green, Blue",
                lightSources: "Sunlight"
            },
            detectedAthletes: [
                { ymin: 30, xmin: 40, ymax: 85, xmax: 60, label: "Striker" }
            ],
            subjectDetected: true,
            suggestedEV: 0.3,
            suggestedWB: 0,
            confidence: 0.92
        }
      };
      setJobs([demoJob]);
      setSelectedJobId(demoJob.id);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newJobs: ImageJob[] = Array.from(e.target.files).map((item) => {
        const file = item as File;
        return {
          id: generateId(),
          filename: file.name,
          url: URL.createObjectURL(file),
          thumbnailUrl: URL.createObjectURL(file),
          status: JobStatus.PENDING,
          progress: 0,
          settings: {
            evOffset: 0,
            contrast: 15,
            sharpness: 30,
            style: SportStyle.REALISTIC
          }
        };
      });

      setJobs(prev => [...prev, ...newJobs]);
      if (!selectedJobId) setSelectedJobId(newJobs[0].id);

      // Trigger auto-analysis for new uploads
      for (const job of newJobs) {
        updateJobStatus(job.id, JobStatus.ANALYZING);
        try {
            // Need to fetch blob from object URL to send to Gemini
            const response = await fetch(job.url);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            
            const analysis = await analyzeSportsImage(base64);
            
            setJobs(prev => prev.map(j => {
                if (j.id === job.id) {
                    return {
                        ...j,
                        status: JobStatus.PENDING, // Ready for user review
                        analysis,
                        settings: {
                            ...j.settings,
                            evOffset: analysis.suggestedEV,
                            // If indoor, maybe bump contrast
                            contrast: analysis.lightingCondition === 'INDOOR' ? 25 : j.settings.contrast
                        }
                    };
                }
                return j;
            }));
        } catch (err) {
            console.error(err);
            updateJobStatus(job.id, JobStatus.FAILED);
        }
      }
    }
  };

  const updateJobStatus = (id: string, status: JobStatus) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  };

  const handleUpdateSettings = (id: string, newSettings: Partial<ImageJob['settings']>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, settings: { ...j.settings, ...newSettings } } : j));
  };

  const handleProcess = () => {
    if (!selectedJobId) return;
    updateJobStatus(selectedJobId, JobStatus.PROCESSING);
    
    // Simulate backend processing time
    setTimeout(() => {
      updateJobStatus(selectedJobId, JobStatus.COMPLETED);
    }, 1500);
  };

  const handleBatchProcess = async () => {
    setIsBatchProcessing(true);
    const pending = jobs.filter(j => j.status !== JobStatus.COMPLETED);
    
    for (const job of pending) {
        setSelectedJobId(job.id);
        updateJobStatus(job.id, JobStatus.PROCESSING);
        await new Promise(r => setTimeout(r, 800)); // Faster for batch simulation
        updateJobStatus(job.id, JobStatus.COMPLETED);
    }
    setIsBatchProcessing(false);
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold">
            SL
          </div>
          <h1 className="font-bold text-lg tracking-tight">SportLens <span className="text-emerald-500 font-light">Pro</span></h1>
          <span className="ml-4 px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-slate-700">v2.1.0 Batch Core</span>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full">
                <Activity size={12} className={isBatchProcessing ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                {isBatchProcessing ? "Batch Processing Active..." : "System Idle"}
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded transition-colors">
                <Upload size={14} />
                Import RAW/JPG
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Filmstrip / Batch List */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0">
            <h3 className="font-semibold text-sm text-slate-300">Queue ({jobs.length})</h3>
            <button 
                onClick={handleBatchProcess}
                disabled={isBatchProcessing || jobs.length === 0}
                className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50" title="Process All">
                <Play size={16} fill="currentColor" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {jobs.map(job => (
              <div 
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`p-2 rounded-md cursor-pointer flex gap-3 items-center transition-all ${selectedJobId === job.id ? 'bg-slate-800 border border-emerald-500/30' : 'hover:bg-slate-800/50 border border-transparent'}`}
              >
                <div className="w-12 h-12 bg-slate-950 rounded overflow-hidden shrink-0 relative">
                   <img src={job.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                   {job.status === JobStatus.COMPLETED && (
                       <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                           <CheckCircle size={16} className="text-emerald-400" fill="currentColor" />
                       </div>
                   )}
                   {job.status === JobStatus.PROCESSING && (
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                           <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                       </div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 truncate">{job.filename}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                    {job.status === JobStatus.ANALYZING ? 'AI Analyzing...' : job.status}
                  </p>
                </div>
              </div>
            ))}
            
            {jobs.length === 0 && (
                <div className="text-center py-10 px-4 text-slate-600 text-xs">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                    Drop RAW files here or click Import
                </div>
            )}
          </div>
          
          <div className="p-3 border-t border-slate-800 bg-slate-900">
             <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded flex items-center justify-center gap-2 transition-colors">
                <Download size={14} /> Export All
             </button>
          </div>
        </div>

        {/* Center: Canvas */}
        <ImageCanvas job={selectedJob} />

        {/* Right: Controls */}
        <ControlsSidebar 
            job={selectedJob} 
            onUpdateSettings={handleUpdateSettings}
            onProcess={handleProcess}
        />
      </div>
    </div>
  );
};

export default App;