import React, { useState } from 'react';

interface LossChartProps {
  epochs: number[];
  loss: number[];
  accuracy: number[];
  valLoss?: number[];
  valAccuracy?: number[];
  height?: number;
}

export const LossChart: React.FC<LossChartProps> = ({
  epochs,
  loss,
  accuracy,
  valLoss = [],
  valAccuracy = [],
  height = 240
}) => {
  const [activeTab, setActiveTab] = useState<'loss' | 'accuracy'>('loss');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (epochs.length === 0) {
    return (
      <div 
        style={{ height }}
        className="w-full rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col items-center justify-center text-slate-500 text-xs"
      >
        <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center mb-2">
          <span>~</span>
        </div>
        <p>Awaiting training initiation to plot live convergence curves.</p>
        <span className="text-[11px] text-slate-600 mt-1">Loss and accuracy will update per epoch.</span>
      </div>
    );
  }

  const primaryData = activeTab === 'loss' ? loss : accuracy;
  const secondaryData = activeTab === 'loss' ? valLoss : valAccuracy;
  const isLoss = activeTab === 'loss';

  // Calculate range bounds
  const allValues = [...primaryData, ...(secondaryData || [])].filter(v => v !== undefined && !isNaN(v));
  const minVal = Math.min(...allValues, isLoss ? 0.2 : 0);
  const maxVal = Math.max(...allValues, isLoss ? 4.5 : 1.0);
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = height;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getX = (idx: number) => {
    if (epochs.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (epochs.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / range;
    return padTop + plotHeight - norm * plotHeight;
  };

  // Generate SVG path strings
  const createPathString = (data: number[]) => {
    if (data.length === 0) return '';
    return data
      .map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`)
      .join(' ');
  };

  const primaryPath = createPathString(primaryData);
  const secondaryPath = createPathString(secondaryData);

  // Gradient area path
  const areaPath = primaryData.length > 0 
    ? `${primaryPath} L ${getX(primaryData.length - 1)} ${padTop + plotHeight} L ${getX(0)} ${padTop + plotHeight} Z`
    : '';

  return (
    <div className="w-full rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-3">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('loss')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'loss'
                ? 'bg-purple-600/30 border border-purple-500/40 text-purple-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categorical Cross-Entropy Loss
          </button>
          <button
            onClick={() => setActiveTab('accuracy')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'accuracy'
                ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Token Prediction Accuracy
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isLoss ? 'bg-purple-400' : 'bg-cyan-400'}`} />
            <span className="text-slate-300">Training</span>
          </div>
          {secondaryData.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400" />
              <span className="text-slate-400">Validation</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isLoss ? "#a855f7" : "#06b6d4"} stopOpacity="0.35" />
              <stop offset="100%" stopColor={isLoss ? "#a855f7" : "#06b6d4"} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = padTop + plotHeight * ratio;
            const val = maxVal - ratio * range;
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {isLoss ? val.toFixed(2) : `${(val * 100).toFixed(0)}%`}
                </text>
              </g>
            );
          })}

          {/* Fill under line */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {/* Secondary Line (Validation) */}
          {secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.75"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          )}

          {/* Primary Line (Training) */}
          {primaryPath && (
            <path
              d={primaryPath}
              fill="none"
              stroke={isLoss ? "#c084fc" : "#22d3ee"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {primaryData.map((val, i) => {
            const cx = getX(i);
            const cy = getY(val);
            const isHovered = hoverIndex === i;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={isHovered ? 5.5 : 3}
                fill={isHovered ? "#ffffff" : isLoss ? "#c084fc" : "#22d3ee"}
                stroke="#0f172a"
                strokeWidth="1.5"
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Hover Crosshair & Tooltip */}
          {hoverIndex !== null && hoverIndex < primaryData.length && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={padTop + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(primaryData[hoverIndex])}
                r="6"
                fill="#ffffff"
                stroke={isLoss ? "#9333ea" : "#0891b2"}
                strokeWidth="3"
              />
            </g>
          )}

          {/* Bottom X-axis Epoch Labels */}
          {epochs.map((ep, i) => {
            if (epochs.length > 10 && i % Math.ceil(epochs.length / 8) !== 0 && i !== epochs.length - 1) {
              return null;
            }
            return (
              <text
                key={ep}
                x={getX(i)}
                y={svgHeight - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                Ep {ep}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoverIndex !== null && hoverIndex < primaryData.length && (
          <div
            className="absolute -top-1 pointer-events-none transform -translate-x-1/2 bg-slate-900/95 border border-purple-500/40 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md text-[11px] font-mono text-slate-200 z-10"
            style={{ left: `${(getX(hoverIndex) / svgWidth) * 100}%` }}
          >
            <div className="font-bold text-white mb-0.5">Epoch {epochs[hoverIndex]}</div>
            <div className={isLoss ? "text-purple-300" : "text-cyan-300"}>
              Train: {isLoss ? primaryData[hoverIndex].toFixed(4) : `${(primaryData[hoverIndex] * 100).toFixed(2)}%`}
            </div>
            {secondaryData[hoverIndex] !== undefined && (
              <div className="text-amber-300">
                Val: {isLoss ? secondaryData[hoverIndex].toFixed(4) : `${(secondaryData[hoverIndex] * 100).toFixed(2)}%`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
