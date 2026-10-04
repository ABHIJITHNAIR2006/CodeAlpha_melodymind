import React, { useState, useEffect } from 'react';
import { Navbar, PipelineStepId } from './components/Navbar';
import { Stepper, StepStatus } from './components/Stepper';
import { ToastProvider, useToast } from './components/Toast';
import { Home } from './pages/Home';
import { Dataset } from './pages/Dataset';
import { Preprocess } from './pages/Preprocess';
import { Model } from './pages/Model';
import { Train } from './pages/Train';
import { Generate } from './pages/Generate';
import { About } from './pages/About';
import { MidiFile, api } from './api';

function AppContent() {
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState<PipelineStepId>('home');
  const [files, setFiles] = useState<MidiFile[]>([]);
  const [status, setStatus] = useState<StepStatus>({
    hasFiles: true,
    hasPreprocessed: true,
    hasModel: true,
    hasTrained: false,
    isTraining: false
  });

  const refreshFiles = async () => {
    try {
      const data = await api.getFiles();
      setFiles(data.files);
      setStatus((prev) => ({
        ...prev,
        hasFiles: data.files.length > 0
      }));
    } catch (e) {
      console.warn("Could not fetch MIDI files", e);
    }
  };

  const checkPipelineStatus = async () => {
    try {
      const [trainStatus, prepStatus] = await Promise.all([
        api.getTrainingStatus().catch(() => null),
        api.getPreprocessStatus().catch(() => null)
      ]);

      setStatus((prev) => ({
        ...prev,
        isTraining: trainStatus?.is_training ?? false,
        hasTrained: (trainStatus?.history?.epoch?.length || 0) > 0,
        hasPreprocessed: prepStatus?.completed ?? true
      }));
    } catch (e) {
      // Ignore initial polling failures
    }
  };

  useEffect(() => {
    refreshFiles();
    checkPipelineStatus();
    const interval = setInterval(checkPipelineStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickDemo = async () => {
    setCurrentStep('train');
    addToast('info', '3-Minute Demo Initiated', 'Navigating to Training tab and executing accelerated 5-epoch run...');
    try {
      await api.startTraining({
        epochs: 5,
        batch_size: 64,
        quick_demo: true
      });
      setStatus((prev) => ({ ...prev, isTraining: true }));
    } catch (err: any) {
      addToast('error', 'Demo Start Failed', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Top Navigation */}
      <Navbar
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        onQuickDemo={handleQuickDemo}
        isTraining={status.isTraining}
        hasTrainedModel={status.hasTrained}
      />

      {/* 5-Step Pipeline Stepper Bar */}
      {currentStep !== 'home' && currentStep !== 'about' && (
        <Stepper
          currentStep={currentStep}
          onSelectStep={setCurrentStep}
          status={status}
        />
      )}

      {/* Main Page Content */}
      <main className="flex-1 w-full pt-6">
        {currentStep === 'home' && (
          <Home
            onNavigate={setCurrentStep}
            status={status}
          />
        )}

        {currentStep === 'dataset' && (
          <Dataset
            files={files}
            onRefreshFiles={refreshFiles}
            onNavigateNext={() => setCurrentStep('preprocess')}
          />
        )}

        {currentStep === 'preprocess' && (
          <Preprocess
            onNavigateNext={() => setCurrentStep('model')}
            onPreprocessComplete={() => {
              setStatus((prev) => ({ ...prev, hasPreprocessed: true }));
            }}
          />
        )}

        {currentStep === 'model' && (
          <Model
            onNavigateNext={() => setCurrentStep('train')}
            onModelBuilt={() => {
              setStatus((prev) => ({ ...prev, hasModel: true }));
            }}
          />
        )}

        {currentStep === 'train' && (
          <Train
            onNavigateNext={() => setCurrentStep('generate')}
            onTrainingFinished={() => {
              setStatus((prev) => ({ ...prev, hasTrained: true, isTraining: false }));
            }}
          />
        )}

        {currentStep === 'generate' && (
          <Generate />
        )}

        {currentStep === 'about' && (
          <About />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">MelodyMind</span>
            <span>•</span>
            <span>AI Music Generator (LSTM & music21 Pipeline)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setCurrentStep('about')} className="hover:text-purple-400 transition-colors">
              Methodology & Documentation
            </button>
            <span>•</span>
            <button onClick={() => setCurrentStep('generate')} className="hover:text-purple-400 transition-colors">
              Synthesizer
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
