import React from 'react';
import { 
  Music, 
  Database, 
  Cpu, 
  Layers, 
  PlayCircle, 
  Sparkles, 
  FileText, 
  FastForward,
  Activity
} from 'lucide-react';

export type PipelineStepId = 'home' | 'dataset' | 'preprocess' | 'model' | 'train' | 'generate' | 'about';

interface NavbarProps {
  currentStep: PipelineStepId;
  onSelectStep: (step: PipelineStepId) => void;
  onQuickDemo: () => void;
  isTraining: boolean;
  hasTrainedModel: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onSelectStep,
  onQuickDemo,
  isTraining,
  hasTrainedModel
}) => {
  const navItems: Array<{ id: PipelineStepId; label: string; icon: any; stepNumber?: number }> = [
    { id: 'home', label: 'Home', icon: Music },
    { id: 'dataset', label: 'Dataset', icon: Database, stepNumber: 1 },
    { id: 'preprocess', label: 'Preprocess', icon: Layers, stepNumber: 2 },
    { id: 'model', label: 'Model', icon: Cpu, stepNumber: 3 },
    { id: 'train', label: 'Train', icon: Activity, stepNumber: 4 },
    { id: 'generate', label: 'Generate', icon: Sparkles, stepNumber: 5 },
    { id: 'about', label: 'Report', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-purple-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => onSelectStep('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Music className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
                MelodyMind
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                AI Lab
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Deep Learning MIDI Music Generator</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectStep(item.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white bg-purple-600/30 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'opacity-70'}`} />
                <span>{item.label}</span>
                {item.stepNumber && (
                  <span className={`text-[9px] px-1 rounded-md font-mono ${
                    isActive ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.stepNumber}
                  </span>
                )}
                {item.id === 'train' && isTraining && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          {isTraining ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Training Active...</span>
            </div>
          ) : (
            <button
              onClick={onQuickDemo}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 active:scale-95 transition-all duration-200 cursor-pointer"
              title="Train for 5 quick epochs in under 30 seconds for live presentation"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>3-Min Demo</span>
            </button>
          )}

          {/* Direct Generate CTA */}
          <button
            onClick={() => onSelectStep('generate')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Play Synth</span>
          </button>
        </div>

      </div>
    </header>
  );
};
