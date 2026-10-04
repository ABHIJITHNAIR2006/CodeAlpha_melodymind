import React from 'react';
import { 
  Database, 
  Layers, 
  Cpu, 
  Activity, 
  Sparkles, 
  Check, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { PipelineStepId } from './Navbar';

export interface StepStatus {
  hasFiles: boolean;
  hasPreprocessed: boolean;
  hasModel: boolean;
  hasTrained: boolean;
  isTraining: boolean;
}

interface StepperProps {
  currentStep: PipelineStepId;
  onSelectStep: (step: PipelineStepId) => void;
  status: StepStatus;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, onSelectStep, status }) => {
  const steps: Array<{
    id: PipelineStepId;
    num: number;
    title: string;
    desc: string;
    icon: any;
    isDone: boolean;
    isLocked: boolean;
  }> = [
    {
      id: 'dataset',
      num: 1,
      title: 'Collect MIDI Data',
      desc: 'Classical & jazz MIDI dataset',
      icon: Database,
      isDone: status.hasFiles,
      isLocked: false
    },
    {
      id: 'preprocess',
      num: 2,
      title: 'Preprocess',
      desc: 'music21 notes & sliding window',
      icon: Layers,
      isDone: status.hasPreprocessed,
      isLocked: !status.hasFiles
    },
    {
      id: 'model',
      num: 3,
      title: 'Build Model',
      desc: 'LSTM neural network architecture',
      icon: Cpu,
      isDone: status.hasModel,
      isLocked: false
    },
    {
      id: 'train',
      num: 4,
      title: 'Train LSTM',
      desc: status.isTraining ? 'Training in progress...' : 'Loss & accuracy optimization',
      icon: Activity,
      isDone: status.hasTrained,
      isLocked: !status.hasPreprocessed
    },
    {
      id: 'generate',
      num: 5,
      title: 'Generate & Play',
      desc: 'Sampling with temperature & synth',
      icon: Sparkles,
      isDone: false,
      isLocked: false
    }
  ];

  return (
    <div className="w-full bg-slate-900/40 border-b border-slate-800/80 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer min-w-max group ${
                  isCurrent
                    ? 'bg-purple-950/60 border border-purple-500/40 shadow-sm'
                    : 'hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {/* Icon / Step bubble */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                      : step.isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {step.isDone && !isCurrent ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>

                {/* Text details */}
                <div className="hidden lg:block">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold leading-tight ${
                        isCurrent ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.isDone && (
                      <span className="text-[10px] text-emerald-400 font-mono">✓</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {step.desc}
                  </p>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block opacity-60" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
