import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  Terminal, 
  ArrowRight, 
  Sparkles, 
  Boxes, 
  HelpCircle,
  FlaskConical,
  Zap
} from 'lucide-react';
import { ModelSummaryResponse, api } from '../api';
import { useToast } from '../components/Toast';

interface ModelProps {
  onNavigateNext: () => void;
  onModelBuilt: () => void;
}

export const Model: React.FC<ModelProps> = ({ onNavigateNext, onModelBuilt }) => {
  const { addToast } = useToast();

  const [modelType, setModelType] = useState<'LSTM' | 'GAN'>('LSTM');

  // Hyperparameters
  const [lstmLayers, setLstmLayers] = useState<number>(3);
  const [units, setUnits] = useState<number>(256);
  const [dropout, setDropout] = useState<number>(0.3);
  const [denseUnits, setDenseUnits] = useState<number>(256);
  const [optimizer, setOptimizer] = useState<string>('adam');
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [batchSize, setBatchSize] = useState<number>(64);
  const [epochs, setEpochs] = useState<number>(50);

  const [modelSummary, setModelSummary] = useState<ModelSummaryResponse | null>(null);
  const [ganInfo, setGanInfo] = useState<any | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);

  const loadSummary = async () => {
    try {
      const summary = await api.getModelSummary();
      setModelSummary(summary);
    } catch (e) {
      console.warn("Could not load model summary", e);
    }
  };

  const loadGanInfo = async () => {
    try {
      const data = await api.getGanOverview();
      setGanInfo(data);
    } catch (e) {
      console.warn("Could not load GAN info", e);
    }
  };

  useEffect(() => {
    loadSummary();
    loadGanInfo();
  }, []);

  const handleBuildModel = async () => {
    setIsBuilding(true);
    try {
      const res = await api.buildModel({
        architecture: 'LSTM',
        lstm_layers: lstmLayers,
        units,
        dropout,
        dense_units: denseUnits,
        optimizer,
        learning_rate: learningRate,
        batch_size: batchSize,
        epochs
      });
      setModelSummary(res.model);
      onModelBuilt();
      addToast('success', 'Model Architecture Compiled', `Built ${lstmLayers}-layer LSTM with ${res.model.total_params.toLocaleString()} trainable parameters.`);
    } catch (err: any) {
      addToast('error', 'Build Error', err.message);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              TASK 3
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Build Deep Learning Architecture</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Design recurrent LSTM networks or examine experimental GAN generators to learn temporal music dependencies and voice leading.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBuildModel}
            disabled={isBuilding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isBuilding ? 'Compiling Tensors...' : 'Build & Compile Model'}</span>
          </button>

          <button
            onClick={onNavigateNext}
            disabled={!modelSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            <span>Proceed to Training</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model Type Selector (LSTM vs GAN) */}
      <div className="flex items-center gap-3 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800 max-w-md">
        <button
          onClick={() => setModelType('LSTM')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            modelType === 'LSTM'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Recurrent LSTM (Standard)</span>
        </button>

        <button
          onClick={() => setModelType('GAN')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            modelType === 'GAN'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>WGAN-GP (Experimental)</span>
        </button>
      </div>

      {modelType === 'LSTM' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Hyperparameter Form (Left) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Hyperparameter Configuration</span>
              </h2>

              <div className="space-y-4 text-xs">
                
                {/* LSTM Layers */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-medium">LSTM Recurrent Layers:</label>
                    <span className="font-mono text-purple-300 font-bold">{lstmLayers}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLstmLayers(l)}
                        className={`py-1.5 rounded-xl font-semibold border transition-all ${
                          lstmLayers === l
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {l} Layer{l > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Units per Layer */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-medium">Units per LSTM Layer:</label>
                    <span className="font-mono text-purple-300 font-bold">{units}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[128, 256, 512].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnits(u)}
                        className={`py-1.5 rounded-xl font-semibold border transition-all ${
                          units === u
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {u} Units
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropout Rate */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-medium">Dropout Regularization:</label>
                    <span className="font-mono text-purple-300 font-bold">{(dropout * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={dropout}
                    onChange={(e) => setDropout(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">Prevents co-adaptation and overfitting on specific musical phrases</span>
                </div>

                {/* Dense Layer Units */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-medium">Dense Feature Dimension:</label>
                    <span className="font-mono text-purple-300 font-bold">{denseUnits}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[128, 256].map((du) => (
                      <button
                        key={du}
                        type="button"
                        onClick={() => setDenseUnits(du)}
                        className={`py-1.5 rounded-xl font-semibold border transition-all ${
                          denseUnits === du
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {du} Dense Units
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optimizer & Learning Rate */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Optimizer:</label>
                    <select
                      value={optimizer}
                      onChange={(e) => setOptimizer(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="adam">Adam (Adaptive Moment)</option>
                      <option value="rmsprop">RMSprop</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Learning Rate:</label>
                    <select
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                    >
                      <option value={0.0005}>0.0005</option>
                      <option value={0.001}>0.001 (Default)</option>
                      <option value={0.002}>0.002</option>
                    </select>
                  </div>
                </div>

                {/* Batch Size & Epochs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Batch Size:</label>
                    <select
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                    >
                      <option value={32}>32</option>
                      <option value={64}>64 (Default)</option>
                      <option value={128}>128</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Epochs:</label>
                    <input
                      type="number"
                      min="5"
                      max="150"
                      value={epochs}
                      onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Architecture Visual Stack & Summary (Right) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visual Diagram of Layers */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-400" />
                  <span>Sequential Layer Architecture Diagram</span>
                </h3>
                {modelSummary && (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {modelSummary.total_params.toLocaleString()} parameters
                  </span>
                )}
              </div>

              {/* Stacked Blocks */}
              <div className="space-y-2.5 pt-2">
                {modelSummary?.layers.map((layer, idx) => {
                  const isLstm = layer.type === 'LSTM';
                  const isDropout = layer.type === 'Dropout';
                  const isSoftmax = layer.type.includes('Softmax');
                  const isDense = layer.type.includes('Dense') && !isSoftmax;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                        isLstm
                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                          : isDropout
                          ? 'bg-slate-950/80 border-slate-800 text-slate-400 border-dashed'
                          : isDense
                          ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                          : isSoftmax
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono text-[10px] text-slate-400">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white">{layer.name}</div>
                          <div className="text-[11px] opacity-80">{layer.type}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Shape</span>
                          <span>({layer.output_shape.map(s => s === -1 ? 'None' : s).join(', ')})</span>
                        </div>
                        <div className="text-right w-24">
                          <span className="text-slate-500 block text-[9px] uppercase">Params</span>
                          <span className="font-semibold">{layer.params.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keras model.summary() ASCII Terminal Output */}
            {modelSummary?.summary_text && (
              <div className="rounded-3xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>TensorFlow / Keras model.summary()</span>
                  </div>
                  <span>Loss: categorical_crossentropy</span>
                </div>
                <pre className="font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed p-1">
                  {modelSummary.summary_text}
                </pre>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* GAN Overview (Experimental Tab) */
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Wasserstein GAN for Polyphonic Music</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  EXPERIMENTAL STUB
                </span>
              </div>
              <p className="text-xs text-slate-400">Generative Adversarial Network implementation in <code>backend/gan_experimental.py</code></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                <span>Generator Architecture (1D Conv)</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Maps random Gaussian latent vector <code className="text-purple-300">z ~ N(0, I)</code> through 1D transposed convolutions and LeakyReLU layers directly into a continuous token probability matrix. Generates all notes in parallel in O(1) time.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="font-bold text-purple-300 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span>Discriminator / Critic (Bidirectional LSTM)</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Evaluates musical authenticity via Wasserstein distance with Gradient Penalty (WGAN-GP). Ensures the generator avoids mode collapse and models realistic harmonic phrasing.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 leading-relaxed">
            <strong>Educational Note:</strong> For symbolic melody generation and college project presentation, autoregressive LSTMs are recommended over GANs because token sequences have strict sequential dependencies. GANs are available in <code>backend/gan_experimental.py</code> for advanced research.
          </div>
        </div>
      )}

    </div>
  );
};
