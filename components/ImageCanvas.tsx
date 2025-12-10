import React, { useMemo } from 'react';
import { ImageJob, SportStyle } from '../types';
import { Maximize, Aperture } from './Icons';

interface ImageCanvasProps {
  job: ImageJob | null;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ job }) => {
  if (!job) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-slate-600">
        <Aperture size={64} className="mb-4 opacity-20" />
        <p className="text-lg">No image loaded</p>
        <p className="text-sm">Upload images to begin batch processing</p>
      </div>
    );
  }

  // Simulate CSS filters based on settings
  const filterStyle = useMemo(() => {
    let filters = `brightness(${100 + (job.settings.evOffset * 10)}%) contrast(${100 + job.settings.contrast}%)`;
    
    // Simulate styles
    if (job.settings.style === SportStyle.VIBRANT) {
      filters += ` saturate(130%)`;
    } else if (job.settings.style === SportStyle.DRAMATIC) {
      filters += ` saturate(80%) contrast(120%)`;
    }

    return {
      filter: filters,
      transition: 'filter 0.3s ease-out'
    };
  }, [job.settings]);

  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-8">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }}>
      </div>

      <div className="relative shadow-2xl max-w-full max-h-full group">
        <img 
          src={job.url} 
          alt={job.filename} 
          className="max-w-full max-h-[80vh] object-contain rounded-sm border border-slate-800"
          style={filterStyle}
        />

        {/* Bounding Boxes Layer */}
        {job.analysis?.detectedAthletes?.map((box, idx) => (
          <div 
            key={idx}
            className="absolute border-2 border-emerald-500/70 hover:border-emerald-400 rounded-lg pointer-events-none transition-all"
            style={{
              top: `${box.ymin}%`,
              left: `${box.xmin}%`,
              height: `${box.ymax - box.ymin}%`,
              width: `${box.xmax - box.xmin}%`
            }}
          >
            <div className="absolute -top-6 left-0 bg-emerald-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
              {box.label || 'Athlete'}
            </div>
            
            {/* Primary subject indicator (assume first is primary for vis) */}
            {idx === 0 && (
                <>
                    <div className="absolute top-1/4 left-1/4 w-3 h-3 border border-yellow-400 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                    </div>
                </>
            )}
          </div>
        ))}

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-2 rounded text-xs text-white border border-white/10 flex flex-col gap-1 transition-opacity opacity-50 group-hover:opacity-100">
          <span className="font-mono text-slate-400">{job.filename}</span>
          {job.analysis?.sceneAttributes && (
             <div className="flex gap-3 text-[10px] text-slate-300">
                <span>{job.analysis.sceneAttributes.brightness} LIGHT</span>
                <span className="max-w-[150px] truncate">{job.analysis.sceneAttributes.dominantColors}</span>
             </div>
          )}
        </div>

        <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors">
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
};

export default ImageCanvas;