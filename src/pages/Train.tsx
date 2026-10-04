import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Square, 
  FastForward, 
  Cpu, 
  Clock, 
  Gauge, 
  Terminal, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Save,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TrainingStatusResponse, api } from '../api';
import { LossChart } from '../components/LossChart';
import { useToast } from '../components/Toast';

interface TrainProps {
  onNavigateNext: () => void;
  onTrainingFinished: () => void;
}

export const Train: React.FC<TrainProps> = ({ onNavigateNext, onTrainingFinished }) => {
  const { addToast } = useToast();

  const [epochs, setEpochs] = useState<number>(30);
  const [batchSize, setBatchSize] = useState<number>(64);
  const [status, setStatus] = useState<TrainingStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const data = await api.getTrainingStatus();
      setStatus(data);

      if (data.is_training) {
        setIsPolling(true);
      } else if (isPolling) {
        setIsPolling(false);
        if (data.current_epoch > 0) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          addToast('success', 'Training Completed', `Final loss: ${data.loss.toFixed(4)}. Model weights ready for sampling.`);
          onTrainingFinished();
        }
      }
    } catch (e) {
      console.warn("Could not fetch training status", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    let timer: any;
    if (isPolling || status?.is_training) {
      timer = setInterval(fetchStatus, 400);
    }
    return () => clearInterval(timer);
  }, [isPolling, status?.is_training]);

  const handleStartTraining = async (quickDemo = false) => {
    try {
      await api.startTraining({
        epochs: quickDemo ? 5 : epochs,
        batch_size: batchSize,
        quick_demo: quickDemo
      });
      setIsPolling(true);
      addToast(
        'info', 
        quickDemo ? 'Quick Demo Session Started' : 'Training Initiated',
        quickDemo 
          ? 'Running 5 accelerated epochs designed for live presentation.' 
          : `Optimizing LSTM across ${epochs} epochs...`
      );
    } catch (err: any) {
      addToast('error', 'Training Start Failed', err.message);
    }
  };

  const handleStopTraining = async () => {
    try {
      await api.stopTraining();
      addToast('info', 'Stopping Training', 'Finalizing current step and saving model weights...');
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  const currentEpoch = status?.current_epoch || 0;
  const totalEpochs = status?.total_epochs || epochs;
  const progressPct = totalEpochs > 0 ? Math.min(100, Math.round((currentEpoch / totalEpochs) * 100)) : 0;
  const hasFinished = !status?.is_training && (status?.history.epoch.length || 0) > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              TASK 4
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Train Neural Network</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Train the stacked LSTM on preprocessed note sequences. Model weights are saved at each validation checkpoint.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {status?.is_training ? (
            <button
              onClick={handleStopTraining}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Training</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => handleStartTraining(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
                title="Runs 5 epochs in ~20 seconds for presentation demo"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>3-Min Presentation Demo</span>
              </button>

              <button
                onClick={() => handleStartTraining(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Full Training ({epochs} Ep)</span>
              </button>
            </>
          )}

          <button
            onClick={onNavigateNext}
            disabled={!hasFinished && !status?.model_saved_path}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            <span>Proceed to Generation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compute Device & Live Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Device Indicator */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Hardware Device</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{status?.device || 'CPU Engine'}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Accelerated SIMD Matrix Math</div>
        </div>

        {/* Current Loss */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cross-Entropy Loss</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {status ? status.loss.toFixed(4) : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Val: {status?.val_loss ? status.val_loss.toFixed(4) : '—'}
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Token Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {status ? `${(status.accuracy * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Val Acc: {status?.val_accuracy ? `${(status.val_accuracy * 100).toFixed(1)}%` : '—'}
          </div>
        </div>

        {/* Batch Speed & ETA */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Throughput & ETA</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-300 font-mono">
            {status?.batch_speed || '0 batch/s'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            ETA: {status?.eta_seconds ? `${status.eta_seconds}s` : '0s'} | Elapsed: {status?.elapsed_time || 0}s
          </div>
        </div>

      </div>

      {/* Epoch Progress Bar */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-white flex items-center gap-2">
            <span>Epoch Progress:</span>
            <span className="font-mono text-purple-300">
              {currentEpoch} of {totalEpochs}
            </span>
          </span>
          <span className="font-mono text-purple-400 font-bold">{progressPct}%</span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Callbacks status row */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ModelCheckpoint: Active</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>EarlyStopping (Patience=6)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>ReduceLROnPlateau (LR: {status?.learning_rate.toFixed(5) || '0.001'})</span>
            </span>
          </div>

          {status?.model_saved_path && (
            <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
              <Save className="w-3 h-3" />
              <span>Best weights saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Live Training Curves (SVG Chart) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Live Training Telemetry Curves</span>
          </h2>
          <span className="text-xs text-slate-400">Updates live per epoch</span>
        </div>

        <LossChart
          epochs={status?.history.epoch || []}
          loss={status?.history.loss || []}
          accuracy={status?.history.accuracy || []}
          valLoss={status?.history.val_loss || []}
          valAccuracy={status?.history.val_accuracy || []}
          height={260}
        />
      </div>

      {/* Terminal Console Logs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Training Stream Console</span>
          </div>
          <span>{status?.logs.length || 0} messages logged</span>
        </div>

        <div className="h-40 rounded-2xl bg-slate-950 border border-slate-800/80 p-3 font-mono text-[11px] overflow-y-auto text-slate-300 space-y-1">
          {status?.logs && status.logs.length > 0 ? (
            status.logs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-purple-400">&gt;</span> {log}
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic">Click "Start Full Training" or "3-Min Presentation Demo" to launch the training job.</div>
          )}
        </div>
      </div>

    </div>
  );
};
