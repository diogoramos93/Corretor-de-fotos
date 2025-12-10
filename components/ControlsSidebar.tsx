import React from 'react';
import { ImageJob, SportStyle } from '../types';
import { Sliders, Sun, Activity, Layers, Zap, Aperture } from './Icons';

interface ControlsSidebarProps {
  job: ImageJob | null;
  onUpdateSettings: (id: string, settings: Partial<ImageJob['settings']>) => void;
  onProcess: () => void;
}

const ControlsSidebar: React.FC<ControlsSidebarProps> = ({ job, onUpdateSettings, onProcess }) => {
  if (!job) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex items-center justify-center text-slate-500">
        <p>Select an image to edit</p>
      </div>
    );
  }

  const { settings, analysis } = job;

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto">
      <div className="p-5 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sliders size={18} className="text-emerald-400" />
          Adjustments
        </h2>
        <p className="text-xs text-slate-400 mt-1">Batch ID: {job.id.slice(0, 8)}</p>
      </div>

      {analysis && (
        <div className="p-5 border-b border-slate-800 bg-slate-800/30 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Aperture size={12} /> Scene Classification
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-slate-500 block">Context</span>
                <span className="text-white font-medium">{analysis.lightingCondition.replace('_', ' ')}</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-slate-500 block">Sport</span>
                <span className="text-white font-medium truncate">{analysis.sportType}</span>
              </div>
            </div>
            
            {/* Extended Attributes */}
            <div className="mt-2 text-xs space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Brightness:</span>
                <span className={analysis.sceneAttributes.brightness === 'LOW' ? 'text-amber-400' : 'text-slate-200'}>
                    {analysis.sceneAttributes.brightness}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Light Source:</span>
                <span className="text-slate-200 truncate ml-2">{analysis.sceneAttributes.lightSources}</span>
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap size={12} /> Athlete Detection
            </h3>
            <div className={`p-2 rounded border ${analysis.detectedAthletes.length > 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-700 bg-slate-800'}`}>
               <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-300">Objects Found</span>
                  <span className="font-mono font-bold text-emerald-400">{analysis.detectedAthletes.length}</span>
               </div>
               {analysis.detectedAthletes.length > 0 && (
                   <div className="text-[10px] text-emerald-400/70 mt-1">
                       YOLO-style bounding boxes active
                   </div>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="p-5 space-y-6 flex-1">
        {/* Exposure Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Sun size={14} /> Global EV Offset
            </label>
            <span className="text-xs text-emerald-400 font-mono">{settings.evOffset > 0 ? '+' : ''}{settings.evOffset.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.05"
            value={settings.evOffset}
            onChange={(e) => onUpdateSettings(job.id, { evOffset: parseFloat(e.target.value) })}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>-2.0</span>
            <span>+2.0</span>
          </div>
        </div>

        {/* Contrast */}
        <div>
           <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Activity size={14} /> Contrast Punch
            </label>
            <span className="text-xs text-emerald-400 font-mono">{settings.contrast.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={settings.contrast}
            onChange={(e) => onUpdateSettings(job.id, { contrast: parseInt(e.target.value) })}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Sharpness */}
        <div>
           <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Layers size={14} /> Smart Sharpening
            </label>
            <span className="text-xs text-emerald-400 font-mono">{settings.sharpness.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={settings.sharpness}
            onChange={(e) => onUpdateSettings(job.id, { sharpness: parseInt(e.target.value) })}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Style Selector */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-3 block">Processing Style</label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(SportStyle) as Array<keyof typeof SportStyle>).map((style) => (
              <button
                key={style}
                onClick={() => onUpdateSettings(job.id, { style: SportStyle[style] })}
                className={`text-left px-3 py-2 rounded text-xs font-medium border transition-all ${
                  settings.style === SportStyle[style]
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-800">
        <button 
          onClick={onProcess}
          disabled={job.status === 'PROCESSING'}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {job.status === 'PROCESSING' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <Zap size={18} />
              Run Batch Process
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ControlsSidebar;