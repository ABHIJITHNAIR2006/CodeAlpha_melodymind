import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  Trash2, 
  Play, 
  Pause, 
  FileMusic, 
  Plus, 
  CheckCircle2, 
  PieChart, 
  Clock, 
  Layers, 
  ArrowRight,
  Music4
} from 'lucide-react';
import { MidiFile, api } from '../api';
import { useToast } from '../components/Toast';
import { audioSynth } from '../audio/synth';

interface DatasetProps {
  files: MidiFile[];
  onRefreshFiles: () => Promise<void>;
  onNavigateNext: () => void;
}

export const Dataset: React.FC<DatasetProps> = ({ files, onRefreshFiles, onNavigateNext }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedGenre, setSelectedGenre] = useState<string>('Classical');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState<boolean>(false);
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Compute summary metrics
  const totalFiles = files.length;
  const totalNotes = files.reduce((acc, f) => acc + (f.notes_count || 0), 0);
  const totalDurationSec = files.reduce((acc, f) => acc + (f.duration || 0), 0);

  const genreCounts: Record<string, number> = {};
  files.forEach((f) => {
    genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1;
  });

  const handleFileUpload = async (uploadedFiles: FileList | File[]) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setIsUploading(true);

    let successCount = 0;
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (!file.name.toLowerCase().endsWith('.mid') && !file.name.toLowerCase().endsWith('.midi')) {
        addToast('error', 'Invalid File Format', `${file.name} is not a valid .mid or .midi file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast('error', 'File Too Large', `${file.name} exceeds the 10 MB limit.`);
        continue;
      }

      try {
        await api.uploadMidi(file, selectedGenre);
        successCount++;
      } catch (err: any) {
        addToast('error', 'Upload Failed', err.message || `Could not upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      addToast('success', 'Upload Successful', `Added ${successCount} MIDI track(s) to ${selectedGenre} dataset.`);
      await onRefreshFiles();
    }
    setIsUploading(false);
  };

  const handleDownloadSampleDataset = async () => {
    setIsDownloadingSample(true);
    try {
      await api.downloadSampleDataset();
      await onRefreshFiles();
      addToast('success', 'Sample Dataset Ready', 'Loaded 5 public-domain Classical & Jazz compositions.');
    } catch (err: any) {
      addToast('error', 'Download Error', err.message || 'Could not fetch sample dataset.');
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const handleDeleteFile = async (id: string, name: string) => {
    try {
      if (playingFileId === id) {
        audioSynth.stop();
        setPlayingFileId(null);
      }
      await api.deleteFile(id);
      await onRefreshFiles();
      addToast('info', 'File Removed', `Deleted ${name} from active dataset.`);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  const handlePlayPreview = async (file: MidiFile) => {
    if (playingFileId === file.id) {
      audioSynth.stop();
      setPlayingFileId(null);
      return;
    }

    if (!file.tokens || file.tokens.length === 0) {
      addToast('info', 'No Notes', 'This file does not have preview tokens available.');
      return;
    }

    setPlayingFileId(file.id);
    audioSynth.loadSequence(file.tokens, 120, 'Acoustic Grand Piano');
    audioSynth.setCallbacks(
      () => {},
      (isPlaying) => {
        if (!isPlaying) setPlayingFileId(null);
      }
    );
    await audioSynth.play();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              TASK 1
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Collect MIDI Music Data</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Ingest polyphonic and melodic MIDI compositions (.mid/.midi). The AI model learns harmonic syntax and motifs from this corpus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSampleDataset}
            disabled={isDownloadingSample}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingSample ? 'Loading Dataset...' : 'Download Sample Dataset'}</span>
          </button>

          <button
            onClick={onNavigateNext}
            disabled={totalFiles === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Proceed to Preprocessing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Loaded Files</span>
            <FileMusic className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalFiles}</div>
          <div className="text-[11px] text-slate-500 mt-1">SMF format tracks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Notes Extracted</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">{totalNotes.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pitches & chord events</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Audio Duration</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">{Math.round(totalDurationSec)}s</div>
          <div className="text-[11px] text-slate-500 mt-1">Approx. {(totalDurationSec / 60).toFixed(1)} minutes</div>
        </div>

        {/* Genre Distribution Pill Card */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Genre Distribution</span>
            <PieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(genreCounts).map(([genre, count]) => (
              <span
                key={genre}
                className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300"
              >
                {genre}: <strong className="text-white">{count}</strong>
              </span>
            ))}
            {Object.keys(genreCounts).length === 0 && (
              <span className="text-xs text-slate-500">No tracks loaded</span>
            )}
          </div>
        </div>
      </div>

      {/* Drag & Drop File Uploader */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`p-8 rounded-3xl border-2 border-dashed transition-all duration-200 text-center relative ${
          isDragging
            ? 'border-purple-400 bg-purple-950/30'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mid,.midi"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-400 mx-auto flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Upload Your Own MIDI Files</h3>
            <p className="text-xs text-slate-400 mt-1">
              Drag & drop .mid or .midi files here, or browse from your disk (up to 10 MB per file).
            </p>
          </div>

          {/* Genre selector for upload */}
          <div className="inline-flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 pl-2">Assign Genre:</span>
            {['Classical', 'Jazz', 'Pop', 'Custom'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedGenre === g
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              {isUploading ? 'Uploading...' : 'Browse Local Files'}
            </button>
          </div>
        </div>
      </div>

      {/* Loaded Files Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Loaded Dataset Files</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {files.length}
            </span>
          </h2>
          <span className="text-xs text-slate-400">Click play on any piece to audition</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Track Preview</th>
                <th className="py-3 px-4">File Name & Title</th>
                <th className="py-3 px-4">Genre</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Tracks</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {files.map((file) => {
                const isPlaying = playingFileId === file.id;
                return (
                  <tr key={file.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handlePlayPreview(file)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 animate-pulse'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                        title={isPlaying ? "Pause preview" : "Listen in browser"}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{file.filename}</div>
                      {file.description && (
                        <div className="text-[11px] text-slate-400">{file.description}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        file.genre === 'Classical'
                          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          : file.genre === 'Jazz'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {file.genre}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">{file.duration}s</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{file.tracks}</td>
                    <td className="py-3 px-4 font-mono text-purple-300 font-semibold">{file.notes_count}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{file.size_kb} KB</td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteFile(file.id, file.filename)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {files.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No MIDI files loaded. Click "Download Sample Dataset" above to seed classical & jazz files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
